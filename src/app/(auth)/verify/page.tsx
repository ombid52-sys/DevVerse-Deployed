"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Code2, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const typeParam = (searchParams.get("type") as "REGISTRATION" | "PASSWORD_RESET") || "REGISTRATION";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), type: typeParam }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        return;
      }

      setSuccess("Account activated and verified! Redirecting to your dashboard...");

      let target = "/explore";
      if (data.user?.role === "ADMIN") {
        target = "/admin";
      } else if (data.user?.role === "DEVELOPER") {
        target = "/developer";
      }

      setTimeout(() => {
        window.location.href = target;
      }, 800);
    } catch {
      setError("Network error occurred.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: typeParam }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code");
      } else {
        setSuccess("A fresh verification code has been dispatched.");
        setCooldown(60);
      }
    } catch {
      setError("Failed to resend code");
    } finally {
      setResending(false);
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
          Verify your email address
        </h2>
        <p className="mt-1.5 text-xs text-neutral-500">
          Enter the six-digit code sent to <strong className="text-neutral-800">{email || "your email"}</strong>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-neutral-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            {!emailParam && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-brand-600 font-bold"
              />
            </div>

            <Button type="submit" size="md" className="w-full" isLoading={loading}>
              Verify & Activate Account
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Didn&apos;t receive code?</span>
            <button
              type="button"
              disabled={cooldown > 0 || resending}
              onClick={handleResend}
              className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading verification...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
