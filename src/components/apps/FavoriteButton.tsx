"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  applicationId: string;
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
  className?: string;
}

export function FavoriteButton({
  applicationId,
  size = "md",
  iconOnly = false,
  className,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check initial favorite status
    const checkFavorite = async () => {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          const match = data.favorites?.some(
            (app: any) => app._id?.toString() === applicationId
          );
          setIsFavorited(Boolean(match));
        }
      } catch {
        // user not logged in
      }
    };
    checkFavorite();
  }, [applicationId]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
      }
    } catch (err) {
      console.error("Favorite toggle failed", err);
    } finally {
      setLoading(false);
    }
  };

  const label = isFavorited ? "Remove from favourites" : "Add to favourites";

  return (
    <Button
      variant={isFavorited ? "primary" : "outline"}
      size={size}
      onClick={handleToggle}
      isLoading={loading}
      title={label}
      aria-label={label}
      className={cn(
        iconOnly ? "h-10 w-10 p-0 shrink-0 flex items-center justify-center" : "",
        isFavorited
          ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent"
          : "text-neutral-700 hover:text-neutral-900 border-neutral-300",
        className
      )}
    >
      <Heart
        className={cn(
          "w-4.5 h-4.5 transition-transform active:scale-125",
          isFavorited ? "fill-white text-white" : "text-neutral-600"
        )}
      />
      {!iconOnly && <span>{isFavorited ? "Favourited" : "Favourite"}</span>}
    </Button>
  );
}
