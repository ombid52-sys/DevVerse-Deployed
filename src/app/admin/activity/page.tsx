"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Activity,
  Search,
  Filter,
  Radio,
  Clock,
  User,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatDateTime, formatRole } from "@/lib/utils";
import { ActivityLog } from "@/types";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial paginated logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (actionFilter) q.set("action", actionFilter);
      q.set("page", page.toString());
      q.set("limit", "25");

      const res = await fetch(`/api/admin/activity?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  // Connect to SSE Live Activity Stream
  useEffect(() => {
    const es = new EventSource("/api/admin/activity/stream");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "LOG" && data.log) {
          setLogs((prev) => [data.log, ...prev.slice(0, 49)]);
        }
      } catch {
        // ignore ping
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("FAILED") || action.includes("DELETE") || action.includes("SUSPEND")) {
      return "danger";
    }
    if (action.includes("DISABLED")) {
      return "warning";
    }
    if (action.includes("SUCCESS") || action.includes("READY") || action.includes("CREATE")) {
      return "success";
    }
    return "brand";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-500" />
            <span>Audit & Activity Stream</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time audit records tracking authentications, uploads, security events, and administrative operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={fetchLogs}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Search and Action Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, actor, target..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        <Select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          size="sm"
          className="w-48"
          options={[
            { value: "", label: "All Actions" },
            { value: "AUTH_LOGIN_SUCCESS", label: "AUTH_LOGIN_SUCCESS" },
            { value: "AUTH_LOGIN_FAILED", label: "AUTH_LOGIN_FAILED" },
            { value: "AUTH_REGISTER", label: "AUTH_REGISTER" },
            { value: "AUTH_VERIFY_EMAIL", label: "AUTH_VERIFY_EMAIL" },
            { value: "APP_CREATE", label: "APP_CREATE" },
            { value: "APP_SOURCE_UPLOAD_SUCCESS", label: "APP_SOURCE_UPLOAD_SUCCESS" },
            { value: "APP_SOURCE_UPLOAD_FAILED", label: "APP_SOURCE_UPLOAD_FAILED" },
            { value: "ADMIN_USER_STATUS_DISABLED", label: "ADMIN_USER_STATUS_DISABLED" },
            { value: "ADMIN_USER_STATUS_SUSPENDED", label: "ADMIN_USER_STATUS_SUSPENDED" },
            { value: "ADMIN_APP_PERMANENT_DELETE", label: "ADMIN_APP_PERMANENT_DELETE" },
          ]}
        />
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400">Loading audit records...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-xs text-neutral-400">
          No audit records found matching your filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Metadata / Details</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id?.toString() || Math.random()}>
                <TableCell className="text-xs font-mono text-neutral-500 whitespace-nowrap">
                  {formatDateTime(log.timestamp)}
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-neutral-800">
                  {log.actorEmail || log.actorId || "Anonymous"}
                </TableCell>
                <TableCell>
                  <Badge variant="neutral" size="sm">
                    {formatRole(log.actorRole || "Anonymous")}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-neutral-600 font-mono">
                  {log.targetType ? `${log.targetType}:${(log.targetId || "").slice(0, 8)}...` : "-"}
                </TableCell>
                <TableCell className="text-[11px] text-neutral-600 font-mono max-w-xs truncate">
                  {log.metadata ? JSON.stringify(log.metadata) : "-"}
                </TableCell>
                <TableCell className="text-[11px] text-neutral-400 font-mono">
                  {log.ip || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
