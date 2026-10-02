"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { FolderPlus, Check, Plus } from "lucide-react";

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicationName: string;
}

export function AddToCollectionModal({
  isOpen,
  onClose,
  applicationId,
  applicationName,
}: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    if (isOpen) {
      setMessage(null);
      fetchCollections();
    }
  }, [isOpen]);

  const handleAddToCollection = async (collectionId: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/collections/${collectionId}/apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Application successfully added to collection!");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage(data.error || "Failed to add application");
      }
    } catch {
      setMessage("Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setActionLoading(true);
    try {
      const createRes = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        // Immediately add app to the new collection
        await handleAddToCollection(created.collection._id);
        setNewCollectionName("");
        setShowCreateForm(false);
        fetchCollections();
      }
    } catch {
      setMessage("Failed to create collection");
      setActionLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Collection"
      description={`Save "${applicationName}" to a personal collection`}
    >
      <div className="space-y-4">
        {message && (
          <div
            className={`p-3 rounded-md text-xs font-medium ${
              message.includes("success")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="py-6 text-center text-xs text-neutral-400">Loading your collections...</div>
        ) : collections.length === 0 && !showCreateForm ? (
          <div className="text-center py-6">
            <p className="text-xs text-neutral-500 mb-3">You do not have any collections yet.</p>
            <Button size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create First Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {collections.map((col) => {
              const alreadyIn = (col.applicationIds || []).includes(applicationId);
              return (
                <div
                  key={col._id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-900">{col.name}</h4>
                    <p className="text-[11px] text-neutral-400">
                      {col.applicationIds?.length || 0} applications
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyIn ? "outline" : "primary"}
                    disabled={alreadyIn || actionLoading}
                    onClick={() => handleAddToCollection(col._id)}
                  >
                    {alreadyIn ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Check className="w-3.5 h-3.5" /> Added
                      </span>
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {showCreateForm ? (
          <form onSubmit={handleCreateCollection} className="pt-3 border-t border-neutral-100 flex gap-2">
            <Input
              placeholder="New collection title..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="text-xs"
              autoFocus
            />
            <Button size="sm" type="submit" isLoading={actionLoading}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <div className="pt-2 border-t border-neutral-100">
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" /> Create new collection
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
