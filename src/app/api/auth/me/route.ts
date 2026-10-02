import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { user: null },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          displayName: user.displayName || user.username,
          role: user.role,
          status: user.status,
          bio: user.bio || "",
          avatarUrl: user.avatarUrl || "",
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err: any) {
    if (err.statusCode) {
      return NextResponse.json(
        { error: err.message, user: null },
        {
          status: err.statusCode,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        }
      );
    }
    return NextResponse.json(
      { user: null },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
