"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ExternalLink,
  Code2,
  Play,
  Calendar,
  Layers,
  FolderPlus,
  Share2,
  FileCode,
  Download,
  AlertCircle,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Compass,
  ChevronRight,
  HardDrive,
  Cpu,
  Globe,
  FileText,
} from "lucide-react";
import { Application } from "@/types";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LanguageBar } from "@/components/apps/LanguageBar";
import { FavoriteButton } from "@/components/apps/FavoriteButton";
import { AddToCollectionModal } from "@/components/apps/AddToCollectionModal";
import { formatDate, formatBytes, formatPlatform, formatCategory, formatVisibility } from "@/lib/utils";

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "runtime">("description");
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [relatedApps, setRelatedApps] = useState<Application[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [creator, setCreator] = useState<{
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  } | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    async function loadApp() {
      try {
        const res = await fetch(`/api/applications/${slug}`);
        if (res.status === 404) {
          setError("NOT_FOUND");
          return;
        }
        if (res.status === 403) {
          setError("FORBIDDEN");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          const loadedApp: Application = data.application;
          setApp(loadedApp);
          if (loadedApp.screenshots?.length > 0) {
            setSelectedScreenshot(loadedApp.screenshots[0]);
          }

          if (loadedApp.ownerAvatarUrl || loadedApp.ownerDisplayName) {
            setCreator({
              avatarUrl: loadedApp.ownerAvatarUrl || "",
              displayName: loadedApp.ownerDisplayName || loadedApp.ownerUsername,
              bio: loadedApp.ownerBio || "",
            });
          }

          // Fetch fresh creator profile details
          try {
            const devRes = await fetch(`/api/users/${loadedApp.ownerUsername}`);
            if (devRes.ok) {
              const devData = await devRes.json();
              if (devData.developer) {
                setCreator(devData.developer);
              }
            }
          } catch {
            // ignore
          }

          // Fetch related applications in same category
          try {
            const relRes = await fetch(`/api/applications?category=${loadedApp.category}&limit=4`);
            if (relRes.ok) {
              const relData = await relRes.json();
              const filtered = (relData.items || []).filter(
                (item: Application) => item._id.toString() !== loadedApp._id.toString()
              );
              setRelatedApps(filtered.slice(0, 3));
            }
          } catch {
            // ignore related fetch errors
          }
        } else {
          setError("ERROR");
        }
      } catch {
        setError("ERROR");
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [slug]);

  // Keyboard shortcut listener (P for Play, S for Source)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!app) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.key === "p" || e.key === "P") && app.isRunnable) {
        e.preventDefault();
        router.push(`/apps/${app.slug}/play`);
      } else if ((e.key === "s" || e.key === "S") && app.sourceStatus === "READY") {
        e.preventDefault();
        router.push(`/apps/${app.slug}/source`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [app, router]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const handleCopyEmbed = () => {
    if (!app || typeof window === "undefined") return;
    const embedCode = `<iframe src="${window.location.origin}/api/sandbox/${app.slug}" width="100%" height="600" frameborder="0" allowfullscreen allow="fullscreen; autoplay; gamepad" sandbox="allow-scripts allow-same-origin allow-popups allow-pointer-lock allow-forms"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2400);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6 anim-scale-in">
        <div className="w-full h-64 bg-slate-200/60 backdrop-blur-md animate-pulse rounded-3xl border border-white/50" />
        <div className="space-y-3">
          <div className="w-1/3 h-8 bg-slate-200/60 animate-pulse rounded-lg" />
          <div className="w-1/4 h-4 bg-slate-200/60 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error === "NOT_FOUND" || !app) {
    return notFound();
  }

  if (error === "FORBIDDEN") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center anim-scale-in">
        <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-amber-600 mb-4 shadow-sm border border-amber-200/60">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Private Application</h2>
        <p className="text-xs text-neutral-500 max-w-sm mt-1.5 mb-6 leading-relaxed">
          This application is configured as private and can only be accessed by its creator or platform administrators.
        </p>
        <Link href="/explore">
          <Button size="sm">Browse Public Applications</Button>
        </Link>
      </div>
    );
  }

  const platformInfo = PLATFORMS.find((p) => p.value === app.platform);
  const categoryInfo = CATEGORIES.find((c) => c.value === app.category);

  const hasStaticZip = Boolean(
    (app.runtimeType === "STATIC_ZIP" || app.runtimeType === "BOTH" || !app.runtimeType) &&
    app.sourceStatus === "READY"
  );
  const hasExternalUrl = Boolean(app.runtimeUrl && app.runtimeUrl.trim().length > 0);
  const hasBoth = hasStaticZip && hasExternalUrl;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 anim-slide-up">
      {/* Toast Notification */}
      {copiedLink && (
        <div className="fixed top-20 right-6 z-50 glass-panel px-4 py-2.5 rounded-xl border border-brand-200/80 shadow-xl flex items-center gap-2 anim-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-neutral-800">
            Application link copied to clipboard!
          </span>
        </div>
      )}

      {/* Hero Banner or Visual Showcase */}
      {app.heroBannerUrl ? (
        <div className="w-full h-56 sm:h-72 rounded-3xl overflow-hidden border border-white/60 relative bg-neutral-900 shadow-md group">
          <img
            src={app.heroBannerUrl}
            alt={`${app.name} banner`}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : null}

      {/* Main App Header Glass Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-white/80 shadow-md shadow-slate-900/5">
        {/* Top: Identity Block (Icon + Full Single-Line Name + Single-Line Tags) */}
        <div className="flex items-start gap-5 sm:gap-6 min-w-0">
          <div className="relative group shrink-0">
            <img
              src={app.thumbnailUrl}
              alt={app.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-white/80 shadow-md shadow-slate-900/5 transition-transform duration-200 ease-out group-hover:scale-[1.02]"
            />
            {app.isRunnable && (
              <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md text-[10px] ring-2 ring-white">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
            {/* 1. App Name: Completely Visible In One Line (No Truncation) */}
            <h1
              title={app.name}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight whitespace-nowrap block leading-tight"
            >
              {app.name}
            </h1>

            {/* 2. All Tags In ONE Single Horizontal Line */}
            <div className="flex items-center gap-2 mt-3 flex-nowrap overflow-x-auto no-scrollbar">
              <Badge variant="brand" size="md" className="shrink-0 whitespace-nowrap">
                {platformInfo?.label || formatPlatform(app.platform)}
              </Badge>
              <Badge variant="neutral" size="md" className="shrink-0 whitespace-nowrap">
                {categoryInfo?.label || formatCategory(app.category)}
              </Badge>
              {app.isRunnable && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-emerald-50/90 text-emerald-700 border border-emerald-200/80 rounded-full shadow-2xs shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Runtime Sandbox
                </span>
              )}
              {app.visibility === "PRIVATE" && (
                <Badge variant="danger" size="md" className="shrink-0 whitespace-nowrap">
                  <Lock className="w-3 h-3" /> Private
                </Badge>
              )}
            </div>

            {/* 3. Metadata & Author */}
            <div className="flex items-center gap-3 text-xs text-neutral-500 mt-2.5 flex-nowrap whitespace-nowrap">
              <span className="flex items-center gap-1.5">
                {(creator?.avatarUrl || app.ownerAvatarUrl) && !avatarFailed && (
                  <img
                    src={creator?.avatarUrl || app.ownerAvatarUrl}
                    alt={app.ownerUsername}
                    className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0"
                    onError={() => setAvatarFailed(true)}
                  />
                )}
                <span>by</span>
                <Link
                  href={`/developers/${app.ownerUsername}`}
                  className="font-semibold text-neutral-800 hover:text-brand-600 transition-colors underline decoration-neutral-300 hover:decoration-brand-500"
                >
                  @{app.ownerUsername}
                </Link>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-neutral-600">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Published {formatDate(app.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action Controls Strip */}
        <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Primary & Secondary Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            {Boolean(app.isRunnable) && (
              <Link href={`/apps/${app.slug}/play`}>
                <Button
                  variant="primary"
                  size="md"
                  className="h-11 px-5 gap-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-sm shadow-brand-500/20 hover:shadow-md hover:shadow-brand-500/25 transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span>
                    Launch Runtime Sandbox
                  </span>
                  <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-white/20 text-white ml-0.5 leading-none">
                    [P]
                  </span>
                </Button>
              </Link>
            )}

            {app.sourceStatus === "READY" && (
              <Link href={`/apps/${app.slug}/source`}>
                <Button
                  variant="outline"
                  size="md"
                  className="h-11 px-5 gap-2 text-xs sm:text-sm font-semibold text-neutral-800 bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <Code2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Browse Source</span>
                  <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-neutral-500 ml-0.5 leading-none border border-slate-200/60">
                    [S]
                  </span>
                </Button>
              </Link>
            )}

            {app.runtimeUrl && (
              <a
                href={app.runtimeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="md"
                  className="h-11 px-5 gap-2 text-xs sm:text-sm font-semibold text-neutral-800 bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <ExternalLink className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span>External Link</span>
                </Button>
              </a>
            )}
          </div>

          {/* Right: Quick Tools Toolbar */}
          <div className="flex items-center gap-1.5">
            <FavoriteButton
              applicationId={app._id.toString()}
              size="md"
              iconOnly
              className="h-10 w-10 rounded-xl border-neutral-200 hover:border-neutral-300"
            />
            <Button
              variant="outline"
              size="md"
              onClick={() => setCollectionModalOpen(true)}
              title="Add to personal collection"
              aria-label="Add to collection"
              className="h-10 w-10 p-0 shrink-0 flex items-center justify-center text-neutral-700 hover:text-neutral-900 border-neutral-200 hover:border-neutral-300 rounded-xl"
            >
              <FolderPlus className="w-4.5 h-4.5 text-neutral-600" />
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleCopyLink}
              title="Share Application Link"
              aria-label="Share Link"
              className="h-10 w-10 p-0 shrink-0 flex items-center justify-center text-neutral-700 hover:text-neutral-900 border-neutral-200 hover:border-neutral-300 rounded-xl"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4.5 h-4.5 text-neutral-600" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB BAR SYSTEM: Description, Tech Specs, Runtime Sandbox */}
      {/* ======================================================== */}
      <div className="space-y-6">
        {/* Individual Tab Containers (No Big Shared Background Container) */}
        <nav
          aria-label="Application tabs"
          className="flex items-center gap-2.5 sm:gap-3 max-w-full overflow-x-auto no-scrollbar -mx-1.5 px-1.5 py-2"
        >
          {/* Tab 1: Description & Previews Container */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "description"}
            onClick={() => setActiveTab("description")}
            className={`group h-11 flex items-center gap-2 px-4 sm:px-5 text-xs sm:text-sm font-semibold rounded-2xl transition-all duration-200 ease-out whitespace-nowrap select-none ${
              activeTab === "description"
                ? "bg-brand-50/90 text-brand-700 border border-brand-300 ring-2 ring-inset ring-brand-500/20 shadow-xs font-bold"
                : "bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm"
            }`}
          >
            <FileText
              className={`w-4 h-4 transition-colors ${
                activeTab === "description"
                  ? "text-brand-600"
                  : "text-neutral-400 group-hover:text-neutral-600"
              }`}
            />
            <span>Description &amp; Previews</span>
          </button>

          {/* Tab 2: Technical Specs Container */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "specs"}
            onClick={() => setActiveTab("specs")}
            className={`group h-11 flex items-center gap-2 px-4 sm:px-5 text-xs sm:text-sm font-semibold rounded-2xl transition-all duration-200 ease-out whitespace-nowrap select-none ${
              activeTab === "specs"
                ? "bg-brand-50/90 text-brand-700 border border-brand-300 ring-2 ring-inset ring-brand-500/20 shadow-xs font-bold"
                : "bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm"
            }`}
          >
            <Cpu
              className={`w-4 h-4 transition-colors ${
                activeTab === "specs"
                  ? "text-brand-600"
                  : "text-neutral-400 group-hover:text-neutral-600"
              }`}
            />
            <span>Technical Specs</span>
          </button>

          {/* Tab 3: Runtime Sandbox Container */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "runtime"}
            onClick={() => setActiveTab("runtime")}
            className={`group h-11 flex items-center gap-2 px-4 sm:px-5 text-xs sm:text-sm font-semibold rounded-2xl transition-all duration-200 ease-out whitespace-nowrap select-none ${
              activeTab === "runtime"
                ? app.isRunnable
                  ? "bg-emerald-50/90 text-emerald-800 border border-emerald-300 ring-2 ring-inset ring-emerald-500/20 shadow-xs font-bold"
                  : "bg-brand-50/90 text-brand-700 border border-brand-300 ring-2 ring-inset ring-brand-500/20 shadow-xs font-bold"
                : "bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm"
            }`}
          >
            <Play
              className={`w-3.5 h-3.5 transition-colors ${
                app.isRunnable
                  ? activeTab === "runtime"
                    ? "text-emerald-600 fill-current"
                    : "text-emerald-500 fill-current"
                  : "text-neutral-400"
              }`}
            />
            <span>Runtime Sandbox</span>
            {app.isRunnable ? (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none transition-colors ${
                  activeTab === "runtime"
                    ? "bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 shadow-xs"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400 font-medium">(Offline)</span>
            )}
          </button>
        </nav>

        {/* Tab 1: Description & Previews */}
        {activeTab === "description" && (
          <div className="space-y-8 anim-slide-up">
            {/* About / Description */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>About this application</span>
              </h2>
              <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line glass-card p-6 sm:p-7 rounded-3xl border border-white/70 shadow-sm">
                {app.description}
              </div>
            </section>

            {/* Screenshots Gallery */}
            {app.screenshots && app.screenshots.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-500" />
                  <span>Screenshots &amp; Previews</span>
                </h2>
                <div className="space-y-3">
                  {selectedScreenshot && (
                    <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/80 bg-neutral-950 shadow-md relative group">
                      <img
                        src={selectedScreenshot}
                        alt="Selected preview"
                        className="w-full h-full object-contain transition-all duration-300 ease-out"
                      />
                    </div>
                  )}

                  <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
                    {app.screenshots.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedScreenshot(s)}
                        className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.99] ${
                          selectedScreenshot === s
                            ? "border-brand-500 ring-2 ring-brand-500/20 shadow-sm"
                            : "border-slate-200/80 hover:border-slate-300 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={s}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tab 2: Technical Specs */}
        {activeTab === "specs" && (
          <div className="space-y-6 anim-slide-up">
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/70 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg tracking-tight">
                    Technical Specifications
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Platform requirements, cloud architecture, and package identifiers
                  </p>
                </div>
                <Badge variant="brand" size="md">
                  {platformInfo?.label || formatPlatform(app.platform)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/60 border border-neutral-200/60 space-y-1">
                  <span className="text-neutral-400 block font-medium">Target Platform</span>
                  <span className="font-bold text-sm text-neutral-800">{platformInfo?.label || formatPlatform(app.platform)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-neutral-200/60 space-y-1">
                  <span className="text-neutral-400 block font-medium">Application Category</span>
                  <span className="font-bold text-sm text-neutral-800">{categoryInfo?.label || formatCategory(app.category)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-neutral-200/60 space-y-1">
                  <span className="text-neutral-400 block font-medium">Publishing Visibility</span>
                  <span className="font-bold text-sm text-neutral-800">{formatVisibility(app.visibility)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-neutral-200/60 space-y-1">
                  <span className="text-neutral-400 block font-medium">Runtime Sandbox Support</span>
                  <span className="font-bold text-sm text-neutral-800">
                    {app.isRunnable
                      ? hasBoth
                        ? "Dual Runtime (Static ZIP index.html + External URL)"
                        : app.runtimeType === "STATIC_ZIP"
                        ? "Self-Hosted Static ZIP"
                        : "External Hosted URL"
                      : "Disabled"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-neutral-200/60 space-y-1">
                  <span className="text-neutral-400 block font-medium">Entrypoint Document</span>
                  <span className="font-mono text-xs text-neutral-700">
                    {hasBoth
                      ? `${app.entrypointPath || "index.html"} (Static) & ${app.runtimeUrl} (Live URL)`
                      : app.entrypointPath || (app.runtimeType === "STATIC_ZIP" ? "index.html" : "N/A")}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-neutral-200/60 space-y-1">
                  <span className="text-neutral-400 block font-medium">Canonical Slug</span>
                  <span className="font-mono text-xs text-neutral-700">/{app.slug}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-neutral-200/60 space-y-1">
                  <span className="text-neutral-400 block font-medium">Last Modified Timestamp</span>
                  <span className="font-semibold text-xs text-neutral-700">{formatDate(app.updatedAt)}</span>
                </div>
              </div>

              {/* Share & Embed Quick Strip */}
              <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-neutral-500">Need to share or integrate this application?</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-8 gap-1.5 text-xs">
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
                  </Button>
                  {app.isRunnable && (
                    <Button variant="outline" size="sm" onClick={() => setEmbedModalOpen(true)} className="h-8 gap-1.5 text-xs">
                      <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Embed Snippet</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Web Runtime */}
        {activeTab === "runtime" && (
          <div className="space-y-6 anim-slide-up">
            {app.isRunnable ? (
              <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-white/80 glass-dock shadow-xl space-y-6">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-brand-500/20 to-indigo-500/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-500/15 to-teal-500/15 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-700 text-xs font-semibold border border-brand-500/20 backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                      {hasBoth ? "Dual Web Runtime Active" : "Active Web Runtime"}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                      {hasBoth ? `Run ${app.name} In Browser (Dual Mode)` : `Run ${app.name} Directly In Your Browser`}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      {hasBoth
                        ? `This application supports both self-hosted static execution from the project archive (${app.entrypointPath || "index.html"}) and live embedding from the deployed web application (${app.runtimeUrl}). You can switch between either runtime anytime in Runtime Sandbox.`
                        : app.runtimeType === "STATIC_ZIP"
                        ? `Self-hosted directly from the uploaded source archive (${app.entrypointPath || "index.html"}). Textures, audio, scripts, and WebAssembly are streamed securely through DevVerse Runtime Sandbox.`
                        : `Framed live from an external web application URL (${app.runtimeUrl}).`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    {hasBoth ? (
                      <>
                        <Link href={`/apps/${app.slug}/play?mode=static`}>
                          <Button
                            size="md"
                            className="w-full sm:w-auto h-11 px-5 gap-2 font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Run Static ({app.entrypointPath || "index.html"})</span>
                          </Button>
                        </Link>
                        <Link href={`/apps/${app.slug}/play?mode=external`}>
                          <Button
                            size="md"
                            className="w-full sm:w-auto h-11 px-5 gap-2 font-bold text-xs bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-500/25 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Globe className="w-3.5 h-3.5 text-blue-200" />
                            <span>Run Live Web App</span>
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Link href={`/apps/${app.slug}/play`}>
                        <Button
                          size="lg"
                          className="w-full sm:w-auto h-12 px-6 gap-2.5 font-bold text-sm bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-500/30 hover:scale-[1.03] active:scale-[0.98]"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Launch Runtime Sandbox</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/60 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/60 border border-neutral-200/60">
                    <span className="font-semibold text-neutral-800 block">Runtime Sandbox</span>
                    <span className="text-neutral-500 text-[11px]">Strict camera, microphone, and geolocation permission sandboxing.</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/60 border border-neutral-200/60">
                    <span className="font-semibold text-neutral-800 block">Auto-Adaptive Canvas</span>
                    <span className="text-neutral-500 text-[11px]">Automatically detects your device and fits the viewport natively.</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/60 border border-neutral-200/60">
                    <span className="font-semibold text-neutral-800 block">Direct Embedding</span>
                    <span className="text-neutral-500 text-[11px]">Easily frame into blogs, showcases, or documentation with one click.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-10 rounded-3xl border border-white/70 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Runtime Sandbox Not Enabled</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    The developer has configured this application as standard desktop software or source repository without in-browser web playability.
                  </p>
                </div>
                {app.sourceStatus === "READY" && (
                  <Link href={`/apps/${app.slug}/source`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Browse Source Code</span>
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* FREE FROM TAB SYSTEM (Source Code, Creator, Security, Related) */}
      {/* ======================================================== */}
      <div className="pt-10 border-t border-slate-200/80 space-y-10">
        {/* 1. Source Code & Architecture */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <FileCode className="w-5 h-5 text-brand-500" />
              <span>Source Code &amp; Architecture</span>
            </h2>
            {app.sourceStatus === "READY" && (
              <Link
                href={`/apps/${app.slug}/source`}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline group"
              >
                <Code2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                <span>Open Interactive Code Viewer &rarr;</span>
              </Link>
            )}
          </div>

          <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/70 space-y-5 shadow-sm">
            {app.sourceStatus === "READY" ? (
              <>
                <LanguageBar languages={app.languages} />
                <div className="pt-4 border-t border-neutral-200/60 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Extracted files: </span>
                    <strong className="text-neutral-800 font-bold">{app.sourceFileCount}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Archive size: </span>
                    <strong className="text-neutral-800 font-bold">{formatBytes(app.sourceArchiveSize || 0)}</strong>
                  </div>
                  <a
                    href={`/api/applications/${app.slug}/source`}
                    className="text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download ZIP Archive
                  </a>
                </div>
              </>
            ) : app.sourceStatus === "PROCESSING" ? (
              <div className="flex items-center gap-3 text-xs text-amber-700 bg-amber-50/80 p-4 rounded-xl border border-amber-200">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>The source code archive is currently being processed and analyzed.</span>
              </div>
            ) : (
              <div className="text-xs text-neutral-400 py-4 text-center">
                Source code has not yet been uploaded for this application.
              </div>
            )}
          </div>
        </section>

        {/* 2. Creator & Developer Spotlight */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            {(creator?.avatarUrl || app.ownerAvatarUrl) && !avatarFailed ? (
              <img
                src={creator?.avatarUrl || app.ownerAvatarUrl}
                alt={creator?.displayName || app.ownerDisplayName || app.ownerUsername}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200/90 shadow-md shadow-brand-500/10 shrink-0"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                {(creator?.displayName || app.ownerDisplayName || app.ownerUsername).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-neutral-900">
                  {creator?.displayName || app.ownerDisplayName || app.ownerUsername}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200/60">
                  Creator
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {creator?.bio || app.ownerBio || "Verified developer publishing open source and interactive software on DevVerse."}
              </p>
            </div>
          </div>

          <Link href={`/developers/${app.ownerUsername}`}>
            <Button variant="outline" size="sm" className="h-10 gap-2 shrink-0">
              <span>View Creator Profile</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* 3. More Applications in this Category (Related Apps) */}
        {relatedApps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                  <Compass className="w-4 h-4 text-brand-500" />
                  <span>More {categoryInfo?.label || "Related"} Applications</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Explore other software built for {platformInfo?.label}
                </p>
              </div>

              <Link
                href={`/explore?category=${app.category}`}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
              >
                <span>View all in {categoryInfo?.label} &rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedApps.map((rel) => (
                <Link
                  key={rel._id.toString()}
                  href={`/apps/${rel.slug}`}
                  className="glass-card p-4 rounded-2xl border border-white/70 block group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-brand-300/60"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={rel.thumbnailUrl}
                      alt={rel.name}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-200/70 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-neutral-900 group-hover:text-brand-600 transition-colors truncate">
                        {rel.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                        {rel.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                          {formatPlatform(rel.platform)}
                        </span>
                        {rel.isRunnable && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                            <Play className="w-2 h-2 fill-current" /> Play
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embed Modal */}
      {embedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-sm anim-scale-in">
          <div className="glass-panel max-w-lg w-full p-6 rounded-3xl border border-white/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-600" />
                <span>Embed Runtime Sandbox</span>
              </h3>
              <button
                onClick={() => setEmbedModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Copy this iframe snippet to embed the playable version of {app.name} into any external webpage:
            </p>
            <div className="p-3 bg-neutral-950 rounded-xl text-neutral-300 font-mono text-[11px] leading-relaxed break-all select-all">
              {`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/api/sandbox/${app.slug}" width="100%" height="600" frameborder="0" allowfullscreen allow="fullscreen; autoplay; gamepad" sandbox="allow-scripts allow-same-origin allow-popups allow-pointer-lock allow-forms"></iframe>`}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEmbedModalOpen(false)}>
                Close
              </Button>
              <Button size="sm" onClick={handleCopyEmbed} className="gap-1.5">
                {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmbed ? "Copied Snippet!" : "Copy Embed Code"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        applicationId={app._id.toString()}
        applicationName={app.name}
      />
    </div>
  );
}
