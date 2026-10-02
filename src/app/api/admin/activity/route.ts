import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getCollections } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const action = searchParams.get("action")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

    const { activityLogs } = await getCollections();
    const query: Record<string, any> = {};

    if (action) {
      query.action = action;
    }
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { actorEmail: { $regex: search, $options: "i" } },
        { targetType: { $regex: search, $options: "i" } },
        { targetId: { $regex: search, $options: "i" } },
      ];
    }

    const total = await activityLogs.countDocuments(query);
    const skip = (page - 1) * limit;

    const cursor = await activityLogs.find(query, {
      sort: { timestamp: -1 },
      skip,
      limit,
    });
    const logs = await cursor.toArray();

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Get Activity Logs Error]", err);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
