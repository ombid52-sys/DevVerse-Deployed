import { NextRequest, NextResponse } from "next/server";
import { updateCollectionSchema } from "@/lib/validations/collection";
import { getCollections, toObjectId } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { collections, applications } = await getCollections();

    const collection = await collections.findOne({ _id: toObjectId(id) });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.ownerId.toString() !== user._id.toString() && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied to this collection" }, { status: 403 });
    }

    // Populate applications
    let apps: any[] = [];
    if (collection.applicationIds && collection.applicationIds.length > 0) {
      const appIds = collection.applicationIds.map((appId: any) => toObjectId(appId));
      const cursor = await applications.find({
        _id: { $in: appIds },
        isDeleted: false,
      });
      apps = await cursor.toArray();
    }

    return NextResponse.json({
      collection: {
        ...collection,
        applications: apps,
      },
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Get Collection Error]", err);
    return NextResponse.json({ error: "Failed to retrieve collection" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { collections } = await getCollections();

    const collection = await collections.findOne({ _id: toObjectId(id) });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.ownerId.toString() !== user._id.toString() && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    await collections.updateOne(
      { _id: collection._id },
      { $set: { ...parsed.data, updatedAt: new Date() } }
    );

    await logActivity({
      action: "COLLECTION_UPDATE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "COLLECTION",
      targetId: id,
      metadata: { updatedFields: Object.keys(parsed.data) },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    const updated = await collections.findOne({ _id: collection._id });
    return NextResponse.json({
      success: true,
      message: "Collection updated successfully",
      collection: updated,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Update Collection Error]", err);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { collections } = await getCollections();

    const collection = await collections.findOne({ _id: toObjectId(id) });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.ownerId.toString() !== user._id.toString() && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await collections.deleteOne({ _id: collection._id });

    await logActivity({
      action: "COLLECTION_DELETE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "COLLECTION",
      targetId: id,
      metadata: { name: collection.name },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Delete Collection Error]", err);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
