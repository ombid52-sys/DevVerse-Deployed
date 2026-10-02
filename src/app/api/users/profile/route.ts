import { NextRequest, NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validations/auth";
import { requireAuth, AuthError } from "@/lib/auth";
import { getCollections } from "@/lib/db";
import { logActivity } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { displayName, bio, avatarUrl } = parsed.data;
    const { users } = await getCollections();

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          displayName,
          bio: bio || "",
          avatarUrl: avatarUrl || "",
          updatedAt: new Date(),
        },
      }
    );

    await logActivity({
      action: "USER_UPDATE_PROFILE",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "USER",
      targetId: user._id.toString(),
      metadata: { displayName, bioLength: bio?.length || 0 },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName,
        bio: bio || "",
        avatarUrl: avatarUrl || "",
        role: user.role,
      },
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Profile Update Error]", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
