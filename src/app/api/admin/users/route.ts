import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getCollections } from "@/lib/db";
import { Role, AccountStatus, User } from "@/types";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role") as Role | null;
    const status = searchParams.get("status") as AccountStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    const { users } = await getCollections();
    const query: Record<string, any> = {};

    if (role) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
      ];
    }

    const total = await users.countDocuments(query);
    const skip = (page - 1) * limit;

    const cursor = await users.find(query, {
      sort: { createdAt: -1 },
      skip,
      limit,
    });
    const rawUsers = await cursor.toArray();

    // Sanitize users list (never expose password hashes)
    const sanitizedUsers = rawUsers.map((u: User) => ({
      id: u._id.toString(),
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      status: u.status,
      disabledUntil: u.disabledUntil,
      isEmailVerified: u.isEmailVerified,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json({
      users: sanitizedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Admin Users List Error]", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
