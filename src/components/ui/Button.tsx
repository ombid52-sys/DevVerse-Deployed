import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 ease-out rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500 disabled:opacity-50 disabled:pointer-events-none select-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]";

    const variantStyles = {
      primary: "bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-sm shadow-brand-500/20 hover:shadow-md hover:shadow-brand-500/25 active:opacity-95",
      secondary: "bg-slate-100/90 hover:bg-slate-200/90 text-neutral-800 backdrop-blur-sm border border-slate-200/70 active:bg-slate-200",
      outline: "border border-slate-200/90 bg-white/80 hover:bg-white text-neutral-700 backdrop-blur-md hover:border-slate-300 shadow-xs hover:shadow-sm active:bg-neutral-50",
      danger: "bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-500/20 active:bg-red-700",
      ghost: "hover:bg-neutral-100/80 text-neutral-600 hover:text-neutral-900 active:bg-neutral-200/80",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-xs sm:text-sm px-4 py-2 gap-2",
      lg: "text-sm sm:text-base px-5 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
