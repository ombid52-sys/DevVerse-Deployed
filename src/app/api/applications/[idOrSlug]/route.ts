import { NextRequest, NextResponse } from "next/server";
import { updateApplicationSchema } from "@/lib/validations/application";
import { getCollections, toObjectId } from "@/lib/db";
import { getAuthenticatedUser, requireAuth, AuthError } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { getStorageService } from "@/lib/storage/storage-manager";
import { ObjectId } from "mongodb";

async function findApp(idOrSlug: string) {
  const { applications } = await getCollections();
  let query: any = { isDeleted: false };
  if (ObjectId.isValid(idOrSlug) && idOrSlug.length === 24) {
    query.$or = [{ _id: toObjectId(idOrSlug) }, { slug: idOrSlug }];
  } else {
    query.slug = idOrSlug;
  }
  return applications.findOne(query);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await params;
    const app = await findApp(idOrSlug);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (app.visibility === "PRIVATE") {
      const currentUser = await getAuthenticatedUser();
      const isOwner = currentUser && currentUser._id.toString() === app.ownerId.toString();
      const isAdmin = currentUser?.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "This application is private and accessible only to the owner." },
          { status: 403 }
        );
      }
    }

    const { users } = await getCollections();
    let ownerAvatarUrl = "";
    let ownerDisplayName = app.ownerUsername;
    let ownerBio = "";
    if (app.ownerId) {
      try {
        const ownerUser = await users.findOne({ _id: toObjectId(app.ownerId) });
        if (ownerUser) {
          ownerAvatarUrl = ownerUser.avatarUrl || "";
          ownerDisplayName = ownerUser.displayName || ownerUser.username;
          ownerBio = ownerUser.bio || "";
        }
      } catch {
        // ignore fallback
      }
    }

    return NextResponse.json({
      application: {
        ...app,
        ownerAvatarUrl,
        ownerDisplayName,
        ownerBio,
      },
    });
  } catch (err: any) {
    console.error("[Get App Detail Error]", err);
    return NextResponse.json({ error: "Failed to retrieve application" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const user = await requireAuth();
    const { idOrSlug } = await params;
    const app = await findApp(idOrSlug);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const isOwner = user._id.toString() === app.ownerId.toString();
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to edit this application." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const { applications } = await getCollections();

    // Check slug collision if slug changed
    if (data.slug && data.slug !== app.slug) {
      const existing = await applications.findOne({
        slug: data.slug,
        _id: { $ne: app._id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This URL slug is already in use by another application." },
          { status: 409 }
        );
      }
    }

    const updateFields: any = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.isRunnable !== undefined) {
      updateFields.isRunnable = Boolean(data.isRunnable);
      if (!data.isRunnable) {
        updateFields.runtimeType = null;
        updateFields.entrypointPath = null;
      } else {
        const nextRuntimeUrl = data.runtimeUrl !== undefined ? data.runtimeUrl.trim() : (app.runtimeUrl || "");
        const nextEntrypoint = data.entrypointPath !== undefined ? data.entrypointPath?.trim() : (app.entrypointPath || "index.html");
        const nextType = data.runtimeType || (
          nextRuntimeUrl && nextEntrypoint ? "BOTH" : nextRuntimeUrl ? "EXTERNAL_URL" : "STATIC_ZIP"
        );
        updateFields.runtimeType = nextType;
        if (nextType === "STATIC_ZIP" || nextType === "BOTH") {
          updateFields.entrypointPath = nextEntrypoint || "index.html";
        } else {
          updateFields.entrypointPath = data.entrypointPath?.trim() || null;
        }
      }
    } else {
      if (data.runtimeType !== undefined) updateFields.runtimeType = data.runtimeType;
      if (data.entrypointPath !== undefined) updateFields.entrypointPath = data.entrypointPath;
    }

    await applications.updateOne({ _id: app._id }, { $set: updateFields });

    await logActivity({
      action: "APP_UPDATE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "APPLICATION",
      targetId: app._id.toString(),
      metadata: { slug: data.slug || app.slug, updatedFields: Object.keys(data) },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    const updatedApp = await applications.findOne({ _id: app._id });

    return NextResponse.json({
      success: true,
      message: "Application updated successfully",
      application: updatedApp,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Update App Error]", err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const user = await requireAuth();
    const { idOrSlug } = await params;
    const app = await findApp(idOrSlug);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const isOwner = user._id.toString() === app.ownerId.toString();
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to delete this application." },
        { status: 403 }
      );
    }

    const { applications, favorites, collections } = await getCollections();
    const appIdStr = app._id.toString();

    // Soft delete or remove application
    await applications.updateOne(
      { _id: app._id },
      { $set: { isDeleted: true, updatedAt: new Date() } }
    );

    // Clean B2 Storage cloud storage data
    try {
      const storage = getStorageService();
      await storage.deleteAppFolder(appIdStr);
    } catch (storageErr: any) {
      console.warn("[App Delete Storage Cleanup Warning]", storageErr.message);
    }

    // Clean favorites
    await favorites.deleteMany({
      $or: [{ applicationId: appIdStr }, { applicationId: app._id }],
    });

    // Remove from collections
    await collections.updateOne(
      {},
      { $pull: { applicationIds: appIdStr } }
    );

    await logActivity({
      action: "APP_DELETE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "APPLICATION",
      targetId: appIdStr,
      metadata: { name: app.name, slug: app.slug },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Delete App Error]", err);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
