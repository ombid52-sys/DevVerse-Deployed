"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Application } from "@/types";
import { AppCard } from "@/components/apps/AppCard";
import { formatDate, formatRole } from "@/lib/utils";
import { Calendar, Code2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface DeveloperData {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  role: string;
  createdAt: string;
}

export default function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);

  const [developer, setDeveloper] = useState<DeveloperData | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadDeveloper() {
      try {
        const res = await fetch(`/api/users/${username}`);
        if (res.ok) {
          const data = await res.json();
          setDeveloper(data.developer);
          setApps(data.applications || []);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadDeveloper();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-xs text-neutral-400">
        Loading developer profile...
      </div>
    );
  }

  if (error || !developer) {
    return notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start gap-6">
        {developer.avatarUrl ? (
          <img
            src={developer.avatarUrl}
            alt={developer.displayName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-brand-500/20 shadow-sm shrink-0"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-50 border-2 border-brand-200 text-brand-600 font-bold text-2xl flex items-center justify-center uppercase shrink-0">
            {developer.username.slice(0, 2)}
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {developer.displayName || developer.username}
            </h1>
            <Badge variant="brand" size="sm">
              {formatRole(developer.role)}
            </Badge>
          </div>

          <p className="text-xs font-mono text-neutral-500">@{developer.username}</p>

          {developer.bio && (
            <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl pt-1">
              {developer.bio}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Member since {formatDate(developer.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" />
              {apps.length} published application{apps.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {/* Published Applications */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Published Applications
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Public applications and source code created by @{developer.username}
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-xs text-neutral-400">
            This developer has not published any public applications yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <AppCard key={app._id.toString()} app={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
