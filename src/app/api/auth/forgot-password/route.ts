import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { getCollections } from "@/lib/db";
import { generateVerificationCode } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { logActivity } from "@/lib/audit";
import { AUTH_LIMITS } from "@/lib/constants";
import { VerificationCode } from "@/types";
import { getClientIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const { users, verificationCodes } = await getCollections();

    const user = await users.findOne({ email });
    if (user) {
      // Invalidate existing reset codes
      await verificationCodes.updateOne(
        { email, type: "PASSWORD_RESET", used: false },
        { $set: { used: true } }
      );

      const code = generateVerificationCode();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + AUTH_LIMITS.VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

      const resetRecord: VerificationCode = {
        userId: user._id,
        email,
        code,
        type: "PASSWORD_RESET",
        expiresAt,
        attempts: 0,
        used: false,
        createdAt: now,
      };

      await verificationCodes.insertOne(resetRecord);
      sendPasswordResetEmail(email, code, user.username).catch((err) => {
        console.error("[Forgot Password Email Error]", err.message);
      });

      await logActivity({
        action: "AUTH_FORGOT_PASSWORD_REQUEST",
        actorId: user._id.toString(),
        actorEmail: email,
        actorRole: user.role,
        targetType: "USER",
        targetId: user._id.toString(),
        ip,
        userAgent: req.headers.get("user-agent") || undefined,
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If that email address is in our database, a password reset code has been sent.",
    });
  } catch (err: any) {
    console.error("[Forgot Password Error]", err);
    return NextResponse.json(
      { error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
