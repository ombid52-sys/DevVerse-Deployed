import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "unknown";
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    dbStatus = "connected";
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const endpoint = process.env.B2_ENDPOINT?.trim();
  const keyId = (process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID)?.trim();
  const appKey = process.env.B2_APPLICATION_KEY?.trim();
  const bucket = process.env.B2_BUCKET_NAME?.trim();
  const isB2Configured = Boolean(endpoint && keyId && appKey && bucket);
  const storageProvider = isB2Configured ? "B2 Storage" : "unconfigured";

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    service: "DevVerse Platform",
    database: {
      type: "MongoDB Atlas",
      status: dbStatus,
    },
    storage: {
      provider: storageProvider,
      isPersistent: isB2Configured,
      configured: isB2Configured,
      bucket: bucket || null,
    },
    email: {
      provider: process.env.BREVO_API_KEY ? "brevo-api" : "development-fallback",
      hasBrevoApiKey: Boolean(process.env.BREVO_API_KEY),
    },
  });
}
