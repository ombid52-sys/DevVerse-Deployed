import { NextRequest, NextResponse } from "next/server";
import { getCollections } from "@/lib/db";
import { resolveSandboxAsset } from "@/lib/sandbox/sandbox-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: assetSegments } = await params;
    const referer = req.headers.get("referer") || "";

    // Extract slug from referer if request originated from sandbox or play page
    const match =
      referer.match(/\/api\/sandbox\/([^/?#]+)/) ||
      referer.match(/\/apps\/([^/?#]+)\/play/);

    if (!match) {
      return new NextResponse("Asset not found", { status: 404 });
    }

    const slug = match[1];
    const { applications } = await getCollections();
    const app = await applications.findOne({ slug, isDeleted: false });

    if (!app || !app.isRunnable) {
      return new NextResponse("Application not found", { status: 404 });
    }

    // Try relative path with "assets/" prefix (e.g. assets/fonts/custom-font.woff)
    const relativePath = "assets/" + assetSegments.join("/");
    let asset = await resolveSandboxAsset(app as any, relativePath);

    // If not found, try without "assets/" prefix in case ZIP is structured differently
    if (!asset) {
      asset = await resolveSandboxAsset(app as any, assetSegments.join("/"));
    }

    if (!asset) {
      return new NextResponse(`Asset not found: ${relativePath}`, { status: 404 });
    }

    return new NextResponse(asset.data as any, {
      status: 200,
      headers: {
        "Content-Type": asset.contentType,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[Assets Fallback Route Error]", err);
    return new NextResponse("Failed to load asset", { status: 500 });
  }
}
