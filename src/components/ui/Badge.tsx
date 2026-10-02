import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "neutral" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    brand: "bg-brand-50/90 text-brand-700 border-brand-200/80 shadow-2xs",
    neutral: "bg-slate-100/90 text-slate-700 border-slate-200/80 shadow-2xs",
    success: "bg-emerald-50/90 text-emerald-700 border-emerald-200/80 shadow-2xs",
    warning: "bg-amber-50/90 text-amber-700 border-amber-200/80 shadow-2xs",
    danger: "bg-rose-50/90 text-rose-700 border-rose-200/80 shadow-2xs",
    outline: "bg-white/80 text-neutral-600 border-slate-200/90 shadow-2xs",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2.5 py-0.5 font-semibold border rounded-full",
    md: "text-xs px-3 py-0.5 font-semibold border rounded-full",
  };

  return (
    <span
      className={cn("inline-flex items-center gap-1 leading-none select-none", variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
