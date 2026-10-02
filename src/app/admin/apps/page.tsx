"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Grid,
  Search,
  ExternalLink,
  Trash2,
  Lock,
  Eye,
  FolderTree,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { formatDate, formatBytes, formatPlatform, formatCategory, formatVisibility, formatSourceStatus } from "@/lib/utils";
import { Application } from "@/types";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";

export default function AdminAppsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (visibilityFilter) q.set("visibility", visibilityFilter);
      q.set("page", page.toString());
      q.set("limit", "15");

      const res = await fetch(`/api/admin/applications?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setApps(data.applications || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [page, visibilityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApps();
  };

  const handleToggleVisibility = async (app: Application) => {
    const nextVis = app.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    try {
      const res = await fetch(`/api/admin/applications/${app._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: nextVis }),
      });
      if (res.ok) {
        fetchApps();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (app: Application) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY delete "${app.name}"? This will delete all source files from B2 Storage and purge all related favorites and collection references.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/applications/${app._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchApps();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Grid className="w-6 h-6 text-brand-500" />
            <span>Applications Administration</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Global repository catalog, visibility moderation, and storage lifecycle management
          </p>
        </div>

        <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full">
          Total Applications: {total}
        </span>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, slug, or developer..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        <Select
          value={visibilityFilter}
          onChange={(e) => {
            setVisibilityFilter(e.target.value);
            setPage(1);
          }}
          size="sm"
          className="w-36"
          options={[
            { value: "", label: "All Visibility" },
            { value: "PUBLIC", label: "PUBLIC" },
            { value: "PRIVATE", label: "PRIVATE" },
          ]}
        />
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400">Loading catalog...</div>
      ) : apps.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-xs text-neutral-400">
          No applications found matching your query.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Developer</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Source State</TableHead>
              <TableHead>Created</TableHead>
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
                      className="w-8 h-8 rounded object-cover border border-neutral-200 shrink-0"
                    />
                    <div>
                      <span className="font-semibold text-xs text-neutral-900 block truncate max-w-[180px]">
                        {app.name}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        /{app.slug}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-neutral-600">
                  @{app.ownerUsername}
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
                  <button
                    onClick={() => handleToggleVisibility(app)}
                    title="Click to toggle visibility"
                    className="cursor-pointer"
                  >
                    <Badge
                      variant={app.visibility === "PUBLIC" ? "success" : "neutral"}
                      size="sm"
                    >
                      {formatVisibility(app.visibility)}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold ${app.sourceStatus === "READY" ? "text-emerald-600" : "text-neutral-400"}`}>
                    {formatSourceStatus(app.sourceStatus)}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {formatDate(app.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/apps/${app.slug}`} target="_blank" title="View Public Page">
                      <Button size="sm" variant="ghost" className="p-1.5 h-auto">
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                      </Button>
                    </Link>

                    {app.sourceStatus === "READY" && (
                      <Link href={`/apps/${app.slug}/source`} target="_blank" title="Inspect Source Tree">
                        <Button size="sm" variant="ghost" className="p-1.5 h-auto">
                          <FolderTree className="w-3.5 h-3.5 text-neutral-500" />
                        </Button>
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(app)}
                      title="Permanent Delete"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
