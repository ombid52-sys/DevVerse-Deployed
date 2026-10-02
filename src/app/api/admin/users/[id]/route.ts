import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getCollections, toObjectId } from "@/lib/db";
import { updateUserStatusSchema } from "@/lib/validations/admin";
import { logActivity } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { users, activityLogs } = await getCollections();

    const user = await users.findOne({ _id: toObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const logsCursor = await activityLogs.find(
      { actorId: user._id.toString() },
      { sort: { timestamp: -1 }, limit: 20 }
    );
    const recentActivity = await logsCursor.toArray();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        disabledUntil: user.disabledUntil,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      recentActivity,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Admin Get User Error]", err);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const parsed = updateUserStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid status payload" },
        { status: 400 }
      );
    }

    const { status, disabledUntil, reason } = parsed.data;
    const { users } = await getCollections();

    const targetUser = await users.findOne({ _id: toObjectId(id) });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protect admin account from self-suspension/disabling
    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Administrative accounts cannot be disabled or suspended." },
        { status: 403 }
      );
    }

    const updateFields: any = {
      status,
      disabledUntil: status === "DISABLED" && disabledUntil ? new Date(disabledUntil) : null,
      updatedAt: new Date(),
    };

    await users.updateOne({ _id: targetUser._id }, { $set: updateFields });

    await logActivity({
      action: `ADMIN_USER_STATUS_${status}`,
      actorId: admin._id.toString(),
      actorEmail: admin.email,
      actorRole: "ADMIN",
      targetType: "USER",
      targetId: targetUser._id.toString(),
      metadata: {
        previousStatus: targetUser.status,
        newStatus: status,
        disabledUntil: updateFields.disabledUntil,
        reason: reason || undefined,
        targetUsername: targetUser.username,
      },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `User status changed to ${status}`,
      status,
      disabledUntil: updateFields.disabledUntil,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Admin Update User Status Error]", err);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
