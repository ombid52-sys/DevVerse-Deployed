import { NextRequest, NextResponse } from "next/server";
import { getCollections, toObjectId, ensureIndexes } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { Favorite } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { favorites, applications } = await getCollections();

    const userFavsCursor = await favorites.find({ userId: user._id.toString() });
    const userFavs = await userFavsCursor.toArray();

    if (userFavs.length === 0) {
      return NextResponse.json({ favorites: [] });
    }

    const appIds = userFavs.map((f: Favorite) => toObjectId(f.applicationId));
    const appsCursor = await applications.find({
      _id: { $in: appIds },
      isDeleted: false,
    });
    const apps = await appsCursor.toArray();

    return NextResponse.json({ favorites: apps });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Get Favorites Error]", err);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
    }

    await ensureIndexes();
    const { favorites, applications } = await getCollections();

    // Verify application exists and is public (or user is owner/admin)
    const app = await applications.findOne({ _id: toObjectId(applicationId), isDeleted: false });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (app.visibility === "PRIVATE" && app.ownerId !== user._id.toString() && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Cannot favorite private application" }, { status: 403 });
    }

    const existing = await favorites.findOne({
      userId: user._id.toString(),
      applicationId: app._id.toString(),
    });

    if (existing) {
      // Toggle off / Unfavourite
      await favorites.deleteOne({ _id: existing._id });

      await logActivity({
        action: "APP_UNFAVORITE",
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        targetType: "APPLICATION",
        targetId: app._id.toString(),
        metadata: { appName: app.name },
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json({
        success: true,
        favorited: false,
        message: "Removed from favorites",
      });
    }

    // Toggle on / Favourite
    const newFav: Favorite = {
      userId: user._id.toString(),
      applicationId: app._id.toString(),
      createdAt: new Date(),
    };

    await favorites.insertOne(newFav);

    await logActivity({
      action: "APP_FAVORITE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "APPLICATION",
      targetId: app._id.toString(),
      metadata: { appName: app.name },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      favorited: true,
      message: "Added to favorites",
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Toggle Favorite Error]", err);
    return NextResponse.json({ error: "Failed to update favorite status" }, { status: 500 });
  }
}
