import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-slate-200/60 rounded-lg", className)}
      {...props}
    />
  );
}

export function AppCardSkeleton() {
  return (
    <div className="glass-card border border-white/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <Skeleton className="w-full aspect-video rounded-xl" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
      <Skeleton className="h-5 w-3/4 rounded-md" />
      <Skeleton className="h-3.5 w-1/3 rounded-md" />
      <div className="space-y-1.5 pt-1">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-4/5 rounded-md" />
      </div>
      <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-14 rounded-md" />
      </div>
    </div>
  );
}
