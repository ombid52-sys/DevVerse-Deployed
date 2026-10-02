import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { getCollections, ensureIndexes } from "@/lib/db";
import { hashPassword, generateVerificationCode } from "@/lib/auth";
import { sendVerificationCodeEmail } from "@/lib/email";
import { logActivity } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/lib/constants";
import { User, VerificationCode } from "@/types";
import { ObjectId } from "mongodb";
import { getClientIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`register:${ip}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { username, email, password, role } = parsed.data;

    await ensureIndexes();
    const { users, verificationCodes } = await getCollections();

    // Check if email already registered
    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // Check if username already taken
    const existingUsername = await users.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();
    const userId = new ObjectId();

    const newUser: User = {
      _id: userId,
      email,
      username,
      displayName: username,
      passwordHash,
      role,
      status: "ACTIVE",
      disabledUntil: null,
      bio: "",
      avatarUrl: "",
      isEmailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    await users.insertOne(newUser);

    // Generate 6-digit verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(now.getTime() + AUTH_LIMITS.VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

    const verificationRecord: VerificationCode = {
      userId,
      email,
      code,
      type: "REGISTRATION",
      expiresAt,
      attempts: 0,
      used: false,
      createdAt: now,
    };

    await verificationCodes.insertOne(verificationRecord);

    // Dispatch verification email asynchronously so UI advances instantly to /verify
    sendVerificationCodeEmail(email, code, username).catch((err) => {
      console.error("[Register Email Dispatch Error]", err.message);
    });

    // Write audit log
    await logActivity({
      action: "AUTH_REGISTER",
      actorId: userId.toString(),
      actorEmail: email,
      actorRole: role,
      targetType: "USER",
      targetId: userId.toString(),
      metadata: { username, role },
      ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please verify your email with the 6-digit code sent to your inbox.",
        email,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Register Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
