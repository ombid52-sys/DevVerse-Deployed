"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function AppSourceUploadRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/developer/apps/${id}/edit?tab=source`);
  }, [id, router]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-neutral-500 font-medium">
        Redirecting to unified Source Code & Archive manager...
      </p>
    </div>
  );
}
