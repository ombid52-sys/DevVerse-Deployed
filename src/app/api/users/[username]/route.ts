import { NextRequest, NextResponse } from "next/server";
import { getCollections } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { users, applications } = await getCollections();

    const user = await users.findOne({ username: username.toLowerCase() });
    if (!user || user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    // Fetch published public applications
    const appsResult = await applications.find({
      ownerId: user._id.toString(),
      visibility: "PUBLIC",
      isDeleted: false,
    });
    const apps = await appsResult.toArray();

    return NextResponse.json({
      developer: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        role: user.role,
        createdAt: user.createdAt,
      },
      applications: apps,
    });
  } catch (err: any) {
    console.error("[Developer Profile Error]", err);
    return NextResponse.json({ error: "Failed to load developer profile" }, { status: 500 });
  }
}
