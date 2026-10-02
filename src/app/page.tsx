"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Code2,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Monitor,
  Apple,
  Smartphone,
  Globe,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppCard } from "@/components/apps/AppCard";
import { AppCardSkeleton } from "@/components/ui/Skeleton";
import { Application } from "@/types";
import { CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [featuredApps, setFeaturedApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch("/api/applications?limit=6&sort=newest");
        if (res.ok) {
          const data = await res.json();
          setFeaturedApps(data.items || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const platforms = [
    { name: "Windows", desc: "Platform", icon: Monitor, href: "/explore?platform=WINDOWS" },
    { name: "Linux", desc: "Platform", icon: Terminal, href: "/explore?platform=LINUX" },
    { name: "macOS", desc: "Platform", icon: Apple, href: "/explore?platform=MACOS" },
    { name: "Android", desc: "Platform", icon: Smartphone, href: "/explore?platform=ANDROID" },
    { name: "Web", desc: "Platform", icon: Globe, href: "/explore?platform=WEB_APP" },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/90 border border-brand-200/80 text-brand-700 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Application Showcase &amp; Source Explorer</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            Discover software. <br />
            <span className="text-brand-600">Explore the source code.</span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            DevVerse is the cloud-native platform for creators to showcase standalone software and full source code repositories across all major computing platforms.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto pt-2">
            <form onSubmit={handleSearch} className="relative flex items-center shadow-xs">
              <Search className="w-5 h-5 absolute left-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by application title, keyword, or language..."
                className="w-full pl-12 pr-28 py-3.5 text-sm bg-white/90 hover:bg-white focus:bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-neutral-900 shadow-sm"
              />
              <div className="absolute right-2">
                <Button type="submit" size="sm" className="rounded-xl h-9 px-4">
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/explore">
              <Button variant="outline" size="md">
                Browse All Applications
              </Button>
            </Link>
            <Link href="/developer/apps/new">
              <Button variant="primary" size="md">
                Publish Your App
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Supported Platforms Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Multi-Platform Showcase
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {platforms.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.name}
                href={p.href}
                className="p-4 glass-card border border-white/80 rounded-2xl hover:border-brand-300/80 hover:shadow-sm transition-all duration-150 ease-out group flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100/90 text-neutral-700 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-200/60 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-neutral-900 group-hover:text-brand-600 transition-colors truncate">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-medium">{p.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Applications Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
              Featured Applications
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Latest applications published with verified source archives
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View full catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AppCardSkeleton />
            <AppCardSkeleton />
            <AppCardSkeleton />
          </div>
        ) : featuredApps.length === 0 ? (
          <div className="text-center py-16 glass-card border border-white/80 rounded-2xl p-8">
            <Code2 className="w-12 h-12 text-neutral-400 mx-auto mb-3 stroke-1" />
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              No applications published yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
              Be the first developer to publish an application and share your source code with the DevVerse community.
            </p>
            <Link href="/developer/apps/new">
              <Button size="sm">Publish Now</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.map((app) => (
              <AppCard key={app._id.toString()} app={app} />
            ))}
          </div>
        )}
      </section>

      {/* Explore By Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Browse by Category
        </h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={`/explore?category=${cat.value}`}
              className="px-3.5 py-2 glass-pill rounded-xl text-xs font-semibold text-neutral-700 hover:text-brand-600 hover:border-brand-300/80 shadow-2xs hover:shadow-xs transition-all duration-150"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Platform Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card border border-white/80 rounded-3xl p-8 sm:p-12 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center border border-blue-200/60">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-neutral-900">
              Interactive Source Browser
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Explore complete repository directory trees, examine syntax-highlighted source code, and inspect language distribution percentages directly in your browser.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-neutral-900">
              Protected Cloud Persistence
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Source code archives are validated against zip slip and decompressed bomb attacks, then persistently preserved in B2 Storage with application-level authorization.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-neutral-900">
              Collections &amp; Favourites
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Organize notable applications into custom collections, star your favorite projects, and follow developers across various software ecosystems.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
