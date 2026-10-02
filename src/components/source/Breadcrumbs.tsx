import React from "react";
import { ChevronRight, Folder } from "lucide-react";

interface BreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  rootName?: string;
}

export function Breadcrumbs({
  currentPath,
  onNavigate,
  rootName = "root",
}: BreadcrumbsProps) {
  const parts = currentPath.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-xs text-neutral-600 overflow-x-auto py-1">
      <button
        onClick={() => onNavigate("")}
        className="font-medium text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1 shrink-0"
      >
        <Folder className="w-3.5 h-3.5" />
        <span>{rootName}</span>
      </button>

      {parts.map((part, index) => {
        const subPath = parts.slice(0, index + 1).join("/");
        const isLast = index === parts.length - 1;

        return (
          <React.Fragment key={subPath}>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-neutral-900 truncate shrink-0">
                {part}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(subPath)}
                className="font-medium text-neutral-600 hover:text-brand-600 transition-colors truncate shrink-0"
              >
                {part}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
