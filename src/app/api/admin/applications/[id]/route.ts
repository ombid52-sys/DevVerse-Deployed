import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getCollections, toObjectId } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { getStorageService } from "@/lib/storage/storage-manager";
import { z } from "zod";

const adminUpdateAppSchema = z.object({
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  isDeleted: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const parsed = adminUpdateAppSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { applications } = await getCollections();
    const app = await applications.findOne({ _id: toObjectId(id) });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    await applications.updateOne(
      { _id: app._id },
      { $set: { ...parsed.data, updatedAt: new Date() } }
    );

    await logActivity({
      action: "ADMIN_APP_UPDATE",
      actorId: admin._id.toString(),
      actorEmail: admin.email,
      actorRole: "ADMIN",
      targetType: "APPLICATION",
      targetId: id,
      metadata: { previousVisibility: app.visibility, ...parsed.data },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, message: "Application updated by administrator" });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Admin Update App Error]", err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { applications, favorites, collections } = await getCollections();

    const app = await applications.findOne({ _id: toObjectId(id) });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const appIdStr = app._id.toString();

    // Cascading cleanups
    await applications.deleteOne({ _id: app._id });

    try {
      const storage = getStorageService();
      await storage.deleteAppFolder(appIdStr);
    } catch (storageErr: any) {
      console.warn("[Admin Delete App Storage Cleanup Warning]", storageErr.message);
    }

    await favorites.deleteMany({
      $or: [{ applicationId: appIdStr }, { applicationId: app._id }],
    });

    await collections.updateOne(
      {},
      { $pull: { applicationIds: appIdStr } }
    );

    await logActivity({
      action: "ADMIN_APP_PERMANENT_DELETE",
      actorId: admin._id.toString(),
      actorEmail: admin.email,
      actorRole: "ADMIN",
      targetType: "APPLICATION",
      targetId: appIdStr,
      metadata: { name: app.name, slug: app.slug },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Application permanently deleted with storage and references cleaned.",
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Admin Delete App Error]", err);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
