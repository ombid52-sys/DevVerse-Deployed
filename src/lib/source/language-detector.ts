import { LanguageStat } from "@/types";
import { IGNORED_SOURCE_PATTERNS } from "../constants";

const EXTENSION_MAP: Record<string, string> = {
  // TypeScript & JavaScript
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",

  // Python
  py: "Python",
  pyw: "Python",

  // Systems
  rs: "Rust",
  go: "Go",
  c: "C",
  h: "C",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  hpp: "C++",
  zig: "Zig",

  // JVM & Mobile
  java: "Java",
  kt: "Kotlin",
  kts: "Kotlin",
  swift: "Swift",
  dart: "Dart",
  scala: "Scala",

  // Microsoft .NET
  cs: "C#",
  fs: "F#",

  // Web & Scripting
  rb: "Ruby",
  php: "PHP",
  html: "HTML",
  htm: "HTML",
  css: "CSS",
  scss: "CSS",
  sass: "CSS",
  less: "CSS",
  vue: "Vue",
  svelte: "Svelte",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
  ps1: "PowerShell",
  lua: "Lua",
  r: "R",
  sql: "SQL",
};

export interface FileEntryForAnalysis {
  path: string;
  size: number;
}

export function shouldIgnoreFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  const parts = normalized.split("/");

  // Check if any directory part matches ignored patterns
  for (const part of parts) {
    if (IGNORED_SOURCE_PATTERNS.some((p) => part === p.toLowerCase())) {
      return true;
    }
  }

  const fileName = parts[parts.length - 1];
  // Check minified files
  if (
    fileName.endsWith(".min.js") ||
    fileName.endsWith(".min.css") ||
    fileName.endsWith(".map")
  ) {
    return true;
  }

  // Check lockfiles
  if (
    fileName === "package-lock.json" ||
    fileName === "yarn.lock" ||
    fileName === "pnpm-lock.yaml" ||
    fileName === "bun.lockb"
  ) {
    return true;
  }

  return false;
}

export function detectLanguages(files: FileEntryForAnalysis[]): LanguageStat[] {
  const languageBytes: Record<string, number> = {};
  let totalBytes = 0;

  for (const file of files) {
    if (shouldIgnoreFile(file.path)) {
      continue;
    }

    const extMatch = file.path.match(/\.([a-zA-Z0-9]+)$/);
    if (!extMatch) continue;

    const ext = extMatch[1].toLowerCase();
    const language = EXTENSION_MAP[ext];

    if (language) {
      languageBytes[language] = (languageBytes[language] || 0) + file.size;
      totalBytes += file.size;
    }
  }

  if (totalBytes === 0) {
    return [];
  }

  const results: LanguageStat[] = Object.entries(languageBytes)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Number(((bytes / totalBytes) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return results;
}
