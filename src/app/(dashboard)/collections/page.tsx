"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderHeart, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTitle.trim(),
          description: newDescription.trim(),
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewDescription("");
        setCreateModalOpen(false);
        fetchCollections();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCollections();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <FolderHeart className="w-6 h-6 text-brand-500" />
            <span>My Collections</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Curate lists of applications for specific workflows, stacks, or categories
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Collection
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400">Loading collections...</div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<FolderHeart className="w-12 h-12 text-neutral-300 stroke-1" />}
          title="No collections created yet"
          description="Create custom collections to categorize and save notable applications."
          action={
            <Button size="sm" onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create Collection
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link
              key={col._id}
              href={`/collections/${col._id}`}
              className="bg-white border border-neutral-200 hover:border-brand-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base text-neutral-900 group-hover:text-brand-600 transition-colors">
                    {col.name}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(e, col._id)}
                    className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors"
                    title="Delete collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-neutral-500 line-clamp-2 mb-4 leading-relaxed">
                  {col.description || "No description provided."}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                <span>{col.applicationIds?.length || 0} application{col.applicationIds?.length === 1 ? "" : "s"}</span>
                <span className="text-brand-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  View &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Collection"
        description="Organize your preferred tools and applications"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Collection Title"
            required
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Essential AI Tools"
          />

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What this collection is for..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={creating}>
              Create Collection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
