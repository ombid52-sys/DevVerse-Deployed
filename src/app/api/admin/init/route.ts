import { NextRequest, NextResponse } from "next/server";
import { adminInitSchema } from "@/lib/validations/admin";
import { getCollections, ensureIndexes, toObjectId } from "@/lib/db";
import { ObjectId } from "mongodb";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { User } from "@/types";

export async function GET() {
  try {
    const { users } = await getCollections();
    const existingAdmin = await users.findOne({ role: "ADMIN" });
    return NextResponse.json({ initialized: Boolean(existingAdmin) });
  } catch (err: any) {
    console.error("[Admin Check Error]", err);
    return NextResponse.json({ initialized: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = adminInitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid admin initialization data" },
        { status: 400 }
      );
    }

    const { email, username, displayName, password, bootstrapToken } = parsed.data;

    // Optional environment bootstrap token check
    const configuredToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (configuredToken && bootstrapToken !== configuredToken) {
      return NextResponse.json(
        { error: "Invalid admin bootstrap token" },
        { status: 403 }
      );
    }

    await ensureIndexes();
    const { users } = await getCollections();

    // Enforce exactly one administrative account
    const existingAdmin = await users.findOne({ role: "ADMIN" });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Platform administrator account has already been initialized. Only exactly one admin account is permitted." },
        { status: 400 }
      );
    }

    // Check if email or username already taken
    const existingUser = await users.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email or username is already in use." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();
    const adminId = new ObjectId();

    const adminUser: User = {
      _id: adminId,
      email,
      username,
      displayName,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      disabledUntil: null,
      bio: "DevVerse Platform Administrator",
      avatarUrl: "",
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    await users.insertOne(adminUser);

    await setSessionCookie({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      username: adminUser.username,
      displayName: adminUser.displayName,
      role: "ADMIN",
      status: "ACTIVE",
    });

    await logActivity({
      action: "ADMIN_INITIALIZED",
      actorId: adminUser._id.toString(),
      actorEmail: adminUser.email,
      actorRole: "ADMIN",
      targetType: "USER",
      targetId: adminUser._id.toString(),
      metadata: { username, email },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Administrator account provisioned successfully.",
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          username: adminUser.username,
          displayName: adminUser.displayName,
          role: "ADMIN",
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Admin Init Error]", err);
    return NextResponse.json(
      { error: "Failed to initialize administrator account" },
      { status: 500 }
    );
  }
}
