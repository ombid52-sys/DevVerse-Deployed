"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminInitPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [alreadyInitialized, setAlreadyInitialized] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("admin");
  const [displayName, setDisplayName] = useState("Platform Administrator");
  const [password, setPassword] = useState("");
  const [bootstrapToken, setBootstrapToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/admin/init");
        if (res.ok) {
          const data = await res.json();
          setAlreadyInitialized(Boolean(data.initialized));
        }
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: username.toLowerCase(),
          displayName,
          password,
          bootstrapToken: bootstrapToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to initialize admin account");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="p-8 text-center text-xs text-neutral-400">Verifying administrative status...</div>;
  }

  if (alreadyInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Administrator Already Initialized</h2>
        <p className="text-xs text-neutral-500 leading-relaxed">
          The single platform administrator account has already been securely provisioned. Public administrator registration is permanently closed.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button size="sm">Go to Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white mx-auto shadow-sm mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Admin Account Provisioning
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Initialize the primary platform administrator account (exactly 1 account allowed)
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
              <h3 className="text-sm font-semibold text-neutral-900">Administrator Provisioned!</h3>
              <p className="text-xs text-neutral-500">Redirecting to admin portal...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Admin Email *"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domain.com"
              />

              <Input
                label="Admin Username *"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />

              <Input
                label="Display Name *"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <Input
                label="Admin Password *"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                helperText="Min 10 characters with uppercase, lowercase, number, and special character."
              />

              <Input
                label="Admin Bootstrap Token"
                type="password"
                value={bootstrapToken}
                onChange={(e) => setBootstrapToken(e.target.value)}
                placeholder="Token from ADMIN_BOOTSTRAP_TOKEN"
              />

              <div className="pt-2">
                <Button type="submit" size="md" className="w-full bg-purple-600 hover:bg-purple-700" isLoading={loading}>
                  Provision Administrator Account
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
