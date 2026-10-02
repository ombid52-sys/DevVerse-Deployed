"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  Code2,
  Trash2,
  Edit,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Application } from "@/types";
import { formatDate, formatVisibility, formatPlatform, formatCategory } from "@/lib/utils";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";

export default function DeveloperAppsListPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const res = await fetch("/api/applications?mine=true&limit=100");
      if (res.ok) {
        const data = await res.json();
        setApps(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will clean up all associated source-code storage.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchApps();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-neutral-200">
        <Link
          href="/developer"
          className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Manage Applications
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review, update, and manage your published projects
            </p>
          </div>
          <Link href="/developer/apps/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Application
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400">Loading applications...</div>
      ) : apps.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl py-14 px-6 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <Code2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-neutral-800">
            No applications created yet.
          </p>
          <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-6">
            Create an application listing to start sharing your source repositories and binary releases.
          </p>
          <Link href="/developer/apps/new" className="inline-block">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              Create Application
            </Button>
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Source Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app._id.toString()}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={app.thumbnailUrl}
                      alt={app.name}
                      className="w-9 h-9 rounded-md object-cover border border-neutral-200 shrink-0"
                    />
                    <div>
                      <Link
                        href={`/apps/${app.slug}`}
                        className="font-semibold text-xs text-neutral-900 hover:text-brand-600 transition-colors"
                      >
                        {app.name}
                      </Link>
                      <p className="text-[11px] text-neutral-400 font-mono">/{app.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="neutral" size="sm">
                    {PLATFORMS.find((p) => p.value === app.platform)?.label || formatPlatform(app.platform)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" size="sm">
                    {CATEGORIES.find((c) => c.value === app.category)?.label || formatCategory(app.category)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={app.visibility === "PUBLIC" ? "success" : "neutral"}
                    size="sm"
                  >
                    {formatVisibility(app.visibility)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {app.sourceStatus === "READY" ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  ) : app.sourceStatus === "PROCESSING" ? (
                    <span className="flex items-center gap-1 text-amber-600 font-medium text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Processing
                    </span>
                  ) : (
                    <Link
                      href={`/developer/apps/${app._id}/edit?tab=source`}
                      className="flex items-center gap-1 text-neutral-500 hover:text-brand-600 text-xs font-medium"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {formatDate(app.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/apps/${app.slug}`} title="View Public Page">
                      <Button size="sm" variant="ghost" className="p-1.5 h-auto">
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                      </Button>
                    </Link>
                    <Link href={`/developer/apps/${app._id}/edit`} title="Edit Details">
                      <Button size="sm" variant="ghost" className="p-1.5 h-auto">
                        <Edit className="w-3.5 h-3.5 text-neutral-500" />
                      </Button>
                    </Link>
                    <Link href={`/developer/apps/${app._id}/edit?tab=source`} title="Manage Source">
                      <Button size="sm" variant="ghost" className="p-1.5 h-auto">
                        <Code2 className="w-3.5 h-3.5 text-neutral-500" />
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(app._id.toString(), app.name)}
                      title="Delete"
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
