"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Grid,
  Activity,
  ShieldCheck,
  Server,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "User Accounts", icon: Users },
  { href: "/admin/apps", label: "Applications", icon: Grid },
  { href: "/admin/activity", label: "Audit & Activity", icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-white border-r border-neutral-200 shrink-0 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Admin Control Center</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Full platform governance
          </p>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-brand-600" : "text-neutral-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-neutral-100 px-3">
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <Server className="w-3.5 h-3.5" />
          <span>Storage: B2 Storage</span>
        </div>
      </div>
    </aside>
  );
}
