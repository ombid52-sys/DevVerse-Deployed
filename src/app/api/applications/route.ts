import { NextRequest, NextResponse } from "next/server";
import { createApplicationSchema } from "@/lib/validations/application";
import { getCollections, ensureIndexes, toObjectId } from "@/lib/db";
import { getAuthenticatedUser, requireDeveloper, AuthError } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { Application, Category, Platform } from "@/types";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") as Category | null;
    const platform = searchParams.get("platform") as Platform | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const sort = searchParams.get("sort") || "newest";
    const mine = searchParams.get("mine") === "true";

    const { applications } = await getCollections();
    const query: Record<string, any> = { isDeleted: false };

    const currentUser = await getAuthenticatedUser();

    if (mine) {
      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      query.ownerId = currentUser._id.toString();
    } else {
      query.visibility = "PUBLIC";
    }

    if (category) {
      query.category = category;
    }

    if (platform) {
      query.platform = platform;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions: Record<string, number> = {};
    if (sort === "oldest") {
      sortOptions.createdAt = 1;
    } else if (sort === "name") {
      sortOptions.name = 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (page - 1) * limit;
    const total = await applications.countDocuments(query);
    const cursor = await applications.find(query, {
      sort: sortOptions as any,
      skip,
      limit,
    });
    const items = await cursor.toArray();

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    console.error("[Get Applications Error]", err);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireDeveloper();
    const body = await req.json();

    const parsed = createApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid application data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    await ensureIndexes();
    const { applications } = await getCollections();

    // Check slug collision
    const existing = await applications.findOne({ slug: data.slug });
    if (existing) {
      return NextResponse.json(
        { error: "An application with this URL slug already exists. Please choose a different slug." },
        { status: 409 }
      );
    }

    const now = new Date();
    const newApp: Application = {
      _id: new ObjectId(),
      name: data.name,
      slug: data.slug,
      description: data.description,
      ownerId: user._id.toString(),
      ownerUsername: user.username,
      platform: data.platform,
      category: data.category,
      thumbnailUrl: data.thumbnailUrl,
      heroBannerUrl: data.heroBannerUrl || "",
      screenshots: data.screenshots || [],
      runtimeUrl: data.runtimeUrl || "",
      isRunnable: Boolean(data.isRunnable),
      runtimeType: data.isRunnable
        ? (data.runtimeType || (data.runtimeUrl && data.entrypointPath ? "BOTH" : data.runtimeUrl ? "EXTERNAL_URL" : "STATIC_ZIP"))
        : null,
      entrypointPath: data.isRunnable && (data.runtimeType === "STATIC_ZIP" || data.runtimeType === "BOTH" || !data.runtimeUrl)
        ? (data.entrypointPath?.trim() || "index.html")
        : (data.entrypointPath?.trim() || null),
      visibility: data.visibility,
      sourceStatus: "NOT_UPLOADED",
      sourceArchiveSize: 0,
      sourceStorageKey: null,
      sourceDriveFileId: null,
      sourceFileCount: 0,
      sourceTree: [],
      languages: [],
      sourceError: null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await applications.insertOne(newApp);
    newApp._id = result.insertedId;

    await logActivity({
      action: "APP_CREATE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "APPLICATION",
      targetId: result.insertedId.toString(),
      metadata: { name: newApp.name, slug: newApp.slug, visibility: newApp.visibility },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application created successfully",
        application: newApp,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Create App Error]", err);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
