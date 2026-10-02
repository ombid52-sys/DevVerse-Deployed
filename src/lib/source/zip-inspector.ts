import AdmZip from "adm-zip";
import path from "path";
import { SOURCE_LIMITS } from "../constants";
import { SourceTreeNode, LanguageStat } from "@/types";
import { detectLanguages, FileEntryForAnalysis } from "./language-detector";

export class ZipSecurityError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "ZipSecurityError";
    this.statusCode = statusCode;
  }
}

export interface InspectedZipResult {
  fileCount: number;
  uncompressedSize: number;
  sourceTree: SourceTreeNode[];
  languages: LanguageStat[];
  filesMap: Map<string, Buffer>;
  hasStaticApp: boolean;
  entrypointPath: string | null;
  htmlCandidates: string[];
}

export function inspectAndValidateZip(buffer: Buffer): InspectedZipResult {
  // 1. Basic buffer size check
  if (buffer.length > SOURCE_LIMITS.MAX_ZIP_SIZE_BYTES) {
    throw new ZipSecurityError(
      `ZIP archive size exceeds limit of ${SOURCE_LIMITS.MAX_ZIP_SIZE_BYTES / (1024 * 1024)}MB`
    );
  }

  // 2. Validate magic bytes for ZIP header
  if (
    buffer.length < 4 ||
    buffer[0] !== 0x50 || // 'P'
    buffer[1] !== 0x4b || // 'K'
    (buffer[2] !== 0x03 && buffer[2] !== 0x05 && buffer[2] !== 0x07)
  ) {
    throw new ZipSecurityError("Invalid archive format: not a valid ZIP file");
  }

  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch (err: any) {
    throw new ZipSecurityError(`Corrupted or malformed ZIP archive: ${err.message}`);
  }

  const entries = zip.getEntries();

  // 3. Entry count check
  if (entries.length > SOURCE_LIMITS.MAX_FILE_COUNT) {
    throw new ZipSecurityError(
      `Archive contains too many entries (${entries.length}). Maximum allowed is ${SOURCE_LIMITS.MAX_FILE_COUNT}`
    );
  }

  let totalUncompressedSize = 0;
  const analysisFiles: FileEntryForAnalysis[] = [];
  const filesMap = new Map<string, Buffer>();
  const normalizedPaths: string[] = [];

  for (const entry of entries) {
    const rawName = entry.entryName;

    // Check for null bytes
    if (rawName.includes("\0")) {
      throw new ZipSecurityError("Malicious archive: null bytes found in entry name");
    }

    // Check for absolute paths or Windows drive letters
    if (
      path.isAbsolute(rawName) ||
      /^[a-zA-Z]:/.test(rawName) ||
      rawName.startsWith("/") ||
      rawName.startsWith("\\")
    ) {
      throw new ZipSecurityError(
        `Path traversal attempt: entry contains absolute path (${rawName})`
      );
    }

    // Normalize path and detect traversal
    const normalized = path.normalize(rawName).replace(/\\/g, "/");
    if (
      normalized.startsWith("../") ||
      normalized === ".." ||
      normalized.includes("/../") ||
      normalized.endsWith("/..")
    ) {
      throw new ZipSecurityError(
        `Path traversal attempt detected in entry: ${rawName}`
      );
    }

    // Directory depth limit check
    const depth = normalized.split("/").filter(Boolean).length;
    if (depth > SOURCE_LIMITS.MAX_DIRECTORY_DEPTH) {
      throw new ZipSecurityError(
        `Archive exceeds maximum directory depth of ${SOURCE_LIMITS.MAX_DIRECTORY_DEPTH}`
      );
    }

    // Nested archive check (disallow archives inside archive)
    const lower = normalized.toLowerCase();
    if (
      lower.endsWith(".zip") ||
      lower.endsWith(".tar") ||
      lower.endsWith(".gz") ||
      lower.endsWith(".tgz") ||
      lower.endsWith(".7z") ||
      lower.endsWith(".rar")
    ) {
      throw new ZipSecurityError(
        `Nested archives are not permitted: ${rawName}`
      );
    }

    // Individual file size check
    const uncompressedSize = entry.header.size;
    if (uncompressedSize > SOURCE_LIMITS.MAX_FILE_SIZE_BYTES) {
      throw new ZipSecurityError(
        `Individual file ${rawName} exceeds limit of ${SOURCE_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
      );
    }

    totalUncompressedSize += uncompressedSize;

    // Total extracted size check (Decompression Bomb protection)
    if (totalUncompressedSize > SOURCE_LIMITS.MAX_EXTRACTED_SIZE_BYTES) {
      throw new ZipSecurityError(
        `Total uncompressed size exceeds limit of ${SOURCE_LIMITS.MAX_EXTRACTED_SIZE_BYTES / (1024 * 1024)}MB (possible decompression bomb)`
      );
    }

    // Compression ratio check for zip bomb protection
    const compressedSize = Math.max(entry.header.compressedSize, 1);
    const ratio = uncompressedSize / compressedSize;
    if (ratio > SOURCE_LIMITS.MAX_COMPRESSION_RATIO && uncompressedSize > 1024 * 1024) {
      throw new ZipSecurityError(
        `Suspicious compression ratio for entry ${rawName} (possible decompression bomb)`
      );
    }

    if (!entry.isDirectory) {
      const data = entry.getData();
      filesMap.set(normalized, data);
      analysisFiles.push({
        path: normalized,
        size: uncompressedSize,
      });
      normalizedPaths.push(normalized);
    }
  }

  // 4. Build hierarchical directory tree for GitHub-style browser
  const sourceTree = buildDirectoryTree(normalizedPaths, filesMap);

  // 5. Detect programming languages
  const languages = detectLanguages(analysisFiles);

  // 6. Inspect HTML candidates for developer sandbox options
  const htmlCandidates = normalizedPaths.filter((p) => {
    const lower = p.toLowerCase();
    return lower.endsWith(".html") || lower.endsWith(".htm");
  });

  const { hasStaticApp, entrypointPath } = detectStaticAppEntrypoint(normalizedPaths);

  return {
    fileCount: filesMap.size,
    uncompressedSize: totalUncompressedSize,
    sourceTree,
    languages,
    filesMap,
    hasStaticApp,
    entrypointPath,
    htmlCandidates,
  };
}

export function detectStaticAppEntrypoint(filePaths: string[]): {
  hasStaticApp: boolean;
  entrypointPath: string | null;
} {
  const htmlFiles = filePaths.filter((p) => {
    const base = path.basename(p).toLowerCase();
    return base === "index.html" || base === "index.htm";
  });

  if (htmlFiles.length === 0) {
    return { hasStaticApp: false, entrypointPath: null };
  }

  // 1. Check for root-level index.html
  const rootIndex = htmlFiles.find((p) => !p.includes("/"));
  if (rootIndex) {
    return { hasStaticApp: true, entrypointPath: rootIndex };
  }

  // 2. Sort by directory depth ascending (e.g. top-level folder/index.html before deeply nested)
  htmlFiles.sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    if (depthA !== depthB) return depthA - depthB;
    return a.localeCompare(b);
  });

  return { hasStaticApp: true, entrypointPath: htmlFiles[0] };
}

export function buildDirectoryTree(
  filePaths: string[],
  filesMap: Map<string, Buffer>
): SourceTreeNode[] {
  const rootNodes: SourceTreeNode[] = [];
  const map: Record<string, SourceTreeNode> = {};

  // Sort paths to process deterministically
  const sorted = [...filePaths].sort();

  for (const filePath of sorted) {
    const parts = filePath.split("/").filter(Boolean);
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const prevPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!map[currentPath]) {
        const node: SourceTreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "directory",
          size: isFile ? filesMap.get(filePath)?.length || 0 : undefined,
          children: isFile ? undefined : [],
        };
        map[currentPath] = node;

        if (prevPath) {
          map[prevPath]?.children?.push(node);
        } else {
          rootNodes.push(node);
        }
      }
    }
  }

  // Sort children so directories appear before files, then alphabetically
  function sortNodes(nodes: SourceTreeNode[]) {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) {
        sortNodes(node.children);
      }
    }
  }

  sortNodes(rootNodes);
  return rootNodes;
}
