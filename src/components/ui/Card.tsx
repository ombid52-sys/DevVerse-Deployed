import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6 border border-slate-200/80 shadow-[0_4px_24px_-2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(255,255,255,0.7)_inset]",
        hover && "hover:-translate-y-1 hover:shadow-xl hover:border-brand-300/60 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4 pb-3 border-b border-neutral-100", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-neutral-900 tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}
