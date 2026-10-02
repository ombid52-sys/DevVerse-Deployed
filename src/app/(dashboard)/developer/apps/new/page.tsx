"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Globe,
  Play,
  Layers,
  X,
  Image as ImageIcon,
  Check,
  Info,
  RefreshCw,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";
import { generateSlug } from "@/lib/validations/application";
import { formatBytes, formatVisibility, formatCategory, formatPlatform } from "@/lib/utils";
import { inspectClientZip, ClientZipInspection } from "@/lib/source/client-zip";

export default function NewApplicationPage() {
  const router = useRouter();

  // Basic Information
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [platform, setPlatform] = useState(PLATFORMS[0].value);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [description, setDescription] = useState("");

  // Media URLs
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [heroBannerUrl, setHeroBannerUrl] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([""]);

  // Source Archive & Runtime Settings
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zipInspection, setZipInspection] = useState<ClientZipInspection | null>(null);
  const [inspectingZip, setInspectingZip] = useState(false);
  const [webRuntimeUrl, setWebRuntimeUrl] = useState("");
  const [runtimeSandbox, setRuntimeSandbox] = useState(false);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // Form Submission State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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

  // Inspect ZIP file when chosen or dropped
  const processZipFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Only ZIP archives (.zip) are supported for project packages.");
      return;
    }

    setZipFile(file);
    setError(null);
    setInspectingZip(true);

    try {
      const inspection = await inspectClientZip(file);
      setZipInspection(inspection);

      // Automatically manage Runtime Sandbox:
      // If it is a static web app with index.html, automatically toggle Runtime Sandbox ON
      if (inspection.hasStaticApp) {
        setRuntimeSandbox(true);
      } else {
        setRuntimeSandbox(false);
      }
    } catch (err: any) {
      console.error("[Client Zip Inspection Error]", err);
      setZipInspection(null);
      setRuntimeSandbox(false);
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
    setRuntimeSandbox(false);
  };

  const isStaticApp = Boolean(zipInspection?.hasStaticApp);
  const hasExternalUrl = Boolean(webRuntimeUrl.trim().length > 0);
  const hasBoth = isStaticApp && runtimeSandbox && hasExternalUrl;

  // Pre-flight validation checks
  const isNameValid = name.trim().length >= 2;
  const isSlugValid = slug.trim().length >= 2 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
  const isDescriptionValid = description.trim().length >= 10;
  const isThumbnailValid = thumbnailUrl.trim().length > 0 && /^https?:\/\//i.test(thumbnailUrl.trim());
  const isReadyToPublish = isNameValid && isSlugValid && isDescriptionValid && isThumbnailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStatusMessage("Creating application profile...");

    const filteredScreenshots = screenshots.map((s) => s.trim()).filter(Boolean);

    // Compute runnable flag and runtimeType
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
      ? (zipInspection?.entrypointPath || "index.html")
      : null;

    try {
      // 1. Create the application metadata
      const res = await fetch("/api/applications", {
        method: "POST",
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
        setError(data.error || "Failed to create application");
        setLoading(false);
        return;
      }

      const appId = data.application._id || data.application.id;
      const appSlug = data.application.slug;

      // 2. If a source ZIP archive was provided, upload it directly
      if (zipFile) {
        setStatusMessage(`Uploading and processing source archive (${formatBytes(zipFile.size)})...`);
        const formData = new FormData();
        formData.append("file", zipFile);

        const sourceRes = await fetch(`/api/applications/${appId}/source`, {
          method: "POST",
          body: formData,
        });

        if (!sourceRes.ok) {
          const sourceData = await sourceRes.json();
          setError(
            `Application registered, but source archive upload failed: ${sourceData.error || "Unknown error"
            }. You can upload it from the source manager.`
          );
          setLoading(false);
          router.push(`/developer/apps/${appId}/source`);
          return;
        }
      }

      setStatusMessage("Publishing complete! Redirecting to application...");
      router.push(`/apps/${appSlug}`);
    } catch {
      setError("An unexpected network error occurred while publishing.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-3 pb-6 border-b border-neutral-200">
        <Link
          href="/developer/apps"
          className="text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Publish Application
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
            Showcase your project to developers and visitors. Configure identity, media, source archive, and interactive runtime execution in one flow.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 font-medium flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout (Form on Left, Real-Time Sticky Preview on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-8">
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
                autoFocus
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

                {/* Compact, stylized slug input box */}
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

            {/* Target Platform & Category in Balanced Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Select
                label="Target Platform *"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
              />

              <Select
                label="Category *"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
              />
            </div>

            {/* Description with Character Counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-800">
                  Description *
                </label>
                <span className={`text-[11px] font-mono ${description.length < 10 ? "text-amber-600" : "text-neutral-400"}`}>
                  {description.length} / 2000 {description.length < 10 && "(Min. 10)"}
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a comprehensive summary of features, architecture, and usage instructions..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 placeholder:text-neutral-400 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* SECTION 2: Media & Showcase Assets */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7 space-y-6">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-600" />
                Media & Showcase
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Artwork and screenshots that will represent your application in the storefront
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
                        placeholder={`Screenshot image URL #${idx + 1}`}
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

          {/* SECTION 3: Source Package & Interactive Runtime */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7 space-y-6">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-brand-600" />
                Package Source & Runtime Execution
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Attach your source archive and specify how your application runs in Runtime Sandbox
              </p>
            </div>

            {/* Upload Source ZIP Archive Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-800">
                Upload Source ZIP Archive
              </label>

              {!zipFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging
                    ? "border-brand-500 bg-brand-50/40 scale-[1.01]"
                    : "border-neutral-300 hover:border-brand-400 bg-neutral-50/60 hover:bg-brand-50/20"
                    }`}
                >
                  <label className="cursor-pointer flex flex-col items-center w-full">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-brand-600 mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-neutral-900">
                      Click to Choose or Drag Source ZIP-Archive
                    </span>
                    <span className="text-xs text-neutral-500 mt-1 max-w-sm">
                      Standard ZIP package up to 100MB.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100/70 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0">
                        <FileArchive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                          <span>{zipFile.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-200 text-neutral-700">
                            {formatBytes(zipFile.size)}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-0.5 block">
                          {inspectingZip
                            ? "Analyzing archive contents..."
                            : `${zipInspection?.fileCount || 0} files indexed`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveZip}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                      title="Remove archive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Inspection Feedback Card */}
                  {!inspectingZip && zipInspection && (
                    <div>
                      {zipInspection.hasStaticApp ? (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-900 block">
                              Static Web Application Verified
                            </span>
                            <span className="text-[11px] text-emerald-700 mt-0.5 block">
                              Detected entrypoint: <code className="px-2 py-0.5 bg-emerald-100 rounded-full text-[11px] font-mono font-bold text-emerald-900">{zipInspection.entrypointPath}</code>. Ready to run client-side in Runtime Sandbox.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-sky-50/80 border border-sky-200/70 text-sky-950 text-xs flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-sky-900 block">
                              Non-Static Application
                            </span>
                            <span className="text-[11px] text-sky-800/90 mt-0.5 block">
                              This Application requires a Backend Server or Native OS Runtime. Runtime Sandbox cannot execute this code. Provide an external Runtime URL to connect your live deployment.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
                The URL on which your app is accessible.
              </p>
            </div>

            {/* Runtime Sandbox Toggle (Only ON/OFF, enabled only if static web app) */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-3">
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
              {!zipFile && (
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 italic">
                  <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>
                    Upload a source ZIP archive containing an <code className="text-neutral-700 font-mono font-medium">index.html</code> to enable Runtime Sandbox.
                  </span>
                </div>
              )}

              {zipFile && !isStaticApp && (
                <div className="text-[11px] text-sky-800 bg-sky-50/80 p-2.5 rounded-lg border border-sky-200/70 font-medium flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    Runtime Sandbox disabled: This archive does not contain an <code className="font-mono font-bold">index.html</code>. It can only be toggled on if the app is a client-side static web app that does not require a server to run.
                  </span>
                </div>
              )}

              {isStaticApp && runtimeSandbox && (
                <div className="pt-2.5 border-t border-neutral-200/80 space-y-2">
                  <p className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Automatically managed: runs <code className="font-mono font-bold">{zipInspection?.entrypointPath}</code> in Runtime Sandbox.
                    </span>
                  </p>

                  {hasExternalUrl && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>Dual Runtime Active:</strong> Visitors in Runtime Sandbox can toggle and run either your <strong>Live Web URL</strong> or the uploaded <strong>Static index.html</strong>!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Publishing Visibility */}
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

          {/* Submission Bar */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-500">
              {statusMessage ? (
                <span className="text-brand-600 font-semibold flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  {statusMessage}
                </span>
              ) : visibility === "PUBLIC" ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Application will be published publicly to the Explore catalog.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  Application will be saved as Private.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/developer/apps" className="w-full sm:w-auto">
                <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                size="sm"
                isLoading={loading}
                disabled={!isReadyToPublish}
                className="w-full sm:w-auto min-w-[160px] shadow-sm shadow-brand-500/20"
              >
                {visibility === "PUBLIC" ? "Publish Application" : "Publish as Private"}
              </Button>
            </div>
          </div>
        </form>

        {/* Right Sticky Column: Real-Time Live Preview & Pre-Flight Checklist */}
        <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-20">
          {/* Card Preview (No Heading on Container) */}
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

          {/* Publishing Checklist */}
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
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${zipFile || hasExternalUrl ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}>
                  {zipFile || hasExternalUrl ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : "5"}
                </div>
                <span className={zipFile || hasExternalUrl ? "text-neutral-800 font-medium" : "text-neutral-400"}>
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
