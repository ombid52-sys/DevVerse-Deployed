import React from "react";
import Link from "next/link";
import { Code2, Heart, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/70 backdrop-blur-xl mt-auto transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center text-white">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-neutral-900 tracking-tight">
                Dev<span className="text-brand-500">Verse</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Cloud-based application showcase & open source-code sharing platform. Built with security, performance, and utilitarian minimalism.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
              Discover
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <Link href="/explore" className="hover:text-brand-600 transition-colors">
                  Explore Applications
                </Link>
              </li>
              <li>
                <Link href="/explore?category=AI" className="hover:text-brand-600 transition-colors">
                  Artificial Intelligence
                </Link>
              </li>
              <li>
                <Link href="/explore?category=DEVELOPER_TOOLS" className="hover:text-brand-600 transition-colors">
                  Developer Tools
                </Link>
              </li>
              <li>
                <Link href="/explore?platform=WEB_APP" className="hover:text-brand-600 transition-colors">
                  Web Applications
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
              Developers
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <Link href="/developer/apps/new" className="hover:text-brand-600 transition-colors">
                  Publish Your App
                </Link>
              </li>
              <li>
                <Link href="/developer" className="hover:text-brand-600 transition-colors">
                  Developer Portal
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-brand-600 transition-colors">
                  Join as Developer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
              Platform & Security
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li className="flex items-center gap-1.5 text-neutral-500">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Isolated Code Storage</span>
              </li>
              <li className="flex items-center gap-1.5 text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <Link href="/api/health" target="_blank" className="hover:underline">
                  API Status: Operational
                </Link>
              </li>
              <li>
                <Link href="/admin/init" className="text-neutral-400 hover:text-neutral-600 transition-colors">
                  Admin Setup
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>&copy; {new Date().getFullYear()} DevVerse Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for high reliability & security
          </p>
        </div>
      </div>
    </footer>
  );
}
