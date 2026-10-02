import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/session";
import { logActivity } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      await logActivity({
        action: "AUTH_LOGOUT",
        actorId: session.userId,
        actorEmail: session.email,
        actorRole: session.role,
        targetType: "USER",
        targetId: session.userId,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    console.error("[Logout Error]", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
