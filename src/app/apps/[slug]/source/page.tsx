"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FolderTree,
  Code2,
  FileText,
  Lock,
} from "lucide-react";
import { Application, SourceTreeNode } from "@/types";
import { Breadcrumbs } from "@/components/source/Breadcrumbs";
import { SourceFileTree } from "@/components/source/SourceFileTree";
import { SourceCodeViewer } from "@/components/source/SourceCodeViewer";
import { LanguageBar } from "@/components/apps/LanguageBar";
import { Button } from "@/components/ui/Button";

export default function SourceBrowserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [isBinary, setIsBinary] = useState<boolean>(false);
  const [loadingFile, setLoadingFile] = useState(false);

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
          setApp(data.application);

          // Find first file in tree to select automatically
          if (data.application.sourceTree) {
            const firstFile = findFirstFile(data.application.sourceTree);
            if (firstFile) {
              setSelectedFilePath(firstFile.path);
            }
          }
        }
      } catch {
        setError("ERROR");
      } finally {
        setLoadingApp(false);
      }
    }
    loadApp();
  }, [slug]);

  function findFirstFile(nodes: SourceTreeNode[]): SourceTreeNode | null {
    for (const node of nodes) {
      if (node.type === "file") return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  // When selected file changes, fetch content
  useEffect(() => {
    if (!selectedFilePath || !app) return;

    async function loadFileContent() {
      setLoadingFile(true);
      try {
        const res = await fetch(
          `/api/applications/${slug}/source/file?path=${encodeURIComponent(selectedFilePath)}`
        );
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content);
          setFileSize(data.size);
          setIsBinary(Boolean(data.isBinary));
        } else {
          setFileContent(null);
        }
      } catch {
        setFileContent(null);
      } finally {
        setLoadingFile(false);
      }
    }

    loadFileContent();
  }, [selectedFilePath, app, slug]);

  if (loadingApp) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-xs text-neutral-400">
        Loading source code tree...
      </div>
    );
  }

  if (error === "NOT_FOUND" || !app) {
    return notFound();
  }

  if (error === "FORBIDDEN") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <Lock className="w-8 h-8 text-neutral-400 mb-2" />
        <h2 className="text-base font-bold text-neutral-900">Access Restricted</h2>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          This repository is private and can only be inspected by authorized members.
        </p>
        <Link href={`/apps/${slug}`}>
          <Button size="sm">Back to Details</Button>
        </Link>
      </div>
    );
  }

  if (app.sourceStatus !== "READY") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Code2 className="w-12 h-12 text-neutral-400 mx-auto stroke-1" />
        <h2 className="text-lg font-bold text-neutral-900">Source Archive Unavailable</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          Source code has not yet been uploaded or processed for this application.
        </p>
        <Link href={`/apps/${slug}`}>
          <Button size="sm" variant="outline">
            &larr; Back to Application
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="space-y-1">
          <Link
            href={`/apps/${slug}`}
            className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to application overview
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-brand-500" />
              <span>{app.name}</span>
              <span className="text-neutral-400 font-normal text-sm">/ source</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href={`/api/applications/${slug}/source`} download>
            <Button size="sm" variant="primary">
              <Download className="w-4 h-4" /> Download ZIP
            </Button>
          </a>
        </div>
      </div>

      {/* Language Percentage Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <LanguageBar languages={app.languages} />
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white px-4 py-2 rounded-lg border border-neutral-200 shadow-sm">
        <Breadcrumbs
          currentPath={selectedFilePath}
          rootName={app.slug}
          onNavigate={(path) => {
            // If user clicked breadcrumb root or folder
            if (path) setSelectedFilePath(path);
          }}
        />
      </div>

      {/* Split Pane: Tree on Left, Code Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* Left: Tree Navigation */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-3 shadow-sm overflow-auto max-h-[700px]">
          <div className="px-2 py-1.5 mb-2 border-b border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-600">
            <span>Repository Files</span>
            <span className="text-[11px] text-neutral-400">{app.sourceFileCount} files</span>
          </div>

          <SourceFileTree
            tree={app.sourceTree || []}
            selectedPath={selectedFilePath}
            onSelectFile={(path) => setSelectedFilePath(path)}
          />
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
          {loadingFile ? (
            <div className="h-full bg-white border border-neutral-200 rounded-xl flex items-center justify-center p-12 text-xs text-neutral-400">
              Loading source file...
            </div>
          ) : selectedFilePath ? (
            <SourceCodeViewer
              filePath={selectedFilePath}
              content={fileContent}
              size={fileSize}
              isBinary={isBinary}
            />
          ) : (
            <div className="h-full bg-white border border-neutral-200 rounded-xl flex flex-col items-center justify-center p-12 text-center text-xs text-neutral-400">
              <FileText className="w-10 h-10 stroke-1 text-neutral-300 mb-2" />
              <span>Select any file from the tree to view its contents.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
