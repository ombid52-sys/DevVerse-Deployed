"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Globe,
  Layers,
  FileArchive,
  ExternalLink,
  Sparkles,
  Info,
  Lock,
  RefreshCw,
  Image as ImageIcon,
  Check,
  FolderTree,
  Upload,
  FileCode,
  Settings,
  X,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { LanguageBar } from "@/components/apps/LanguageBar";
import { PLATFORMS, CATEGORIES, SOURCE_LIMITS } from "@/lib/constants";
import { generateSlug } from "@/lib/validations/application";
import { Application } from "@/types";
import { formatBytes, formatVisibility, formatCategory, formatPlatform } from "@/lib/utils";
import { inspectClientZip, ClientZipInspection } from "@/lib/source/client-zip";

function EditApplicationContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"general" | "source">("general");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "source") {
      setActiveTab("source");
    } else if (tabParam === "general") {
      setActiveTab("general");
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [app, setApp] = useState<Application | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(true);
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<any>(PLATFORMS[0].value);
  const [category, setCategory] = useState<any>(CATEGORIES[0].value);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [heroBannerUrl, setHeroBannerUrl] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([""]);

  // Runtime & Sandbox
  const [webRuntimeUrl, setWebRuntimeUrl] = useState("");
  const [runtimeSandbox, setRuntimeSandbox] = useState(false);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // Source Archive Upload & Client Inspection
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zipInspection, setZipInspection] = useState<ClientZipInspection | null>(null);
  const [inspectingZip, setInspectingZip] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const loadApp = async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (res.ok) {
        const data = await res.json();
        const a: Application = data.application;
        setApp(a);
        setName(a.name);
        setSlug(a.slug);
        setDescription(a.description);
        setPlatform(a.platform);
        setCategory(a.category);
        setThumbnailUrl(a.thumbnailUrl);
        setHeroBannerUrl(a.heroBannerUrl || "");
        setScreenshots(a.screenshots?.length > 0 ? a.screenshots : [""]);
        setWebRuntimeUrl(a.runtimeUrl || "");
        setVisibility(a.visibility);

        const isStatic = Boolean(a.sourceStatus === "READY" && a.entrypointPath);
        const hasStaticZipRunning = Boolean(
          a.isRunnable && (a.runtimeType === "STATIC_ZIP" || a.runtimeType === "BOTH")
        );
        setRuntimeSandbox(isStatic && hasStaticZipRunning);
      } else {
        setError("Failed to load application details.");
      }
    } catch {
      setError("Network error loading application.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApp();
  }, [id]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugReset = () => {
    setIsSlugManual(false);
    setSlug(generateSlug(name));
  };

  const canAddScreenshot =
    screenshots.length < 8 &&
    (screenshots.length === 0 || screenshots[screenshots.length - 1].trim().length > 0);

  const handleAddScreenshotField = () => {
    if (canAddScreenshot) {
      setScreenshots([...screenshots, ""]);
    }
  };

  const handleScreenshotChange = (index: number, val: string) => {
    const updated = [...screenshots];
    updated[index] = val;
    setScreenshots(updated);
  };

  const handleRemoveScreenshotField = (index: number) => {
    const updated = screenshots.filter((_, i) => i !== index);
    setScreenshots(updated.length > 0 ? updated : [""]);
  };

  // Inspect ZIP file when chosen or dropped in the source tab
  const processZipFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Only ZIP archives (.zip) are supported for project packages.");
      return;
    }
    if (file.size > SOURCE_LIMITS.MAX_ZIP_SIZE_BYTES) {
      setError(`File size exceeds ${SOURCE_LIMITS.MAX_ZIP_SIZE_BYTES / (1024 * 1024)}MB limit.`);
      return;
    }

    setZipFile(file);
    setError(null);
    setInspectingZip(true);

    try {
      const inspection = await inspectClientZip(file);
      setZipInspection(inspection);

      if (inspection.hasStaticApp) {
        setRuntimeSandbox(true);
      }
    } catch (err: any) {
      console.error("[Client Zip Inspection Error]", err);
      setZipInspection(null);
    } finally {
      setInspectingZip(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processZipFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processZipFile(file);
  };

  const handleRemoveZip = () => {
    setZipFile(null);
    setZipInspection(null);
  };

  const handleUploadZip = async () => {
    if (!zipFile) return;

    setUploadingZip(true);
    setError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", zipFile);

    try {
      const res = await fetch(`/api/applications/${id}/source`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process source archive");
      } else {
        setUploadSuccess(`Source archive (${formatBytes(zipFile.size)}) successfully uploaded, verified, and indexed!`);
        setZipFile(null);
        setZipInspection(null);
        loadApp();
        setTimeout(() => setUploadSuccess(null), 4000);
      }
    } catch {
      setError("An unexpected network error occurred during upload.");
    } finally {
      setUploadingZip(false);
    }
  };

  const isStaticApp = Boolean(
    (app?.sourceStatus === "READY" && app?.entrypointPath) ||
    zipInspection?.hasStaticApp
  );
  const hasExternalUrl = Boolean(webRuntimeUrl.trim().length > 0);
  const hasBoth = isStaticApp && runtimeSandbox && hasExternalUrl;

  // Pre-flight validation checks
  const isNameValid = name.trim().length >= 2;
  const isSlugValid = slug.trim().length >= 2 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
  const isDescriptionValid = description.trim().length >= 10;
  const isThumbnailValid = thumbnailUrl.trim().length > 0 && /^https?:\/\//i.test(thumbnailUrl.trim());
  const isReadyToSave = isNameValid && isSlugValid && isDescriptionValid && isThumbnailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const filteredScreenshots = screenshots.map((s) => s.trim()).filter(Boolean);

    const isRunnable = (isStaticApp && runtimeSandbox) || hasExternalUrl;
    const runtimeType =
      isStaticApp && runtimeSandbox && hasExternalUrl
        ? "BOTH"
        : isStaticApp && runtimeSandbox
          ? "STATIC_ZIP"
          : hasExternalUrl
            ? "EXTERNAL_URL"
            : null;

    const entrypoint = isStaticApp && runtimeSandbox
      ? (zipInspection?.entrypointPath || app?.entrypointPath || "index.html")
      : null;

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
          platform,
          category,
          thumbnailUrl: thumbnailUrl.trim(),
          heroBannerUrl: heroBannerUrl.trim() || undefined,
          runtimeUrl: webRuntimeUrl.trim() || undefined,
          isRunnable,
          runtimeType,
          entrypointPath: entrypoint,
          visibility,
          screenshots: filteredScreenshots,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update application");
      } else {
        setSuccess(true);
        if (data.application) {
          setApp(data.application);
        }
        setTimeout(() => setSuccess(false), 3500);
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 font-medium">Loading application configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-3 pb-6 border-b border-neutral-200">
        <Link
          href={`/apps/${slug || id}`}
          className="text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Application Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Edit Application
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
              Unified control center to manage metadata, visual assets, source code archives, and Runtime Sandbox execution.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href={`/apps/${slug || id}`}>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> View Application
              </Button>
            </Link>
            {app?.sourceStatus === "READY" && (
              <Link href={`/apps/${slug || id}/source`}>
                <Button type="button" variant="outline" size="sm" className="flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-brand-600" /> Open Source Browser
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 font-medium flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Application changes have been successfully saved!</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200/80 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "general"
              ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/60"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          General & Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("source")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "source"
              ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/60"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Source Archive & Code
          {app?.sourceStatus === "READY" && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Main Two-Column Layout (Form on Left, Real-Time Sticky Preview on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-8">
          {activeTab === "general" ? (
            <>
              {/* SECTION 1: Identity & Categorization */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="border-b border-neutral-100 pb-3">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    Application Identity
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Core naming and categorization details that appear in search and discovery
                  </p>
                </div>

                {/* Application Name & Compact URL Slug Row */}
                <div className="space-y-4">
                  <Input
                    label="Application Name *"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Quantum Ray Tracer or HyperSpace OS"
                    helperText="A clear, distinctive name for your software"
                  />

                  {/* Compact URL Slug Bar with Integrated Domain Prefix */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-neutral-800">
                        URL Slug *
                      </label>
                      <div className="flex items-center gap-2">
                        {isSlugManual && (
                          <button
                            type="button"
                            onClick={handleSlugReset}
                            className="text-[11px] text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium transition-colors"
                            title="Re-sync automatically from application name"
                          >
                            <RefreshCw className="w-3 h-3" /> Auto-sync
                          </button>
                        )}
                        <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                          /apps/{slug || "slug"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center rounded-lg border border-neutral-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 bg-white overflow-hidden transition-all max-w-lg shadow-sm">
                      <span className="inline-flex items-center pl-3 pr-0.5 text-xs text-neutral-400 select-none font-mono font-medium whitespace-nowrap">
                        devverse.org/apps/
                      </span>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => {
                          setIsSlugManual(true);
                          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                        }}
                        placeholder="quantum-ray-tracer"
                        className="flex-1 min-w-0 pl-0.5 pr-3 py-2 text-xs bg-transparent text-neutral-900 font-mono focus:outline-none placeholder:text-neutral-400 font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Clean, URL-friendly unique identifier. Automatically formatted as lowercase letters and hyphens.
                    </p>
                  </div>
                </div>

                {/* Target Platform & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <Select
                    label="Target Platform *"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
                  />

                  <Select
                    label="Primary Category *"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-800">
                      Description *
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        description.length < 10
                          ? "text-amber-600 font-semibold"
                          : "text-neutral-400"
                      }`}
                    >
                      {description.length} / 2000 {description.length < 10 && "(min. 10 chars)"}
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    placeholder="A Comprehensive Summary of Features, Architecture, and Usage Instructions..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 transition-all shadow-sm leading-relaxed"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Detailed description displayed on your application overview page.
                  </p>
                </div>
              </div>

              {/* SECTION 2: Media & Visual Assets */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="border-b border-neutral-100 pb-3">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Media & Visual Assets
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    High-quality promotional imagery that powers your application showcase card and overview page
                  </p>
                </div>

                {/* Thumbnail URL */}
                <Input
                  label="Thumbnail Image URL *"
                  type="url"
                  required
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/thumbnail.png"
                  helperText="Image URL (JPG, PNG, WebP). 1:1 aspect ratio."
                />

                {/* Hero Banner URL with Side Preview when entered */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3.5">
                  <div className="flex-1 w-full">
                    <Input
                      label="Hero Banner Image URL"
                      type="url"
                      value={heroBannerUrl}
                      onChange={(e) => setHeroBannerUrl(e.target.value)}
                      placeholder="https://example.com/hero-banner.jpg"
                      helperText="Showcase banner displayed across the top of your application overview page"
                    />
                  </div>

                  {heroBannerUrl.trim().length > 0 && (
                    <div className="shrink-0 space-y-1 pb-1 animate-fadeIn">
                      <span className="text-xs font-semibold text-neutral-700 block">
                        Preview
                      </span>
                      <div className="w-28 sm:w-36 h-20 sm:h-24 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-900 shadow-sm relative">
                        <img
                          src={heroBannerUrl.trim()}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Screenshots Gallery with Side Previews when entered */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-800">
                      Screenshots Gallery
                    </label>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {screenshots.filter((s) => s.trim().length > 0).length} / 8 added
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-3.5">
                    {/* Left Column: All URL Inputs & Add Slot Button */}
                    <div className="flex-1 w-full space-y-2">
                      {screenshots.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="url"
                            value={s}
                            onChange={(e) => handleScreenshotChange(idx, e.target.value)}
                            placeholder={`Screenshot URL #${idx + 1}`}
                            className="flex-1 px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 transition-all shadow-sm"
                          />
                          {screenshots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveScreenshotField(idx)}
                              className="p-2 text-neutral-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-200 hover:bg-red-50"
                              title="Remove field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {screenshots.length < 8 && (
                        <div className="flex items-center gap-2.5 pt-0.5">
                          <button
                            type="button"
                            disabled={!canAddScreenshot}
                            onClick={handleAddScreenshotField}
                            title={
                              !canAddScreenshot
                                ? "Fill the previous screenshot URL to add another slot"
                                : "Add another screenshot slot"
                            }
                            className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                              canAddScreenshot
                                ? "text-brand-600 hover:text-brand-700 border-brand-200/80 bg-brand-50/50 hover:bg-brand-50 cursor-pointer shadow-xs active:scale-[0.98]"
                                : "text-neutral-400 border-neutral-200 bg-neutral-100/70 cursor-not-allowed opacity-60"
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" /> Add screenshot slot
                          </button>
                          {!canAddScreenshot && (
                            <span className="text-[11px] text-neutral-400">
                              Fill the previous slot to add another
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Previews in Landscape matching Hero Banner */}
                    {screenshots.some((s) => s.trim().length > 0) && (
                      <div className="shrink-0 space-y-1 animate-fadeIn">
                        <span className="text-xs font-semibold text-neutral-700 block">
                          Preview
                        </span>
                        <div className="flex flex-col gap-2">
                          {screenshots
                            .filter((s) => s.trim().length > 0)
                            .map((s, pIdx) => (
                              <div
                                key={pIdx}
                                className="w-28 sm:w-36 h-20 sm:h-24 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-900 shadow-sm relative group"
                              >
                                <img
                                  src={s.trim()}
                                  alt={`Screenshot Preview #${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as any).style.display = "none";
                                  }}
                                />
                                {screenshots.filter((s) => s.trim().length > 0).length > 1 && (
                                  <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/60 text-white px-1 py-0.5 rounded backdrop-blur-xs">
                                    #{pIdx + 1}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Publishing Visibility */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7 space-y-4">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-brand-600" />
                      Publishing Visibility
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Choose whether your application is publicly discoverable or kept private
                    </p>
                  </div>
                  <Badge variant={visibility === "PUBLIC" ? "success" : "danger"} size="sm">
                    {visibility === "PRIVATE" ? (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    ) : (
                      "Public"
                    )}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div
                    onClick={() => setVisibility("PUBLIC")}
                    className={`relative flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      visibility === "PUBLIC"
                        ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white hover:bg-neutral-50/80 border-neutral-200 text-neutral-600"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        visibility === "PUBLIC"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900">Public Application</span>
                        <input
                          type="radio"
                          name="visibility"
                          checked={visibility === "PUBLIC"}
                          onChange={() => setVisibility("PUBLIC")}
                          className="accent-brand-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        Listed in the Explore catalog, visible in global search, and accessible to everyone on DevVerse.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setVisibility("PRIVATE")}
                    className={`relative flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      visibility === "PRIVATE"
                        ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
                        : "bg-white hover:bg-neutral-50/80 border-neutral-200 text-neutral-600"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        visibility === "PRIVATE"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900">Private Application</span>
                        <input
                          type="radio"
                          name="visibility"
                          checked={visibility === "PRIVATE"}
                          onChange={() => setVisibility("PRIVATE")}
                          className="accent-brand-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        Unlisted across Explore catalog and search. Only you and users with the direct link can access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* SOURCE TAB: Active Repository Statistics */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Active Source Code Repository
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Status and inspection breakdown of your application codebase
                    </p>
                  </div>
                  {app?.sourceStatus === "READY" ? (
                    <Badge variant="success" size="sm">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Pending Archive
                    </Badge>
                  )}
                </div>

                {app?.sourceStatus === "READY" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
                        <p className="text-neutral-500 text-[11px] font-medium">Total Files Extracted</p>
                        <p className="text-lg font-bold text-neutral-900 mt-0.5">
                          {app.sourceFileCount}
                        </p>
                      </div>

                      <div className="p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
                        <p className="text-neutral-500 text-[11px] font-medium">Archive Buffer Size</p>
                        <p className="text-lg font-bold text-neutral-900 mt-0.5">
                          {formatBytes(app.sourceArchiveSize || 0)}
                        </p>
                      </div>

                      <div className="p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
                        <p className="text-neutral-500 text-[11px] font-medium">Languages Detected</p>
                        <p className="text-lg font-bold text-neutral-900 mt-0.5">
                          {app.languages?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Language Distribution */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-neutral-800">
                        Detected Source Breakdown
                      </h4>
                      <LanguageBar languages={app.languages} />
                    </div>

                    <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <span className="text-neutral-500 text-[11px]">
                        Persistent cloud storage backed by B2 Storage
                      </span>
                      <div className="flex items-center gap-3">
                        <a
                          href={`/api/applications/${app.slug}/source`}
                          download
                          className="text-brand-600 font-semibold hover:underline inline-flex items-center gap-1.5 text-xs"
                        >
                          <Download className="w-3.5 h-3.5" /> Download active ZIP
                        </a>
                        <Link href={`/apps/${app.slug}/source`}>
                          <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                            <FolderTree className="w-3.5 h-3.5 text-brand-600" /> Browse Files
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-neutral-200 rounded-xl space-y-2 bg-neutral-50/50">
                    <FileArchive className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-xs font-semibold text-neutral-800">No source archive uploaded yet</p>
                    <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                      Upload a ZIP package below to enable automatic language breakdown, file browsing, and Runtime Sandbox execution.
                    </p>
                  </div>
                )}
              </div>

              {/* SOURCE TAB: Upload / Replace Archive */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="border-b border-neutral-100 pb-3">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    {app?.sourceStatus === "READY" ? "Replace Source Code Archive" : "Upload Source Code Archive"}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Upload a clean ZIP archive of your project repository (max {SOURCE_LIMITS.MAX_ZIP_SIZE_BYTES / (1024 * 1024)}MB)
                  </p>
                </div>

                {!zipFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDragging
                        ? "border-brand-500 bg-brand-50/30 scale-[1.005]"
                        : "border-neutral-300 hover:border-brand-400 hover:bg-neutral-50/50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-neutral-800">
                        Drag and drop your project ZIP archive here, or{" "}
                        <label className="text-brand-600 hover:underline cursor-pointer">
                          browse files
                          <input
                            type="file"
                            accept=".zip"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Supports ZIP packages up to {SOURCE_LIMITS.MAX_ZIP_SIZE_BYTES / (1024 * 1024)}MB. Automatically extracts files, detects entrypoints, and classifies languages.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                          <FileArchive className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {zipFile.name}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {formatBytes(zipFile.size)}
                            {inspectingZip && " • Inspecting archive..."}
                            {!inspectingZip && zipInspection && ` • ${zipInspection.fileCount} files indexed`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleRemoveZip}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Pre-upload Client Inspection Summary */}
                    {zipInspection && (
                      <div className="p-3 bg-white rounded-lg border border-neutral-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-800">Archive Inspection:</span>
                          {zipInspection.hasStaticApp ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Static Web App Detected
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                              Native / Non-Web Project
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          {zipInspection.hasStaticApp
                            ? `Primary entrypoint: ${zipInspection.entrypointPath}. Runtime Sandbox enabled automatically.`
                            : "No index.html detected in archive root. Uploadable as source repository."}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200/80">
                      <Button
                        type="button"
                        size="sm"
                        isLoading={uploadingZip}
                        onClick={handleUploadZip}
                        className="min-w-[160px] shadow-sm shadow-brand-500/20"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload & Verify Archive
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* SOURCE TAB: Web Runtime URL & Runtime Sandbox Execution */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="border-b border-neutral-100 pb-3">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Web Runtime URL & Runtime Sandbox
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Configure live web endpoints and interactive Runtime Sandbox execution
                  </p>
                </div>

                {/* Web Runtime URL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-800">
                    Web Runtime URL
                  </label>
                  <div className="flex items-center rounded-lg border border-neutral-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 bg-white overflow-hidden transition-all shadow-sm">
                    <span className="inline-flex items-center pl-3 pr-0.5 text-xs text-neutral-400 select-none font-mono font-medium whitespace-nowrap">
                      https://
                    </span>
                    <input
                      type="text"
                      value={webRuntimeUrl.replace(/^https?:\/\//i, "")}
                      onChange={(e) => {
                        const clean = e.target.value.trim().replace(/^https?:\/\//i, "");
                        setWebRuntimeUrl(clean ? `https://${clean}` : "");
                      }}
                      placeholder="myapp.vercel.app"
                      className="flex-1 min-w-0 pl-0.5 pr-3 py-2 text-xs bg-transparent text-neutral-900 font-mono focus:outline-none placeholder:text-neutral-400 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    The external web URL on which your app is deployed and accessible.
                  </p>
                </div>

                {/* Runtime Sandbox Toggle (only on/off, enabled ONLY if static web app) */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-brand-600 fill-current" />
                        <span className="text-xs font-bold text-neutral-900">
                          Runtime Sandbox
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Enables visitors to run your application directly in Runtime Sandbox.
                      </p>
                    </div>

                    {/* Modern Switch Toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={runtimeSandbox && isStaticApp}
                      disabled={!isStaticApp}
                      onClick={() => {
                        if (isStaticApp) {
                          setRuntimeSandbox(!runtimeSandbox);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${runtimeSandbox && isStaticApp
                        ? "bg-emerald-600 shadow-sm shadow-emerald-500/30"
                        : isStaticApp
                          ? "bg-neutral-300 hover:bg-neutral-400"
                          : "bg-neutral-200 cursor-not-allowed opacity-60"
                        }`}
                      title={
                        !isStaticApp
                          ? "Runtime Sandbox can only be toggled on if your app is a static web app with index.html."
                          : runtimeSandbox
                            ? "Click to disable Runtime Sandbox"
                            : "Click to enable Runtime Sandbox"
                      }
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${runtimeSandbox && isStaticApp ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>

                  {/* Explanatory helper state */}
                  {!isStaticApp && (
                    <div className="text-[11px] text-sky-800 bg-sky-50/80 p-2.5 rounded-lg border border-sky-200/70 font-medium flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>
                        Runtime Sandbox disabled: The uploaded archive does not contain an <code className="font-mono font-bold">index.html</code>. It can only be toggled on if the app is a client-side static web app that does not require a server to run.
                      </span>
                    </div>
                  )}

                  {isStaticApp && runtimeSandbox && (
                    <div className="pt-2.5 border-t border-neutral-200/80 space-y-2">
                      <p className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Automatically managed: runs <code className="font-mono font-bold">{zipInspection?.entrypointPath || app?.entrypointPath}</code> in Runtime Sandbox.
                        </span>
                      </p>

                      {hasExternalUrl && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            <strong>Dual Runtime Active:</strong> Visitors in Runtime Sandbox can toggle and run either your <strong>Live Web URL</strong> or the uploaded <strong>Static index.html</strong>!
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Submission Bar */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-500">
              {success ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Application updated successfully!
                </span>
              ) : visibility === "PUBLIC" ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Application will be updated publicly in the Explore catalog.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  Application will be saved as Private.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href={`/apps/${slug || id}`} className="w-full sm:w-auto">
                <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                size="sm"
                isLoading={saving}
                disabled={!isReadyToSave}
                className="w-full sm:w-auto min-w-[150px] shadow-sm shadow-brand-500/20"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>

        {/* Right Sticky Column: Real-Time Live Preview & Pre-Flight Checklist */}
        <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-20">
          {/* Card Preview */}
          <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Thumbnail Display */}
            <div className="h-36 bg-gradient-to-br from-neutral-800 to-neutral-950 relative overflow-hidden flex items-center justify-center">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={name || "Preview"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).style.display = "none";
                  }}
                />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-8 h-8 text-neutral-600 mx-auto mb-1.5 opacity-60" />
                  <span className="text-[11px] text-neutral-400 font-medium">Thumbnail</span>
                </div>
              )}
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900/80 backdrop-blur-md text-white border border-white/10 shadow-sm">
                  {PLATFORMS.find((p) => p.value === platform)?.label || formatPlatform(platform)}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-neutral-900 truncate">
                  {name || "Application Name"}
                </h4>
                <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full shrink-0">
                  {formatCategory(category)}
                </span>
              </div>

              <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                {description || "A Comprehensive Summary of Features, Architecture, and Usage Instructions..."}
              </p>

              <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-neutral-400 truncate max-w-[140px]">
                  /apps/{slug || "slug"}
                </span>

                {hasBoth ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Dual Play
                  </span>
                ) : isStaticApp && runtimeSandbox ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Runtime Sandbox
                  </span>
                ) : hasExternalUrl ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Live Embed
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Application Checklist */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isNameValid ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}>
                  {isNameValid ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : "1"}
                </div>
                <span className={isNameValid ? "text-neutral-800 font-medium" : "text-neutral-400"}>
                  Application Name
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isSlugValid ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}>
                  {isSlugValid ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : "2"}
                </div>
                <span className={isSlugValid ? "text-neutral-800 font-medium" : "text-neutral-400"}>
                  URL Slug
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isDescriptionValid ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}>
                  {isDescriptionValid ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : "3"}
                </div>
                <span className={isDescriptionValid ? "text-neutral-800 font-medium" : "text-neutral-400"}>
                  Description
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isThumbnailValid ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}>
                  {isThumbnailValid ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : "4"}
                </div>
                <span className={isThumbnailValid ? "text-neutral-800 font-medium" : "text-neutral-400"}>
                  Thumbnail
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${app?.sourceStatus === "READY" || hasExternalUrl ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}>
                  {app?.sourceStatus === "READY" || hasExternalUrl ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : "5"}
                </div>
                <span className={app?.sourceStatus === "READY" || hasExternalUrl ? "text-neutral-800 font-medium" : "text-neutral-400"}>
                  Source Package or Web URL
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-emerald-100 text-emerald-700">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-neutral-700 font-medium flex items-center gap-1.5">
                  Visibility:
                  <Badge variant={visibility === "PUBLIC" ? "success" : "danger"} size="sm">
                    {formatVisibility(visibility)}
                  </Badge>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Loading application editor...</p>
        </div>
      }
    >
      <EditApplicationContent id={id} />
    </Suspense>
  );
}
