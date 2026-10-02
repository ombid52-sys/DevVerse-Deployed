import { NextRequest, NextResponse } from "next/server";
import { resendCodeSchema } from "@/lib/validations/auth";
import { getCollections } from "@/lib/db";
import { generateVerificationCode } from "@/lib/auth";
import { sendVerificationCodeEmail, sendPasswordResetEmail } from "@/lib/email";
import { logActivity } from "@/lib/audit";
import { AUTH_LIMITS } from "@/lib/constants";
import { VerificationCode } from "@/types";
import { getClientIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();

    const parsed = resendCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, type } = parsed.data;
    const { users, verificationCodes } = await getCollections();

    const user = await users.findOne({ email });
    if (!user) {
      // Don't disclose whether email exists
      return NextResponse.json({
        success: true,
        message: "If the email is registered, a new code has been sent.",
      });
    }

    // Check resend cooldown
    const latestCode = await verificationCodes.findOne({
      email,
      type,
      used: false,
    });

    if (latestCode) {
      const createdAt = new Date(latestCode.createdAt).getTime();
      const diffSecs = Math.floor((Date.now() - createdAt) / 1000);
      if (diffSecs < AUTH_LIMITS.RESEND_COOLDOWN_SECONDS) {
        const remaining = AUTH_LIMITS.RESEND_COOLDOWN_SECONDS - diffSecs;
        return NextResponse.json(
          { error: `Please wait ${remaining} seconds before requesting another code.` },
          { status: 429 }
        );
      }

      // Invalidate previous code
      await verificationCodes.updateOne(
        { _id: latestCode._id },
        { $set: { used: true } }
      );
    }

    const newCode = generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + AUTH_LIMITS.VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

    const newRecord: VerificationCode = {
      userId: user._id,
      email,
      code: newCode,
      type,
      expiresAt,
      attempts: 0,
      used: false,
      createdAt: now,
    };

    await verificationCodes.insertOne(newRecord);

    if (type === "REGISTRATION") {
      sendVerificationCodeEmail(email, newCode, user.username).catch((err) => {
        console.error("[Resend Code Email Error]", err.message);
      });
    } else {
      sendPasswordResetEmail(email, newCode, user.username).catch((err) => {
        console.error("[Resend Password Reset Email Error]", err.message);
      });
    }

    await logActivity({
      action: "AUTH_RESEND_CODE",
      actorId: user._id.toString(),
      actorEmail: email,
      actorRole: user.role,
      targetType: "VERIFICATION_CODE",
      metadata: { type },
      ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "A new verification code has been dispatched to your email address.",
    });
  } catch (err: any) {
    console.error("[Resend Code Error]", err);
    return NextResponse.json(
      { error: "Failed to resend verification code." },
      { status: 500 }
    );
  }
}
