import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { getCollections } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const normalizedIdentifier = identifier.toLowerCase().trim();

    const rateCheck = checkRateLimit(`login:${ip}:${normalizedIdentifier}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    const { users } = await getCollections();

    // Query user by email OR username (case-insensitive)
    const user = await users.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    });

    if (!user) {
      await logActivity({
        action: "AUTH_LOGIN_FAILED",
        metadata: { reason: "User not found", identifier: normalizedIdentifier },
        ip,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(
        { error: "Invalid username/email or password." },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      await logActivity({
        action: "AUTH_LOGIN_FAILED",
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        metadata: { reason: "Incorrect password" },
        ip,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(
        { error: "Invalid username/email or password." },
        { status: 401 }
      );
    }

    // Check email verification
    if (!user.isEmailVerified && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Your email address is not verified yet. Please verify your account.",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Check account status
    if (user.status === "DISABLED") {
      if (user.disabledUntil && new Date(user.disabledUntil) <= new Date()) {
        // Automatically reactivate expired temporary disable
        await users.updateOne(
          { _id: user._id },
          { $set: { status: "ACTIVE", disabledUntil: null, updatedAt: new Date() } }
        );
        user.status = "ACTIVE";
      } else {
        const untilText = user.disabledUntil
          ? ` until ${new Date(user.disabledUntil).toLocaleString()}`
          : "";
        return NextResponse.json(
          { error: `Your account is temporarily disabled${untilText}. Please contact administrator.` },
          { status: 403 }
        );
      }
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been permanently suspended." },
        { status: 403 }
      );
    }

    // Set secure HTTP-only cookie
    await setSessionCookie({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      displayName: user.displayName || user.username,
      role: user.role,
      status: user.status,
    });

    await logActivity({
      action: "AUTH_LOGIN_SUCCESS",
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
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName || user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error("[Login Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
