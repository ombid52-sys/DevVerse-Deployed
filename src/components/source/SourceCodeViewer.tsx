"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Copy, Check, FileText, Binary, WrapText, Wand2, RefreshCw } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { Button } from "../ui/Button";

interface SourceCodeViewerProps {
  filePath: string;
  content: string | null;
  size: number;
  isBinary: boolean;
}

const MAX_RENDER_LINES = 5000;

function formatCode(raw: string, filePath: string): string {
  if (!raw) return raw;
  const ext = filePath.split(".").pop()?.toLowerCase() || "";

  // 1. JSON
  if (ext === "json") {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  // 2. CSS
  if (ext === "css") {
    try {
      return raw
        .replace(/\s*([\{\};])\s*/g, "$1")
        .replace(/\{/g, " {\n  ")
        .replace(/;/g, ";\n  ")
        .replace(/\}/g, "\n}\n\n")
        .replace(/  \}/g, "}")
        .trim();
    } catch {
      return raw;
    }
  }

  // 3. HTML / XML / SVG
  if (["html", "htm", "xml", "svg"].includes(ext)) {
    try {
      return raw
        .replace(/>\s*</g, ">\n<")
        .replace(/(<\/[a-zA-Z0-9_-]+>)/g, "$1\n")
        .replace(/\n\s*\n+/g, "\n")
        .trim();
    } catch {
      return raw;
    }
  }

  // 4. JavaScript / TypeScript
  if (["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(ext)) {
    if (raw.length > 400000) return raw; // Skip massive bundles to prevent lag
    try {
      let formatted = "";
      let indent = 0;
      let inString: string | null = null;
      const tab = "  ";

      for (let i = 0; i < raw.length; i++) {
        const char = raw[i];
        if ((char === '"' || char === "'" || char === "`") && raw[i - 1] !== "\\") {
          if (inString === char) inString = null;
          else if (!inString) inString = char;
        }

        if (inString) {
          formatted += char;
          continue;
        }

        if (char === "{" || char === "[") {
          indent++;
          formatted += char + "\n" + tab.repeat(indent);
        } else if (char === "}" || char === "]") {
          indent = Math.max(0, indent - 1);
          formatted += "\n" + tab.repeat(indent) + char;
        } else if (char === ";") {
          formatted += ";\n" + tab.repeat(indent);
        } else {
          formatted += char;
        }
      }
      return formatted.replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
    } catch {
      return raw;
    }
  }

  return raw;
}

export function SourceCodeViewer({
  filePath,
  content,
  size,
  isBinary,
}: SourceCodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(true);
  const [formatActive, setFormatActive] = useState(false);

  // Normalize line endings (\r\n and \r -> \n)
  const normalizedContent = useMemo(() => {
    if (!content) return "";
    return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }, [content]);

  // Detect if code is minified or single-line
  const isMinified = useMemo(() => {
    if (!normalizedContent || isBinary) return false;
    const rawLines = normalizedContent.split("\n");
    if (rawLines.length <= 5 && normalizedContent.length > 250) return true;
    const avgLen = normalizedContent.length / Math.max(1, rawLines.length);
    return avgLen > 180;
  }, [normalizedContent, isBinary]);

  // Can this file extension be formatted?
  const canFormat = useMemo(() => {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    return ["js", "jsx", "ts", "tsx", "mjs", "cjs", "json", "css", "html", "htm", "xml", "svg"].includes(ext);
  }, [filePath]);

  // Auto-enable formatting when minified file is selected
  useEffect(() => {
    if (isMinified && canFormat && size < 400 * 1024) {
      setFormatActive(true);
    } else {
      setFormatActive(false);
    }
  }, [filePath, isMinified, canFormat, size]);

  // Compute displayed content and lines
  const displayContent = useMemo(() => {
    if (!normalizedContent) return "";
    if (formatActive && canFormat) {
      return formatCode(normalizedContent, filePath);
    }
    return normalizedContent;
  }, [normalizedContent, formatActive, canFormat, filePath]);

  const allLines = useMemo(() => {
    if (!displayContent) return [];
    return displayContent.split("\n");
  }, [displayContent]);

  const isTruncated = allLines.length > MAX_RENDER_LINES;
  const visibleLines = useMemo(() => {
    return isTruncated ? allLines.slice(0, MAX_RENDER_LINES) : allLines;
  }, [allLines, isTruncated]);

  const handleCopy = async () => {
    if (!displayContent) return;
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* File Header */}
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-neutral-700 font-mono min-w-0">
          <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
          <span className="font-semibold text-neutral-900 truncate">{filePath}</span>
          <span className="text-neutral-400 shrink-0">&bull;</span>
          <span className="text-neutral-500 shrink-0">{formatBytes(size)}</span>
          {!isBinary && (
            <>
              <span className="text-neutral-400 shrink-0">&bull;</span>
              <span className="text-neutral-500 shrink-0">
                {allLines.length} {allLines.length === 1 ? "line" : "lines"}
              </span>
            </>
          )}
          {isMinified && (
            <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 font-medium border border-amber-200 shrink-0">
              Minified
            </span>
          )}
        </div>

        {!isBinary && (
          <div className="flex items-center gap-1.5 shrink-0">
            {canFormat && (
              <button
                type="button"
                onClick={() => setFormatActive((prev) => !prev)}
                className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  formatActive
                    ? "bg-brand-50 border-brand-300 text-brand-700 hover:bg-brand-100"
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
                title="Format and prettify minified or condensed code"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{formatActive ? "Formatted" : "Format"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setWrapLines((prev) => !prev)}
              className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                wrapLines
                  ? "bg-brand-50 border-brand-300 text-brand-700 hover:bg-brand-100"
                  : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              }`}
              title="Toggle word wrap to prevent wide scrolling"
            >
              <WrapText className="w-3.5 h-3.5" />
              <span>{wrapLines ? "Wrap: On" : "Wrap: Off"}</span>
            </button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-7 text-xs px-2.5"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-1 text-neutral-700">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Code / Content Area (GitHub Light Mode Aesthetic) */}
      <div className="flex-1 overflow-auto bg-white text-neutral-900 font-mono text-xs">
        {isBinary ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-500">
            <Binary className="w-12 h-12 stroke-1 text-neutral-400 mb-2" />
            <p className="font-medium text-neutral-700">Binary file</p>
            <p className="text-[11px] text-neutral-400 mt-1">
              This file cannot be displayed directly in the code editor.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse font-mono text-xs">
            <tbody>
              {visibleLines.map((line, i) => (
                <tr key={i} className="hover:bg-neutral-50 leading-relaxed group transition-colors">
                  <td className="select-none pr-3 pl-4 py-0.5 text-neutral-400 group-hover:text-neutral-600 text-right w-12 align-top border-r border-neutral-200 font-mono text-[11px] tabular-nums shrink-0 bg-neutral-50/40">
                    {i + 1}
                  </td>
                  <td
                    className={`pl-4 pr-4 py-0.5 align-top text-neutral-800 ${
                      wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                    }`}
                  >
                    {line || " "}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Large File Truncation Footer */}
      {isTruncated && (
        <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-200 text-[11px] text-neutral-600 flex items-center justify-between">
          <span>
            Showing first {MAX_RENDER_LINES.toLocaleString()} of {allLines.length.toLocaleString()} lines.
          </span>
          <span className="text-neutral-400">
            Download the full ZIP archive to view the entire file.
          </span>
        </div>
      )}
    </div>
  );
}
