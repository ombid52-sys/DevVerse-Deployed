import React from "react";
import { LanguageStat } from "@/types";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  PowerShell: "#012456",
  PHP: "#4F5D95",
  Ruby: "#701516",
  SQL: "#e38c00",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  R: "#198CE7",
  Zig: "#ec915c",
};

export function LanguageBar({ languages }: { languages?: LanguageStat[] }) {
  if (!languages || languages.length === 0) {
    return (
      <div className="text-xs text-neutral-400 italic">
        No source language statistics available yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Percentage distribution bar */}
      <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-200">
        {languages.map((item) => {
          const color = LANGUAGE_COLORS[item.language] || "#94a3b8";
          return (
            <div
              key={item.language}
              style={{
                width: `${item.percentage}%`,
                backgroundColor: color,
              }}
              className="h-full transition-all duration-300"
              title={`${item.language}: ${item.percentage}%`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-600">
        {languages.map((item) => {
          const color = LANGUAGE_COLORS[item.language] || "#94a3b8";
          return (
            <div key={item.language} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-neutral-800">{item.language}</span>
              <span className="text-neutral-400">{item.percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
