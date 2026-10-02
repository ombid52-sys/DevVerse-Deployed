import AdmZip from "adm-zip";
import path from "path";
import { getStorageService } from "@/lib/storage/storage-manager";
import { Application } from "@/types";

interface CachedArchive {
  zip: AdmZip;
  timestamp: number;
}

const ARCHIVE_CACHE = new Map<string, CachedArchive>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

// Prune expired archives periodically
function pruneCache() {
  const now = Date.now();
  for (const [key, item] of ARCHIVE_CACHE.entries()) {
    if (now - item.timestamp > CACHE_TTL_MS) {
      ARCHIVE_CACHE.delete(key);
    }
  }
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".cjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export async function getAppArchiveZip(app: Application): Promise<AdmZip> {
  pruneCache();
  const cacheKey = app._id.toString();
  const cached = ARCHIVE_CACHE.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.zip;
  }

  const storage = getStorageService();
  const storageKey = app.sourceStorageKey || app.sourceDriveFileId || app._id.toString();
  const buffer = await storage.getArchive(storageKey, `${app.slug}-source.zip`);
  const zip = new AdmZip(buffer);

  ARCHIVE_CACHE.set(cacheKey, {
    zip,
    timestamp: Date.now(),
  });

  return zip;
}

export interface SandboxAssetResult {
  data: Buffer;
  contentType: string;
  resolvedPath: string;
}

export async function resolveSandboxAsset(
  app: Application,
  rawPath: string,
  customZip?: AdmZip
): Promise<SandboxAssetResult | null> {
  // Reject traversal attempts
  if (
    rawPath.includes("\0") ||
    rawPath.includes("..") ||
    path.isAbsolute(rawPath)
  ) {
    return null;
  }

  const zip = customZip || (await getAppArchiveZip(app));
  const entries = zip.getEntries();
  // If root requested, default to entrypointPath or index.html
  const cleanPath =
    !rawPath || rawPath === "." || rawPath === "/"
      ? (app.entrypointPath || "index.html")
      : rawPath;

  const targetPath = path.normalize(cleanPath).replace(/\\/g, "/").replace(/^\/+/, "");

  // 1. Direct path match
  let matchedEntry = entries.find(
    (e) => !e.isDirectory && path.normalize(e.entryName).replace(/\\/g, "/") === targetPath
  );

  // 2. Try with entrypoint folder prefix if entrypoint is in a subfolder (e.g. VoxelVerse-Mojang/)
  if (!matchedEntry && app.entrypointPath && app.entrypointPath.includes("/")) {
    const entryDir = path.dirname(app.entrypointPath).replace(/\\/g, "/");
    const withPrefix = `${entryDir}/${targetPath}`;
    matchedEntry = entries.find(
      (e) => !e.isDirectory && path.normalize(e.entryName).replace(/\\/g, "/") === withPrefix
    );
  }

  // 3. Case-insensitive fallback
  if (!matchedEntry) {
    const lower = targetPath.toLowerCase();
    matchedEntry = entries.find(
      (e) => !e.isDirectory && path.normalize(e.entryName).replace(/\\/g, "/").toLowerCase() === lower
    );
  }

  if (!matchedEntry || matchedEntry.isDirectory) {
    return null;
  }

  const data = matchedEntry.getData();
  const contentType = getMimeType(matchedEntry.entryName);

  return {
    data,
    contentType,
    resolvedPath: matchedEntry.entryName,
  };
}

export function rewriteHtmlForSandbox(html: string, slug: string): string {
  const basePrefix = `/api/sandbox/${slug}/`;

  const interceptorScript = `
<base href="${basePrefix}">
<script>
(function() {
  const base = "${basePrefix}";
  const prefixUrl = function(u) {
    if (typeof u === 'string' && u.startsWith('/') && !u.startsWith('/api/sandbox/')) {
      return base + u.replace(/^\\/+/, '');
    }
    return u;
  };

  if (window.fetch) {
    const origFetch = window.fetch;
    window.fetch = function(input, init) {
      if (typeof input === 'string') input = prefixUrl(input);
      else if (input && input.url) input = new Request(prefixUrl(input.url), input);
      return origFetch.call(this, input, init);
    };
  }

  if (window.XMLHttpRequest) {
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      arguments[1] = prefixUrl(url);
      return origOpen.apply(this, arguments);
    };
  }

  if (window.Worker) {
    const OrigWorker = window.Worker;
    window.Worker = function(scriptURL, options) {
      return new OrigWorker(prefixUrl(scriptURL), options);
    };
  }
})();
</script>`;

  let rewritten = html;
  if (rewritten.includes('<head>')) {
    rewritten = rewritten.replace('<head>', `<head>${interceptorScript}`);
  } else if (rewritten.includes('<head ')) {
    rewritten = rewritten.replace(/(<head[^>]*>)/i, `$1${interceptorScript}`);
  } else {
    rewritten = interceptorScript + rewritten;
  }

  // Rewrite root-relative src and href attributes (e.g. src="/assets/..." -> src="/api/sandbox/slug/assets/...")
  rewritten = rewritten.replace(
    /(src|href)=["']\/(?!\/|api\/sandbox)([^"']*)["']/gi,
    `$1="${basePrefix}$2"`
  );

  return rewritten;
}

export function rewriteCssForSandbox(css: string, slug: string): string {
  const basePrefix = `/api/sandbox/${slug}/`;
  return css.replace(
    /url\(\s*(['"]?)\/(?!\/|api\/sandbox)([^'")]+)\1\s*\)/gi,
    (match, quote, assetPath) => `url(${quote}${basePrefix}${assetPath}${quote})`
  );
}

