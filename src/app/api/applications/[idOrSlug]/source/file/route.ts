import { NextRequest, NextResponse } from "next/server";
import { getCollections, toObjectId } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { getStorageService } from "@/lib/storage/storage-manager";
import AdmZip from "adm-zip";
import path from "path";
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

function isBinaryBuffer(buf: Buffer): boolean {
  const checkLen = Math.min(buf.length, 1024);
  for (let i = 0; i < checkLen; i++) {
    if (buf[i] === 0) return true; // Null byte indicates binary
  }
  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await params;
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "Query parameter 'path' is required" }, { status: 400 });
    }

    // Safety checks against path traversal
    if (
      filePath.includes("\0") ||
      path.isAbsolute(filePath) ||
      filePath.includes("..") ||
      filePath.startsWith("/") ||
      filePath.startsWith("\\")
    ) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

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
          { error: "Access denied: application is private" },
          { status: 403 }
        );
      }
    }

    if (app.sourceStatus !== "READY") {
      return NextResponse.json(
        { error: "Source code archive is not ready" },
        { status: 400 }
      );
    }

    const storage = getStorageService();
    const buffer = await storage.getArchive(
      app.sourceStorageKey || app.sourceDriveFileId || app._id.toString(),
      `${app.slug}-source.zip`
    );

    const zip = new AdmZip(buffer);
    const normalizedTarget = path.normalize(filePath).replace(/\\/g, "/");
    const entry = zip.getEntries().find((e) => {
      const entryNormalized = path.normalize(e.entryName).replace(/\\/g, "/");
      return entryNormalized === normalizedTarget;
    });

    if (!entry || entry.isDirectory) {
      return NextResponse.json({ error: "File not found in source archive" }, { status: 404 });
    }

    const fileData = entry.getData();
    const isBinary = isBinaryBuffer(fileData);

    return NextResponse.json({
      path: normalizedTarget,
      name: path.basename(normalizedTarget),
      size: fileData.length,
      isBinary,
      content: isBinary ? null : fileData.toString("utf-8"),
    });
  } catch (err: any) {
    console.error("[Get Source File Error]", err);
    return NextResponse.json({ error: "Failed to read file from archive" }, { status: 500 });
  }
}
