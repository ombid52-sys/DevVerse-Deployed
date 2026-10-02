"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, UserCheck, Terminal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<"USER" | "DEVELOPER">("DEVELOPER");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      window.location.href = `/verify?email=${encodeURIComponent(email)}`;
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
          Create your DevVerse account
        </h2>
        <p className="mt-1.5 text-xs text-neutral-500">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-500 underline">
            Sign in here
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
            {/* Account Type Selection */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("USER")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    role === "USER"
                      ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className={`w-4 h-4 ${role === "USER" ? "text-brand-600" : "text-neutral-400"}`} />
                    <span className="text-xs font-semibold text-neutral-900">User</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">Browse, favourite, and collect apps</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("DEVELOPER")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    role === "DEVELOPER"
                      ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Terminal className={`w-4 h-4 ${role === "DEVELOPER" ? "text-brand-600" : "text-neutral-400"}`} />
                    <span className="text-xs font-semibold text-neutral-900">Developer</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">Publish software & source code</p>
                </button>
              </div>
            </div>

            <Input
              label="Username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="e.g. dev_sarah"
              helperText="Lowercase letters, numbers, hyphens, and underscores."
            />

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              helperText="A 6-digit verification code will be sent to this email."
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              helperText="At least 8 characters with uppercase, lowercase, and a number."
            />

            <div className="pt-2">
              <Button type="submit" size="md" className="w-full" isLoading={loading}>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
