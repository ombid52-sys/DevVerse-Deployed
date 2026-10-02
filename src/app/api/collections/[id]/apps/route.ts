import { NextRequest, NextResponse } from "next/server";
import { getCollections, toObjectId } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
    }

    const { collections, applications } = await getCollections();
    const collection = await collections.findOne({ _id: toObjectId(id) });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.ownerId.toString() !== user._id.toString() && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Verify application exists
    const app = await applications.findOne({ _id: toObjectId(applicationId), isDeleted: false });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const appIdStr = app._id.toString();
    const existingIds = (collection.applicationIds || []).map((i: any) => i.toString());

    // Prevent duplicate entries
    if (existingIds.includes(appIdStr)) {
      return NextResponse.json(
        { error: "Application is already in this collection" },
        { status: 409 }
      );
    }

    await collections.updateOne(
      { _id: collection._id },
      {
        $push: { applicationIds: appIdStr },
        $set: { updatedAt: new Date() },
      }
    );

    await logActivity({
      action: "COLLECTION_ADD_APP",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "COLLECTION",
      targetId: id,
      metadata: { applicationId: appIdStr, appName: app.name },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Application added to collection",
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Add App To Collection Error]", err);
    return NextResponse.json({ error: "Failed to add application to collection" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
    }

    const { collections } = await getCollections();
    const collection = await collections.findOne({ _id: toObjectId(id) });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.ownerId.toString() !== user._id.toString() && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const appIdStr = applicationId.toString();
    await collections.updateOne(
      { _id: collection._id },
      {
        $pull: { applicationIds: appIdStr },
        $set: { updatedAt: new Date() },
      }
    );

    await logActivity({
      action: "COLLECTION_REMOVE_APP",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "COLLECTION",
      targetId: id,
      metadata: { applicationId: appIdStr },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Application removed from collection",
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Remove App From Collection Error]", err);
    return NextResponse.json({ error: "Failed to remove application from collection" }, { status: 500 });
  }
}
