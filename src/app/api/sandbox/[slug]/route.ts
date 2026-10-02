import { NextRequest, NextResponse } from "next/server";
import { getCollections, toObjectId } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { resolveSandboxAsset, rewriteHtmlForSandbox, rewriteCssForSandbox } from "@/lib/sandbox/sandbox-service";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

async function findApp(slugOrId: string) {
  const { applications } = await getCollections();
  let query: any = { isDeleted: false };
  if (ObjectId.isValid(slugOrId) && slugOrId.length === 24) {
    query.$or = [{ _id: toObjectId(slugOrId) }, { slug: slugOrId }];
  } else {
    query.slug = slugOrId;
  }
  return applications.findOne(query);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const app = await findApp(slug);

    if (!app) {
      return new NextResponse("Application not found", { status: 404 });
    }

    // Access control for private apps
    if (app.visibility === "PRIVATE") {
      const currentUser = await getAuthenticatedUser();
      const isOwner = currentUser && currentUser._id.toString() === app.ownerId.toString();
      const isAdmin = currentUser?.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return new NextResponse("Access denied: this application is private", { status: 403 });
      }
    }

    if (!app.isRunnable || (app.runtimeType !== "STATIC_ZIP" && app.runtimeType !== "BOTH")) {
      return new NextResponse("Runtime Sandbox is not enabled for this application", { status: 403 });
    }

    if (app.sourceStatus !== "READY") {
      return new NextResponse("Application source archive is not ready", { status: 404 });
    }

    const entryFile = app.entrypointPath || "index.html";
    const asset = await resolveSandboxAsset(app as any, entryFile);

    if (!asset) {
      return new NextResponse(
        `Runtime Sandbox entrypoint not found in archive (${entryFile})`,
        { status: 404 }
      );
    }

    let bodyData: Uint8Array = new Uint8Array(asset.data);
    if (asset.contentType.includes("text/html")) {
      const rawHtml = asset.data.toString("utf-8");
      const rewrittenHtml = rewriteHtmlForSandbox(rawHtml, app.slug);
      bodyData = new TextEncoder().encode(rewrittenHtml);
    } else if (asset.contentType.includes("text/css")) {
      const rawCss = asset.data.toString("utf-8");
      const rewrittenCss = rewriteCssForSandbox(rawCss, app.slug);
      bodyData = new TextEncoder().encode(rewrittenCss);
    }

    return new NextResponse(bodyData as any, {
      status: 200,
      headers: {
        "Content-Type": asset.contentType,
        "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[Sandbox Root Error]", err);
    return new NextResponse("Failed to load Runtime Sandbox entrypoint", { status: 500 });
  }
}
