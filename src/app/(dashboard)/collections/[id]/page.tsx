"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Edit2, FolderHeart, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { AppCard } from "@/components/apps/AppCard";

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/collections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data.collection);
        setName(data.collection.name || "");
        setDescription(data.collection.description || "");
      } else {
        setCollection(null);
      }
    } catch {
      setCollection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (res.ok) {
        setEditModalOpen(false);
        fetchCollection();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveApp = async (appId: string) => {
    try {
      const res = await fetch(`/api/collections/${id}/apps`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: appId }),
      });

      if (res.ok) {
        fetchCollection();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteCollection = async () => {
    if (!confirm("Are you sure you want to permanently delete this collection?")) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/collections");
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-neutral-400">Loading collection...</div>;
  }

  if (!collection) {
    return notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-neutral-200">
        <Link
          href="/collections"
          className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to all collections
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <FolderHeart className="w-6 h-6 text-brand-500" />
              <span>{collection.name}</span>
            </h1>
            {collection.description && (
              <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditModalOpen(true)}>
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="danger" onClick={handleDeleteCollection}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
          <span>{collection.applications?.length || 0} application{collection.applications?.length === 1 ? "" : "s"} in this collection</span>
        </div>

        {collection.applications?.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-xs text-neutral-400">
            <p className="mb-4">This collection does not contain any applications yet.</p>
            <Link href="/explore">
              <Button size="sm">Browse & Add Applications</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collection.applications.map((app: any) => (
              <div key={app._id} className="relative group">
                <AppCard app={app} />
                <button
                  onClick={() => handleRemoveApp(app._id)}
                  title="Remove from collection"
                  className="absolute top-2 left-2 z-10 p-1.5 bg-neutral-900/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Collection"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Collection Title"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
