/**
 * Fast client-side ZIP inspector for instant static web application detection in forms.
 * Runs directly in the browser via DataView and TextDecoder without external libraries.
 */

export interface ClientZipInspection {
  fileCount: number;
  hasStaticApp: boolean;
  entrypointPath: string | null;
  htmlCandidates: string[];
}

export function parseZipFilenames(buffer: ArrayBuffer): string[] {
  const filenames: string[] = [];
  const view = new DataView(buffer);
  const totalLen = buffer.byteLength;

  // 1. Try Central Directory headers first (0x02014b50 / PK\x01\x02)
  let foundCd = false;
  for (let i = 0; i <= totalLen - 46; i++) {
    if (view.getUint32(i, true) === 0x02014b50) {
      foundCd = true;
      const fnLen = view.getUint16(i + 28, true);
      const extraLen = view.getUint16(i + 30, true);
      const commentLen = view.getUint16(i + 32, true);
      if (i + 46 + fnLen <= totalLen) {
        const fnBytes = new Uint8Array(buffer, i + 46, fnLen);
        const filename = new TextDecoder("utf-8").decode(fnBytes).replace(/\\/g, "/");
        if (!filename.endsWith("/")) {
          filenames.push(filename);
        }
      }
      i += 45 + fnLen + extraLen + commentLen;
    }
  }

  // 2. Fallback to Local File headers (0x04034b50 / PK\x03\x04) if Central Directory was absent
  if (!foundCd) {
    for (let i = 0; i <= totalLen - 30; i++) {
      if (view.getUint32(i, true) === 0x04034b50) {
        const fnLen = view.getUint16(i + 26, true);
        const extraLen = view.getUint16(i + 28, true);
        if (i + 30 + fnLen <= totalLen) {
          const fnBytes = new Uint8Array(buffer, i + 30, fnLen);
          const filename = new TextDecoder("utf-8").decode(fnBytes).replace(/\\/g, "/");
          if (!filename.endsWith("/")) {
            filenames.push(filename);
          }
        }
        i += 29 + fnLen + extraLen;
      }
    }
  }

  return filenames;
}

export async function inspectClientZip(file: File): Promise<ClientZipInspection> {
  const arrayBuffer = await file.arrayBuffer();
  const filenames = parseZipFilenames(arrayBuffer);

  const htmlCandidates = filenames.filter((p) => {
    const lower = p.toLowerCase();
    return lower.endsWith(".html") || lower.endsWith(".htm");
  });

  // Filter for index.html / index.htm
  const indexFiles = htmlCandidates.filter((p) => {
    const parts = p.split("/");
    const base = parts[parts.length - 1].toLowerCase();
    return base === "index.html" || base === "index.htm";
  });

  if (indexFiles.length === 0) {
    return {
      fileCount: filenames.length,
      hasStaticApp: false,
      entrypointPath: null,
      htmlCandidates,
    };
  }

  // Find root index.html first
  const rootIndex = indexFiles.find((p) => !p.includes("/"));
  if (rootIndex) {
    return {
      fileCount: filenames.length,
      hasStaticApp: true,
      entrypointPath: rootIndex,
      htmlCandidates,
    };
  }

  // Or shallowest index.html
  indexFiles.sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    if (depthA !== depthB) return depthA - depthB;
    return a.localeCompare(b);
  });

  return {
    fileCount: filenames.length,
    hasStaticApp: true,
    entrypointPath: indexFiles[0],
    htmlCandidates,
  };
}
