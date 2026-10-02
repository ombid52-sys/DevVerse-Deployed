import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { getCollections } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { clearSessionCookie } from "@/lib/session";
import { AUTH_LIMITS } from "@/lib/constants";
import { getClientIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, code, newPassword } = parsed.data;
    const { users, verificationCodes } = await getCollections();

    const record = await verificationCodes.findOne({
      email,
      type: "PASSWORD_RESET",
      used: false,
    });

    if (!record) {
      return NextResponse.json(
        { error: "No active password reset request found. Please request a new code." },
        { status: 400 }
      );
    }

    if (record.attempts >= AUTH_LIMITS.MAX_VERIFICATION_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(record.expiresAt)) {
      return NextResponse.json(
        { error: "Password reset code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (record.code !== code) {
      await verificationCodes.updateOne(
        { _id: record._id },
        { $set: { attempts: record.attempts + 1 } }
      );
      return NextResponse.json(
        { error: "Invalid reset code." },
        { status: 400 }
      );
    }

    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await hashPassword(newPassword);

    await users.updateOne(
      { _id: user._id },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    await verificationCodes.updateOne(
      { _id: record._id },
      { $set: { used: true } }
    );

    // Invalidate existing session cookie
    await clearSessionCookie();

    await logActivity({
      action: "AUTH_RESET_PASSWORD_SUCCESS",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "USER",
      targetId: user._id.toString(),
      ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You may now log in with your new password.",
    });
  } catch (err: any) {
    console.error("[Reset Password Error]", err);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
