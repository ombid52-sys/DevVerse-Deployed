"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Application } from "@/types";
import { AppCard } from "@/components/apps/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchFavorites();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span>My Favourites</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Applications you have starred and bookmarked for quick access
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400">Loading favourites...</div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-12 h-12 text-neutral-300 stroke-1" />}
          title="No favourite applications yet"
          description="Browse public applications and click the favourite button to collect software you love."
          action={
            <Link href="/explore">
              <Button size="sm">Explore Applications</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((app) => (
            <AppCard key={app._id.toString()} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
