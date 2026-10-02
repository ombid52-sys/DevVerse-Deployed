"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  Clock,
  Ban,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate, formatDateTime, formatRole, formatStatus } from "@/lib/utils";
import { Role, AccountStatus } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Status Action Modal
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<AccountStatus>("ACTIVE");
  const [disabledHours, setDisabledHours] = useState<number>(24);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (roleFilter) q.set("role", roleFilter);
      if (statusFilter) q.set("status", statusFilter);
      q.set("page", page.toString());
      q.set("limit", "15");

      const res = await fetch(`/api/admin/users?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openActionModal = (user: any) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setDisabledHours(24);
    setActionReason("");
    setModalMessage(null);
    setModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    setModalMessage(null);

    let disabledUntil: string | null = null;
    if (newStatus === "DISABLED") {
      const d = new Date(Date.now() + disabledHours * 60 * 60 * 1000);
      disabledUntil = d.toISOString();
    }

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          disabledUntil,
          reason: actionReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setModalMessage(`User status successfully updated to ${newStatus}`);
        setTimeout(() => {
          setModalOpen(false);
          fetchUsers();
        }, 1200);
      } else {
        setModalMessage(data.error || "Failed to update status");
      }
    } catch {
      setModalMessage("Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-500" />
            <span>User & Developer Management</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Govern platform account statuses, permissions, temporary disables, and permanent suspensions
          </p>
        </div>

        <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full">
          Total Accounts: {total}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, username, or name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            size="sm"
            className="w-32"
            options={[
              { value: "", label: "All Roles" },
              { value: "USER", label: "USER" },
              { value: "DEVELOPER", label: "DEVELOPER" },
              { value: "ADMIN", label: "ADMIN" },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            size="sm"
            className="w-36"
            options={[
              { value: "", label: "All Statuses" },
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "DISABLED", label: "DISABLED" },
              { value: "SUSPENDED", label: "SUSPENDED" },
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400">Loading accounts...</div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-xs text-neutral-400">
          No accounts found matching your query.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User / Identifier</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div>
                    <span className="font-semibold text-xs text-neutral-900 block">
                      {u.displayName || u.username}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {u.email} &bull; @{u.username}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.role === "ADMIN" ? "danger" : u.role === "DEVELOPER" ? "brand" : "neutral"}
                    size="sm"
                  >
                    {formatRole(u.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.status === "ACTIVE" ? (
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  ) : u.status === "DISABLED" ? (
                    <div className="space-y-0.5">
                      <Badge variant="warning" size="sm">
                        Disabled
                      </Badge>
                      {u.disabledUntil && (
                        <p className="text-[10px] text-neutral-400">
                          Until {formatDateTime(u.disabledUntil)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Badge variant="danger" size="sm">
                      Suspended
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-neutral-600">
                  {u.isEmailVerified ? (
                    <span className="text-emerald-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-neutral-400">Pending</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {formatDate(u.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  {u.role === "ADMIN" ? (
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Protected
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionModal(u)}
                    >
                      Manage Status
                    </Button>
                  )}
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

      {/* Status Management Modal */}
      {selectedUser && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Manage Account: ${selectedUser.username}`}
          description={`Update account state for ${selectedUser.email}`}
        >
          {modalMessage && (
            <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 text-xs rounded-md font-medium text-neutral-800">
              {modalMessage}
            </div>
          )}

          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Target Account State
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="modalStatus"
                    value="ACTIVE"
                    checked={newStatus === "ACTIVE"}
                    onChange={() => setNewStatus("ACTIVE")}
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 block">
                      Active
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Unrestricted access to the platform
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="modalStatus"
                    value="DISABLED"
                    checked={newStatus === "DISABLED"}
                    onChange={() => setNewStatus("DISABLED")}
                  />
                  <div>
                    <span className="text-xs font-semibold text-amber-700 block">
                      Temporarily Disabled
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Block authentication until expiry timestamp
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="modalStatus"
                    value="SUSPENDED"
                    checked={newStatus === "SUSPENDED"}
                    onChange={() => setNewStatus("SUSPENDED")}
                  />
                  <div>
                    <span className="text-xs font-semibold text-red-700 block">
                      Permanently Suspended
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Completely revoke access and invalidate all active sessions
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {newStatus === "DISABLED" && (
              <div>
                <Select
                  label="Disable Duration"
                  value={disabledHours}
                  onChange={(e) => setDisabledHours(parseInt(e.target.value, 10))}
                  options={[
                    { value: 1, label: "1 hour" },
                    { value: 12, label: "12 hours" },
                    { value: 24, label: "24 hours (1 day)" },
                    { value: 72, label: "72 hours (3 days)" },
                    { value: 168, label: "7 days" },
                    { value: 720, label: "30 days" },
                  ]}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Administrative Reason (recorded in audit log)
              </label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Terms of service violation, suspicious login..."
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={actionLoading}>
                Update Account State
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
