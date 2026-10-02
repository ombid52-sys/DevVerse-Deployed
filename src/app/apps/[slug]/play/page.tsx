"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  RotateCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Code2,
  Sparkles,
  Globe,
  Lock,
  Layers,
  AlertCircle
} from "lucide-react";
import { Application } from "@/types";
import { Button } from "@/components/ui/Button";

export default function AppPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [selectedRuntime, setSelectedRuntime] = useState<"STATIC_ZIP" | "EXTERNAL_URL" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

          // Read ?mode=static or ?mode=external query parameter
          const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const modeParam = urlParams?.get("mode")?.toLowerCase();

          const hasStatic = Boolean(
            (loadedApp.runtimeType === "STATIC_ZIP" || loadedApp.runtimeType === "BOTH" || !loadedApp.runtimeType) &&
            loadedApp.sourceStatus === "READY"
          );
          const hasExternal = Boolean(loadedApp.runtimeUrl && loadedApp.runtimeUrl.trim().length > 0);

          if ((modeParam === "external" || modeParam === "live" || modeParam === "url") && hasExternal) {
            setSelectedRuntime("EXTERNAL_URL");
          } else if (modeParam === "static" && hasStatic) {
            setSelectedRuntime("STATIC_ZIP");
          } else if (loadedApp.runtimeType === "EXTERNAL_URL" && hasExternal && !hasStatic) {
            setSelectedRuntime("EXTERNAL_URL");
          } else if (hasStatic) {
            setSelectedRuntime("STATIC_ZIP");
          } else if (hasExternal) {
            setSelectedRuntime("EXTERNAL_URL");
          }
        } else {
          setError("ERROR");
        }
      } catch {
        setError("ERROR");
      } finally {
        setLoadingApp(false);
      }
    }
    loadApp();
  }, [slug]);

  // Fullscreen change listener
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleReload = () => {
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  if (loadingApp) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-xs text-neutral-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <span>Initializing Runtime Sandbox...</span>
      </div>
    );
  }

  if (error === "NOT_FOUND" || !app) {
    return notFound();
  }

  if (error === "FORBIDDEN") {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <Lock className="w-10 h-10 text-neutral-500 mb-3" />
        <h2 className="text-lg font-bold">Access Restricted</h2>
        <p className="text-xs text-neutral-400 mt-1 mb-6 max-w-sm">
          This application is private and can only be launched by its owner or platform administrators.
        </p>
        <Link href={`/apps/${slug}`}>
          <Button size="sm" variant="primary">
            Back to Application
          </Button>
        </Link>
      </div>
    );
  }

  if (!app.isRunnable) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold">Runtime Sandbox Not Enabled</h2>
        <p className="text-xs text-neutral-400 mt-1 mb-6 max-w-sm">
          The developer has not enabled Runtime Sandbox for this application.
        </p>
        <div className="flex items-center gap-3">
          <Link href={`/apps/${slug}`}>
            <Button size="sm" variant="outline">
              Application Details
            </Button>
          </Link>
          {app.sourceStatus === "READY" && (
            <Link href={`/apps/${slug}/source`}>
              <Button size="sm" variant="primary">
                Browse Source Code
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Determine available sandbox runtimes
  const hasStaticZip = Boolean(
    app &&
    (app.runtimeType === "STATIC_ZIP" || app.runtimeType === "BOTH" || !app.runtimeType) &&
    app.sourceStatus === "READY"
  );
  const hasExternalUrl = Boolean(app?.runtimeUrl && app.runtimeUrl.trim().length > 0);
  const hasBoth = hasStaticZip && hasExternalUrl;

  const activeRuntime = selectedRuntime || (
    hasStaticZip ? "STATIC_ZIP" : hasExternalUrl ? "EXTERNAL_URL" : "STATIC_ZIP"
  );
  const isStaticZip = activeRuntime === "STATIC_ZIP";
  const sandboxSrc = isStaticZip
    ? `/api/sandbox/${app.slug}`
    : (app.runtimeUrl || "");

  if (!sandboxSrc) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold">Runtime Sandbox Unavailable</h2>
        <p className="text-xs text-neutral-400 mt-1 mb-6 max-w-sm">
          This application does not have an active static web package or a runtime URL configured.
        </p>
        <div className="flex items-center gap-3">
          <Link href={`/apps/${slug}`}>
            <Button size="sm" variant="outline">
              Application Details
            </Button>
          </Link>
          {app.sourceStatus === "READY" && (
            <Link href={`/apps/${slug}/source`}>
              <Button size="sm" variant="primary">
                Browse Source Code
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen bg-neutral-950 text-white overflow-hidden select-none"
    >
      {/* Top Runtime Sandbox Header */}
      <header className="h-14 px-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0 z-20">
        {/* Left: Navigation & App Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/apps/${slug}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Exit Runtime Sandbox"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit</span>
          </Link>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2.5 min-w-0">
            {app.thumbnailUrl && (
              <img
                src={app.thumbnailUrl}
                alt={app.name}
                className="w-7 h-7 rounded-md object-cover border border-neutral-700/60 shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {app.name}
                </h1>
                {!hasBoth && (
                  isStaticZip ? (
                    <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-3 h-3" /> Static App
                    </span>
                  ) : (
                    <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      <Globe className="w-3 h-3" /> Live Embed
                    </span>
                  )
                )}
              </div>
              <p className="text-[11px] text-neutral-400 truncate hidden sm:block">
                by @{app.ownerUsername}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Dual Runtime Switcher */}
        {hasBoth && (
          <div className="flex items-center p-0.5 sm:p-1 bg-neutral-950 border border-neutral-800 rounded-xl shadow-inner gap-0.5">
            <button
              type="button"
              onClick={() => {
                if (activeRuntime !== "STATIC_ZIP") {
                  setSelectedRuntime("STATIC_ZIP");
                  setIframeLoading(true);
                  setIframeKey((prev) => prev + 1);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isStaticZip
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950 scale-[1.02]"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
              title={`Run self-hosted package from source archive (${app.entrypointPath || "index.html"})`}
            >
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>Static</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeRuntime !== "EXTERNAL_URL") {
                  setSelectedRuntime("EXTERNAL_URL");
                  setIframeLoading(true);
                  setIframeKey((prev) => prev + 1);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isStaticZip
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950 scale-[1.02]"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
              title={`Run framed external live web app (${app.runtimeUrl})`}
            >
              <Globe className="w-3 h-3 text-blue-300" />
              <span>Live URL</span>
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {app.sourceStatus === "READY" && (
            <Link
              href={`/apps/${slug}/source`}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Inspect source code"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Source</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleReload}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Restart / Reload application"
          >
            <RotateCw className={`w-4 h-4 ${iframeLoading ? "animate-spin text-brand-400" : ""}`} />
          </button>

          <a
            href={sandboxSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Open standalone in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Runtime Sandbox Stage (auto-detects device and fits natively) */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-0 bg-neutral-950">
        {/* Loading overlay */}
        {iframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm pointer-events-none">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-2" />
            <p className="text-xs text-neutral-400">Loading {app.name} in Runtime Sandbox...</p>
          </div>
        )}

        {/* Viewport Frame: auto-fits full canvas */}
        <div className="w-full h-full relative flex flex-col">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={sandboxSrc}
            title={app.name}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-forms allow-same-origin allow-downloads allow-popups allow-modals allow-pointer-lock"
            allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; fullscreen; gamepad; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
            onLoad={() => setIframeLoading(false)}
          />
        </div>
      </main>
    </div>
  );
}
