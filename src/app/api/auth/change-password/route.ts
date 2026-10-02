import { NextRequest, NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validations/auth";
import { requireAuth, verifyPassword, hashPassword, AuthError } from "@/lib/auth";
import { getCollections } from "@/lib/db";
import { logActivity } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);
    const { users } = await getCollections();

    await users.updateOne(
      { _id: user._id },
      { $set: { passwordHash: newPasswordHash, updatedAt: new Date() } }
    );

    await logActivity({
      action: "AUTH_CHANGE_PASSWORD",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "USER",
      targetId: user._id.toString(),
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Change Password Error]", err);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
