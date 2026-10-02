"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Code2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsVerification && data.email) {
          router.push(`/verify?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      let target = redirect;
      if (!target || target === "/") {
        if (data.user?.role === "ADMIN") {
          target = "/admin";
        } else if (data.user?.role === "DEVELOPER") {
          target = "/developer";
        } else {
          target = "/explore";
        }
      }

      window.location.href = target;
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-sm">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-neutral-900 tracking-tight">
            Dev<span className="text-brand-500">Verse</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-xs text-neutral-500">
          Or{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-500 underline">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-neutral-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Email"
              type="text"
              required
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. johndoe or user@domain.com"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:text-brand-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" size="md" className="w-full" isLoading={loading}>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
