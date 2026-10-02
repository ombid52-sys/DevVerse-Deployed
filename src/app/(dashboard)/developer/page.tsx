"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Code2,
  Layers,
  Eye,
  Lock,
  ArrowRight,
  FileCode,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Application } from "@/types";
import { formatDate, formatVisibility, formatPlatform, formatCategory } from "@/lib/utils";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";

export default function DeveloperDashboardPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await fetch("/api/applications?mine=true&limit=50");
        if (res.ok) {
          const data = await res.json();
          setApps(data.items || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, []);

  const totalApps = apps.length;
  const publicApps = apps.filter((a) => a.visibility === "PUBLIC").length;
  const privateApps = apps.filter((a) => a.visibility === "PRIVATE").length;
  const readySourceApps = apps.filter((a) => a.sourceStatus === "READY").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Developer Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your applications, source-code repositories, and platform deployments
          </p>
        </div>

        <Link href="/developer/apps/new">
          <Button size="md">
            <Plus className="w-4 h-4 mr-1" /> Publish Application
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center border border-blue-200/60 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Total Applications</p>
              <h3 className="text-2xl font-bold text-neutral-900">{totalApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Public in Showcase</p>
              <h3 className="text-2xl font-bold text-neutral-900">{publicApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Private Drafts</p>
              <h3 className="text-2xl font-bold text-neutral-900">{privateApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Source Ready</p>
              <h3 className="text-2xl font-bold text-neutral-900">{readySourceApps}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Applications Quick Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            Your Applications
          </h2>
          <Link
            href="/developer/apps"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Manage all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400">Loading your applications...</div>
        ) : apps.length === 0 ? (
          <div className="glass-card border border-white/80 rounded-2xl py-14 px-6 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200/60 flex items-center justify-center mb-3">
              <Code2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-neutral-800">
              You have not published any applications yet.
            </p>
            <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-6">
              Get started by publishing your first application alongside its source code repository.
            </p>
            <Link href="/developer/apps/new" className="inline-block">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
                Publish First Application
              </Button>
            </Link>
          </div>
        ) : (
          <div className="glass-card border border-white/80 rounded-2xl divide-y divide-slate-100/90 overflow-hidden shadow-xs">
            {apps.slice(0, 5).map((app) => (
              <div
                key={app._id.toString()}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/75 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={app.thumbnailUrl}
                    alt={app.name}
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/apps/${app.slug}`}
                        className="font-semibold text-sm text-neutral-900 hover:text-brand-600 transition-colors"
                      >
                        {app.name}
                      </Link>
                      <Badge
                        variant={app.visibility === "PUBLIC" ? "success" : "neutral"}
                        size="sm"
                      >
                        {formatVisibility(app.visibility)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="neutral" size="sm">
                        {PLATFORMS.find((p) => p.value === app.platform)?.label || formatPlatform(app.platform)}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {CATEGORIES.find((c) => c.value === app.category)?.label || formatCategory(app.category)}
                      </Badge>
                      <span className="text-neutral-400 text-xs ml-1">Updated {formatDate(app.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {app.sourceStatus === "READY" ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium mr-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Source Ready
                    </span>
                  ) : (
                    <Link href={`/developer/apps/${app._id}/edit?tab=source`}>
                      <span className="flex items-center gap-1 text-amber-600 font-medium mr-2 hover:underline">
                        <AlertCircle className="w-3.5 h-3.5" /> Upload Source
                      </span>
                    </Link>
                  )}

                  <Link href={`/developer/apps/${app._id}/edit`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>

                  <Link href={`/developer/apps/${app._id}/edit?tab=source`}>
                    <Button size="sm" variant="outline">
                      Source
                    </Button>
                  </Link>

                  <Link href={`/apps/${app.slug}`}>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
