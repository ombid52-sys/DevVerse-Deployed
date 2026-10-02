import { NextRequest, NextResponse } from "next/server";
import { getCollections, toObjectId } from "@/lib/db";
import { getAuthenticatedUser, requireAuth, AuthError } from "@/lib/auth";
import { inspectAndValidateZip, ZipSecurityError } from "@/lib/source/zip-inspector";
import { getStorageService } from "@/lib/storage/storage-manager";
import { logActivity } from "@/lib/audit";
import { ObjectId } from "mongodb";

async function findApp(idOrSlug: string) {
  const { applications } = await getCollections();
  let query: any = { isDeleted: false };
  if (ObjectId.isValid(idOrSlug) && idOrSlug.length === 24) {
    query.$or = [{ _id: toObjectId(idOrSlug) }, { slug: idOrSlug }];
  } else {
    query.slug = idOrSlug;
  }
  return applications.findOne(query);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await params;
  let app: any = null;

  try {
    const user = await requireAuth();
    app = await findApp(idOrSlug);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const isOwner = user._id.toString() === app.ownerId.toString();
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to upload source code for this application." },
        { status: 403 }
      );
    }

    const { applications } = await getCollections();

    // Set status to UPLOADING -> PROCESSING
    await applications.updateOne(
      { _id: app._id },
      { $set: { sourceStatus: "PROCESSING", sourceError: null, updatedAt: new Date() } }
    );

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      await applications.updateOne(
        { _id: app._id },
        { $set: { sourceStatus: "FAILED", sourceError: "No file uploaded" } }
      );
      return NextResponse.json({ error: "No ZIP archive file provided in request." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run security inspection and language analysis
    let inspected;
    try {
      inspected = inspectAndValidateZip(buffer);
    } catch (inspectErr: any) {
      const errorMsg = inspectErr.message || "Failed to inspect ZIP archive";
      await applications.updateOne(
        { _id: app._id },
        {
          $set: {
            sourceStatus: "FAILED",
            sourceError: errorMsg,
            updatedAt: new Date(),
          },
        }
      );

      await logActivity({
        action: "APP_SOURCE_UPLOAD_FAILED",
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        targetType: "APPLICATION",
        targetId: app._id.toString(),
        metadata: { error: errorMsg, filename: file.name },
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(
        { error: errorMsg },
        { status: inspectErr.statusCode || 400 }
      );
    }

    // Upload archive to B2 Storage
    const storage = getStorageService();
    const storageKey = await storage.uploadArchive(
      app._id.toString(),
      buffer,
      `${app.slug}-source.zip`
    );

    // Update application in MongoDB with source metadata
    await applications.updateOne(
      { _id: app._id },
      {
        $set: {
          sourceStatus: "READY",
          sourceStorageKey: storageKey,
          sourceDriveFileId: storageKey,
          sourceArchiveSize: buffer.length,
          sourceFileCount: inspected.fileCount,
          sourceTree: inspected.sourceTree,
          languages: inspected.languages,
          sourceError: null,
          updatedAt: new Date(),
        },
      }
    );

    await logActivity({
      action: "APP_SOURCE_UPLOAD_SUCCESS",
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      targetType: "APPLICATION",
      targetId: app._id.toString(),
      metadata: {
        fileCount: inspected.fileCount,
        archiveSize: buffer.length,
        languageCount: inspected.languages.length,
      },
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Source code uploaded and processed successfully",
      sourceStatus: "READY",
      fileCount: inspected.fileCount,
      archiveSize: buffer.length,
      languages: inspected.languages,
      sourceTree: inspected.sourceTree,
      htmlCandidates: inspected.htmlCandidates,
    });
  } catch (err: any) {
    if (app) {
      const { applications } = await getCollections();
      await applications.updateOne(
        { _id: app._id },
        {
          $set: {
            sourceStatus: "FAILED",
            sourceError: err.message || "Internal processing error",
            updatedAt: new Date(),
          },
        }
      );
    }

    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[Source Upload Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during source processing" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await params;
    const app = await findApp(idOrSlug);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (app.visibility === "PRIVATE") {
      const currentUser = await getAuthenticatedUser();
      const isOwner = currentUser && currentUser._id.toString() === app.ownerId.toString();
      const isAdmin = currentUser?.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Access denied: this source code is private." },
          { status: 403 }
        );
      }
    }

    if (app.sourceStatus !== "READY") {
      return NextResponse.json(
        { error: "Source code archive is not available or not yet ready." },
        { status: 404 }
      );
    }

    const storage = getStorageService();
    const buffer = await storage.getArchive(
      app.sourceStorageKey || app.sourceDriveFileId || app._id.toString(),
      `${app.slug}-source.zip`
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${app.slug}-source.zip"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("[Download Source Error]", err);
    return NextResponse.json({ error: "Failed to download source archive" }, { status: 500 });
  }
}
