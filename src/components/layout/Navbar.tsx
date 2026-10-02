"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Code2,
  Compass,
  Terminal,
  Heart,
  FolderHeart,
  Plus,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Search,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatRole } from "@/lib/utils";

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: "USER" | "DEVELOPER" | "ADMIN";
  avatarUrl?: string;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUserDropdownOpen(false);
    fetchCurrentUser();
  }, [pathname]);

  // Close user dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!userDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userDropdownOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setUserDropdownOpen(false);
    window.location.href = "/";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-neutral-900 tracking-tight">
                Dev<span className="text-brand-500">Verse</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1.5">
              <Link
                href="/explore"
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  pathname === "/explore"
                    ? "text-brand-700 bg-brand-50/90 border border-brand-200/80 shadow-2xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 border border-transparent"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Explore
                </span>
              </Link>

              {currentUser && (currentUser.role === "DEVELOPER" || currentUser.role === "ADMIN") && (
                <Link
                  href="/developer"
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                    pathname.startsWith("/developer")
                      ? "text-brand-700 bg-brand-50/90 border border-brand-200/80 shadow-2xs"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    Developer Hub
                  </span>
                </Link>
              )}

              {currentUser?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                    pathname.startsWith("/admin")
                      ? "text-purple-700 bg-purple-50/90 border border-purple-200/80 shadow-2xs"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Admin
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden sm:flex flex-1 max-w-xs">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/80 border border-slate-200/90 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-neutral-900 transition-all shadow-xs"
              />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-slate-200/60 rounded-xl animate-pulse" />
            ) : currentUser ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/90 border border-slate-200/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-2xs"
                  aria-expanded={userDropdownOpen}
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 font-semibold text-xs flex items-center justify-center uppercase">
                      {currentUser.username.slice(0, 2)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-neutral-800 hidden sm:inline max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.username}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-xl border border-white/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {currentUser.displayName || currentUser.username}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">{currentUser.email}</p>
                      <div className="mt-1">
                        <Badge
                          variant={currentUser.role === "ADMIN" ? "danger" : currentUser.role === "DEVELOPER" ? "brand" : "neutral"}
                          size="sm"
                        >
                          {formatRole(currentUser.role)}
                        </Badge>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-2 mx-1.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-slate-100/80 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-neutral-400" />
                      Account Settings
                    </Link>

                    <Link
                      href="/favorites"
                      className="flex items-center gap-2 mx-1.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-slate-100/80 rounded-xl transition-colors"
                    >
                      <Heart className="w-4 h-4 text-neutral-400" />
                      My Favourites
                    </Link>

                    <Link
                      href="/collections"
                      className="flex items-center gap-2 mx-1.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-slate-100/80 rounded-xl transition-colors"
                    >
                      <FolderHeart className="w-4 h-4 text-neutral-400" />
                      My Collections
                    </Link>

                    {(currentUser.role === "DEVELOPER" || currentUser.role === "ADMIN") && (
                      <Link
                        href="/developer/apps/new"
                        className="flex items-center gap-2 mx-1.5 px-3 py-2 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50/90 rounded-xl font-semibold transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Publish Application
                      </Link>
                    )}

                    <div className="border-t border-neutral-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-[calc(100%-12px)] text-left mx-1.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-md"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-100 border border-transparent rounded-lg text-neutral-900"
              />
            </form>

            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
            >
              <Compass className="w-4 h-4 text-neutral-500" />
              Explore Applications
            </Link>

            {currentUser && (currentUser.role === "DEVELOPER" || currentUser.role === "ADMIN") && (
              <Link
                href="/developer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
              >
                <Terminal className="w-4 h-4 text-brand-600" />
                Developer Dashboard
              </Link>
            )}

            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 rounded-md"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Admin Control Center
              </Link>
            )}

            {!currentUser && (
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
