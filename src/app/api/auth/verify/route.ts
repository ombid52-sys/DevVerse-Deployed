import { NextRequest, NextResponse } from "next/server";
import { verifyCodeSchema } from "@/lib/validations/auth";
import { getCollections, toObjectId } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/lib/constants";
import { getClientIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();

    const parsed = verifyCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, code, type } = parsed.data;

    const rateCheck = checkRateLimit(`verify:${email}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please request a new code." },
        { status: 429 }
      );
    }

    const { users, verificationCodes } = await getCollections();

    // Find the latest active verification code for this email and type
    const record = await verificationCodes.findOne(
      {
        email,
        type,
        used: false,
      },
      { sort: { createdAt: -1 } }
    );

    if (!record) {
      return NextResponse.json(
        { error: "No active verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check failed attempts
    if (record.attempts >= AUTH_LIMITS.MAX_VERIFICATION_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(record.expiresAt)) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Check code match
    if (record.code !== code) {
      await verificationCodes.updateOne(
        { _id: record._id },
        { $set: { attempts: record.attempts + 1 } }
      );
      return NextResponse.json(
        { error: `Invalid verification code. ${AUTH_LIMITS.MAX_VERIFICATION_ATTEMPTS - (record.attempts + 1)} attempts remaining.` },
        { status: 400 }
      );
    }

    // Mark code as used
    await verificationCodes.updateOne(
      { _id: record._id },
      { $set: { used: true, updatedAt: new Date() } }
    );

    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Associated user account not found" },
        { status: 404 }
      );
    }

    if (type === "REGISTRATION") {
      // Activate email verified status
      await users.updateOne(
        { _id: user._id },
        { $set: { isEmailVerified: true, updatedAt: new Date() } }
      );

      // Establish session cookie
      await setSessionCookie({
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName || user.username,
        role: user.role,
        status: user.status,
      });

      await logActivity({
        action: "AUTH_VERIFY_EMAIL",
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        targetType: "USER",
        targetId: user._id.toString(),
        metadata: { type: "REGISTRATION" },
        ip,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json({
        success: true,
        message: "Email successfully verified! You are now logged in.",
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          displayName: user.displayName || user.username,
          role: user.role,
          status: user.status,
        },
      });
    }

    // If PASSWORD_RESET, return verified confirmation so client can submit new password
    await logActivity({
      action: "AUTH_VERIFY_RESET_CODE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "USER",
      targetId: user._id.toString(),
      metadata: { type: "PASSWORD_RESET" },
      ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Code verified successfully.",
    });
  } catch (err: any) {
    console.error("[Verify Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during verification." },
      { status: 500 }
    );
  }
}
