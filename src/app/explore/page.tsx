"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, SlidersHorizontal, X } from "lucide-react";
import { AppCard } from "@/components/apps/AppCard";
import { AppCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";
import { Application, Platform, Category } from "@/types";

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [apps, setApps] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = (searchParams.get("category") as Category) || "";
  const currentPlatform = (searchParams.get("platform") as Platform) || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // Reset page to 1 whenever filters change, unless page was explicitly updated
    if (!updates.page) {
      params.set("page", "1");
    }
    router.push(`/explore?${params.toString()}`);
  };

  useEffect(() => {
    async function fetchApps() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (currentSearch) query.set("search", currentSearch);
        if (currentCategory) query.set("category", currentCategory);
        if (currentPlatform) query.set("platform", currentPlatform);
        if (currentSort) query.set("sort", currentSort);
        query.set("page", currentPage.toString());
        query.set("limit", "12");

        const res = await fetch(`/api/applications?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setApps(data.items || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, [currentSearch, currentCategory, currentPlatform, currentSort, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() || null });
  };

  const hasActiveFilters = Boolean(currentSearch || currentCategory || currentPlatform);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Explore Applications
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Discover applications, browse source code, and inspect software across all platforms
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search catalog..."
            className="w-full pl-9 pr-20 py-2 text-xs bg-white/90 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 shadow-xs"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 hover:-translate-y-1/2 active:-translate-y-1/2 h-7 px-3 text-[11px] rounded-lg"
          >
            Find
          </Button>
        </form>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="space-y-4">
        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-neutral-400 font-medium shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => updateFilters({ category: null })}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 select-none ${
              !currentCategory
                ? "bg-brand-50 text-brand-700 border border-brand-300 ring-2 ring-inset ring-brand-500/20 font-bold shadow-xs"
                : "bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm font-medium"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => updateFilters({ category: cat.value })}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 select-none ${
                currentCategory === cat.value
                  ? "bg-brand-50 text-brand-700 border border-brand-300 ring-2 ring-inset ring-brand-500/20 font-bold shadow-xs"
                  : "bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm font-medium"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Platforms & Sort row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <span className="text-neutral-400 font-medium shrink-0 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Platform:
            </span>
            <button
              onClick={() => updateFilters({ platform: null })}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 select-none ${
                !currentPlatform
                  ? "bg-brand-50 text-brand-700 border border-brand-300 ring-2 ring-inset ring-brand-500/20 font-bold shadow-xs"
                  : "bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm font-medium"
              }`}
            >
              All
            </button>
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => updateFilters({ platform: p.value })}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 select-none ${
                  currentPlatform === p.value
                    ? "bg-brand-50 text-brand-700 border border-brand-300 ring-2 ring-inset ring-brand-500/20 font-bold shadow-xs"
                    : "bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm font-medium"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={() =>
                  updateFilters({ category: null, platform: null, search: null })
                }
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}

            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="font-medium shrink-0">Sort:</span>
              <Select
                value={currentSort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                size="sm"
                className="w-36"
                options={[
                  { value: "newest", label: "Newest first" },
                  { value: "oldest", label: "Oldest first" },
                  { value: "name", label: "Name (A-Z)" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
          <span>Showing {apps.length} of {total} applications</span>
          {totalPages > 1 && <span>Page {currentPage} of {totalPages}</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <AppCardSkeleton key={i} />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            title="No applications match your criteria"
            description="Try relaxing your filters, searching for a different keyword, or exploring another platform."
            action={
              hasActiveFilters ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateFilters({ category: null, platform: null, search: null })
                  }
                >
                  Clear All Filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {apps.map((app) => (
              <AppCard key={app._id.toString()} app={app} />
            ))}
          </div>
        )}
      </div>

      {/* Server Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-neutral-200">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1 || loading}
            onClick={() => updateFilters({ page: (currentPage - 1).toString() })}
          >
            &larr; Previous
          </Button>

          <span className="text-xs font-medium text-neutral-600 px-3">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages || loading}
            onClick={() => updateFilters({ page: (currentPage + 1).toString() })}
          >
            Next &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading catalog...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
