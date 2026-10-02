import { NextRequest, NextResponse } from "next/server";
import { createCollectionSchema } from "@/lib/validations/collection";
import { getCollections, ensureIndexes } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { Collection } from "@/types";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { collections } = await getCollections();

    const cursor = await collections.find(
      { ownerId: user._id.toString() },
      { sort: { createdAt: -1 } }
    );
    const items = await cursor.toArray();

    return NextResponse.json({ collections: items });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Get Collections Error]", err);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = createCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid collection data" },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;
    await ensureIndexes();
    const { collections } = await getCollections();

    const now = new Date();
    const collectionId = new ObjectId();
    const newCollection: Collection = {
      _id: collectionId,
      name,
      description: description || "",
      ownerId: user._id.toString(),
      applicationIds: [],
      createdAt: now,
      updatedAt: now,
    };

    await collections.insertOne(newCollection);

    await logActivity({
      action: "COLLECTION_CREATE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "COLLECTION",
      targetId: collectionId.toString(),
      metadata: { name },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Collection created successfully",
        collection: newCollection,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Create Collection Error]", err);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
