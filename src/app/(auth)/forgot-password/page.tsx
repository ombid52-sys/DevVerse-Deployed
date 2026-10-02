"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit request");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
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
          Reset your password
        </h2>
        <p className="mt-1.5 text-xs text-neutral-500">
          Enter your account email to receive a password reset code
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-neutral-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">Check your inbox</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                If an account exists for <strong className="text-neutral-800">{email}</strong>, you will receive a 6-digit reset code shortly.
              </p>
              <div className="pt-2">
                <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
                  <Button size="sm" className="w-full">
                    Proceed to Reset Password
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
              />

              <Button type="submit" size="md" className="w-full" isLoading={loading}>
                Send Reset Code
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
