"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Code2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
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
          Enter new password
        </h2>
        <p className="mt-1.5 text-xs text-neutral-500">
          Provide your verification code and choose a new secure password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-neutral-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-semibold text-neutral-900">
                Password successfully reset!
              </h3>
              <p className="text-xs text-neutral-500">Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="6-Digit Reset Code"
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
              />

              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                helperText="Must be at least 8 characters with uppercase, lowercase, and a number."
              />

              <Button type="submit" size="md" className="w-full" isLoading={loading}>
                Reset Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading reset...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
