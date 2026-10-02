"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Application Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Something went wrong</h2>
      <p className="text-sm text-neutral-500 max-w-md mt-2 mb-6">
        An error occurred while loading this view. You can attempt to refresh the component.
      </p>
      <Button variant="primary" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}
