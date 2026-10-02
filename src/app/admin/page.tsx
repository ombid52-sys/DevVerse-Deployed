"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Terminal,
  Grid,
  Activity,
  ShieldCheck,
  Server,
  ArrowRight,
  Database,
  Cloud,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    developers: 0,
    totalApps: 0,
    publicApps: 0,
    privateApps: 0,
    recentLogs: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersRes, appsRes, logsRes] = await Promise.all([
          fetch("/api/admin/users?limit=1"),
          fetch("/api/admin/applications?limit=100"),
          fetch("/api/admin/activity?limit=6"),
        ]);

        let totalUsers = 0;
        let developers = 0;
        let totalApps = 0;
        let publicApps = 0;
        let privateApps = 0;
        let recentLogs: any[] = [];

        if (usersRes.ok) {
          const uData = await usersRes.json();
          totalUsers = uData.total || 0;
        }

        if (appsRes.ok) {
          const aData = await appsRes.json();
          const items = aData.applications || [];
          totalApps = aData.total || items.length;
          publicApps = items.filter((a: any) => a.visibility === "PUBLIC").length;
          privateApps = items.filter((a: any) => a.visibility === "PRIVATE").length;
        }

        if (logsRes.ok) {
          const lData = await logsRes.json();
          recentLogs = lData.logs || [];
        }

        setStats({
          totalUsers,
          developers,
          totalApps,
          publicApps,
          privateApps,
          recentLogs,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Connect to SSE Live Activity Stream
  useEffect(() => {
    const es = new EventSource("/api/admin/activity/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsLiveConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "LOG" && data.log) {
          setStats((prev) => ({
            ...prev,
            recentLogs: [data.log, ...prev.recentLogs.slice(0, 5)],
          }));
        }
      } catch {
        // ignore ping
      }
    };

    es.onerror = () => {
      setIsLiveConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <span>Platform Overview</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            System governance, active workloads, and security audit logs
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
          <div className="w-44 h-7 flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>System Healthy</span>
          </div>
          <div
            className={`w-44 h-7 flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-medium border ${
              isLiveConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-neutral-100 text-neutral-500 border-neutral-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
              }`}
            />
            <span>{isLiveConnected ? "Live SSE Connected" : "Connecting..."}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-brand-600 rounded-xl flex items-center justify-center border border-blue-200/60 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Registered Accounts</p>
              <h3 className="text-2xl font-bold text-neutral-900">{stats.totalUsers}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-200/60 shrink-0">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Total Applications</p>
              <h3 className="text-2xl font-bold text-neutral-900">{stats.totalApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200/60 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Public Apps</p>
              <h3 className="text-2xl font-bold text-neutral-900">{stats.publicApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200/60 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Storage Backend</p>
              <h3 className="text-sm font-bold text-neutral-900 mt-1">
                B2 Storage
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="p-5 glass-card border border-white/80 hover:border-brand-300/80 rounded-2xl shadow-xs hover:shadow-md transition-all duration-150 ease-out hover:-translate-y-0.5 group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100/90 text-neutral-700 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center transition-colors border border-slate-200/60 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900">Manage Users</h3>
              <p className="text-[11px] text-neutral-500">Inspect status, disable or suspend</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/apps"
          className="p-5 glass-card border border-white/80 hover:border-brand-300/80 rounded-2xl shadow-xs hover:shadow-md transition-all duration-150 ease-out hover:-translate-y-0.5 group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100/90 text-neutral-700 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center transition-colors border border-slate-200/60 shrink-0">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900">Manage Applications</h3>
              <p className="text-[11px] text-neutral-500">Visibility control and deletions</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/activity"
          className="p-5 glass-card border border-white/80 hover:border-brand-300/80 rounded-2xl shadow-xs hover:shadow-md transition-all duration-150 ease-out hover:-translate-y-0.5 group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100/90 text-neutral-700 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center transition-colors border border-slate-200/60 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900">Live Audit Stream</h3>
              <p className="text-[11px] text-neutral-500">Real-time SSE event feed</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            Recent Audit &amp; Security Logs
          </h2>
          <Link
            href="/admin/activity"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View live stream &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-neutral-400">Loading audit events...</div>
        ) : stats.recentLogs.length === 0 ? (
          <div className="glass-card border border-white/80 rounded-2xl p-8 text-center text-xs text-neutral-400 shadow-xs">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="glass-card border border-white/80 rounded-2xl divide-y divide-slate-100/90 shadow-xs overflow-hidden">
            {stats.recentLogs.map((log: any) => (
              <div
                key={log._id?.toString() || Math.random()}
                className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" size="sm">
                    {log.action}
                  </Badge>
                  <span className="font-mono text-neutral-700">
                    {log.actorEmail || "anonymous"}
                  </span>
                  {log.targetType && (
                    <span className="text-neutral-400">
                      &bull; target: {log.targetType}
                    </span>
                  )}
                </div>
                <span className="text-neutral-400 font-mono text-[11px]">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
