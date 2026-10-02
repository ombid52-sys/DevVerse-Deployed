import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getCollections } from "@/lib/db";
import { Visibility } from "@/types";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const visibility = searchParams.get("visibility") as Visibility | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    const { applications } = await getCollections();
    const query: Record<string, any> = {};

    if (visibility) {
      query.visibility = visibility;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { ownerUsername: { $regex: search, $options: "i" } },
      ];
    }

    const total = await applications.countDocuments(query);
    const skip = (page - 1) * limit;

    const cursor = await applications.find(query, {
      sort: { createdAt: -1 },
      skip,
      limit,
    });
    const items = await cursor.toArray();

    return NextResponse.json({
      applications: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Admin Apps Error]", err);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
