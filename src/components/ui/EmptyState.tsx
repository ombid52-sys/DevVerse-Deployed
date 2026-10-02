import React from "react";
import { FolderSearch } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = <FolderSearch className="w-10 h-10 text-neutral-400 stroke-1" />,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-12 text-center glass-card border border-dashed border-slate-200/90 rounded-2xl">
      <div className="w-12 h-12 rounded-2xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center mb-3 text-neutral-400">
        {icon}
      </div>
      <h3 className="text-base font-bold text-neutral-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
