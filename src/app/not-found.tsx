import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">404 — Page Not Found</h1>
      <p className="text-sm text-neutral-500 max-w-md mt-2 mb-6">
        The requested resource, application, or page does not exist or has been moved.
      </p>
      <Link href="/explore">
        <Button variant="primary" size="md">
          Explore Applications
        </Button>
      </Link>
    </div>
  );
}
