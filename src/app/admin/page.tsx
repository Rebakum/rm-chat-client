"use client";

import MonitorBox from "@/components/chat/MonitorBox";
import AuthGuard from "@/components/common/AuthGuard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { SocketProvider, useSocket } from "@/constants/SocketContext";
import { useAuth } from "@/hooks/useAuth";
import {
  adminService,
  type AdminRole,
  type AdminUser,
  type AdminUserStatus,
} from "@/services/admin.service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const ADMIN_ROLES = ["ADMIN", "MODERATOR"] as const;

const navigation = [
  { label: "Dashboard Overview", href: "#overview", icon: "◫" },
  { label: "User Management", href: "#users", icon: "◍" },
  { label: "Live Chat Monitor", href: "#live-monitor", icon: "◉" },
  { label: "Invitation & Access", href: "#invites", icon: "◎" },
  { label: "Moderation & Audit", href: "#audit", icon: "◐" },
  { label: "System Settings", href: "#system", icon: "◧" },
  { label: "Notifications", href: "#notifications", icon: "◨" },
];

const auditLogs = [
  {
    actor: "Admin: Miriam",
    action: "Approved teacher registration",
    target: "USR-119",
    time: "7 mins ago",
    reason: "Document verification passed",
  },
  {
    actor: "Moderator: Iqbal",
    action: "Restored deleted message",
    target: "MSG-4821",
    time: "31 mins ago",
    reason: "User appealed and evidence reviewed",
  },
  {
    actor: "Admin: Saleh",
    action: "Rejected student request",
    target: "USR-208",
    time: "1 hour ago",
    reason: "Incomplete enrollment documents",
  },
  {
    actor: "System",
    action: "Auto-revoked expired invite",
    target: "INV-76",
    time: "3 hours ago",
    reason: "Expiration policy enforced",
  },
];

interface AdminNotification {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
}

const systemStatus = [
  {
    label: "SMTP / Email",
    status: "Healthy",
    value: "98.7%",
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Socket.IO",
    status: "Live",
    value: "2,184 conn",
    tone: "bg-cyan-100 text-cyan-700",
  },
  {
    label: "Cloudinary",
    status: "Stable",
    value: "1.8 TB",
    tone: "bg-violet-100 text-violet-700",
  },
  {
    label: "Database",
    status: "Healthy",
    value: "99.4%",
    tone: "bg-emerald-100 text-emerald-700",
  },
];

const PAGE_SIZE = 5;
const roleFilters = [
  { label: "All", value: "ALL" },
  { label: "Student", value: "STUDENT" },
  { label: "Teacher", value: "TEACHER" },
  { label: "Moderator", value: "MODERATOR" },
  { label: "Admin", value: "ADMIN" },
] as const;

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const router = useRouter();
  const [records, setRecords] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "ALL">(
    "ALL",
  );
  const [listLoading, setListLoading] = useState(true);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [adminNotificationCount, setAdminNotificationCount] = useState(0);
  const [adminNotifications, setAdminNotifications] = useState<
    AdminNotification[]
  >([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeNavigation, setActiveNavigation] = useState("#overview");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("STUDENT");
  const [lastInvite, setLastInvite] = useState<{
    email: string;
    userId: string;
    invite: string;
  } | null>(null);
  const canManageUsers = user?.role === "ADMIN";

  useEffect(() => {
    if (!socket || !canManageUsers) return;
    const handleAdminNotification = (
      notification: AdminNotification & { targetId: string },
    ) => {
      setAdminNotifications((current) =>
        [notification, ...current].slice(0, 5),
      );
      setAdminNotificationCount((current) => current + 1);
    };
    socket.on("admin:notification", handleAdminNotification);
    return () => {
      socket.off("admin:notification", handleAdminNotification);
    };
  }, [canManageUsers, socket]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "ADMIN") {
      setRecords([]);
      setTotal(0);
      setListLoading(false);
      setError("User administration is restricted to administrator accounts.");
      return;
    }
    let active = true;
    const timer = window.setTimeout(
      () => {
        setListLoading(true);
        setError("");
        adminService
          .getUsers({
            page,
            limit: PAGE_SIZE,
            search: search.trim() || undefined,
            role:
              roleFilter === "ALL"
                ? undefined
                : (roleFilter as AdminRole | "ADMIN"),
            status: statusFilter === "ALL" ? undefined : statusFilter,
          })
          .then((response) => {
            if (!active) return;
            setRecords(response.data || []);
            setTotal(response.meta?.total || 0);
          })
          .catch((requestError: unknown) => {
            if (!active) return;
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Could not load users.",
            );
          })
          .finally(() => {
            if (active) setListLoading(false);
          });
      },
      search ? 250 : 0,
    );

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [page, roleFilter, search, statusFilter, user, refreshTick]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, roleFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const changeStatus = async (id: string, status: AdminUserStatus) => {
    setRowBusy(id);
    setError("");
    setMessage("");
    try {
      await adminService.changeUserStatus(id, status);
      setMessage(`User ${status.toLowerCase()} successfully.`);
      setRefreshTick((tick) => tick + 1);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update user status.",
      );
    } finally {
      setRowBusy(null);
    }
  };

  const changeSelectedStatuses = async (status: AdminUserStatus) => {
    const selected = records.filter(
      (record) =>
        selectedIds.includes(record.id) &&
        record.role !== "ADMIN" &&
        record.status !== status,
    );
    if (!selected.length) {
      setError("Select at least one eligible user for this action.");
      return;
    }
    setBulkBusy(true);
    setError("");
    setMessage("");
    const results = await Promise.allSettled(
      selected.map((record) =>
        adminService.changeUserStatus(record.id, status),
      ),
    );
    const changed = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    setBulkBusy(false);
    setSelectedIds([]);
    setRefreshTick((tick) => tick + 1);
    if (changed)
      setMessage(
        `${changed} user${changed === 1 ? "" : "s"} ${status.toLowerCase()}.`,
      );
    if (changed < selected.length)
      setError(`${selected.length - changed} user status update(s) failed.`);
  };

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await adminService.createUser({
        displayName: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      const created = response.data;
      if (created)
        setLastInvite({
          email: created.email,
          userId: created.userId,
          invite: created.invite,
        });
      setInviteName("");
      setInviteEmail("");
      setMessage(response.message || "Invitation created.");
      setPage(1);
      setRefreshTick((tick) => tick + 1);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send invitation.",
      );
    } finally {
      setInviteBusy(false);
    }
  };

  const handleLogout = async () => {
    setLogoutBusy(true);
    await logout().catch(() => undefined);
    router.replace("/login");
    setLogoutBusy(false);
  };

  const metrics = [
    {
      label: "Matching users",
      value: total.toLocaleString(),
      tone: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Users on this page",
      value: records.length.toString(),
      tone: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Data status",
      value: listLoading ? "Loading" : error ? "Unavailable" : "Live",
      tone: listLoading
        ? "bg-slate-100 text-slate-700"
        : error
          ? "bg-red-100 text-red-700"
          : "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen w-full overflow-hidden bg-[#f8fafc]">
        <aside className="flex w-[260px] shrink-0 flex-col bg-[linear-gradient(180deg,_#0f172a_0%,_#162a3e_100%)] px-5 py-6 text-white">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d4ed8] text-base font-bold text-white shadow-lg shadow-blue-900/20">
              R
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                Rahmah
              </p>
              <h2 className="text-base font-bold">Chat</h2>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setActiveNavigation(item.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  activeNavigation === item.href
                    ? "bg-blue-600/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="relative inline-flex h-5 w-5 items-center justify-center text-[11px]">
                  {item.icon}
                  {item.label === "Notifications" &&
                    adminNotificationCount > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                        {adminNotificationCount > 9
                          ? "9+"
                          : adminNotificationCount}
                      </span>
                    )}
                </span>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">
              System
            </p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-300">Realtime</span>
              <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                Live
              </span>
            </div>
          </div>

          <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span aria-hidden="true">↗</span> Back to Home Page
            </Link>
            <button
              type="button"
              disabled={logoutBusy}
              onClick={() => {
                void handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-wait disabled:opacity-50"
            >
              <span aria-hidden="true">⇥</span>{" "}
              {logoutBusy ? "Logging out…" : "Logout"}
            </button>
            <div className="px-3 pt-2 text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">
              v2.0.4
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-slate-100">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-7 py-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-700">
                  Dashboard
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  Rahmah Chat Administration
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={`Notifications${adminNotificationCount ? `, ${adminNotificationCount} unread` : ""}`}
                onClick={() => {
                  setAdminNotificationCount(0);
                  setActiveNavigation("#notifications");
                  document
                    .getElementById("notifications")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                {adminNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {adminNotificationCount > 99
                      ? "99+"
                      : adminNotificationCount}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                System healthy
              </div>
              <a
                href="#invites"
                onClick={() => setActiveNavigation("#invites")}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + New invite
              </a>
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                  {user?.displayName?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">
                    {user?.displayName || "Admin User"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {user?.role || "Administrator"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-6">
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                {message}
              </p>
            )}

            <section
              id="overview"
              className="grid scroll-mt-5 gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${metric.tone}`}
                  >
                    {metric.value === "Loading"
                      ? "Syncing"
                      : metric.value === "Unavailable"
                        ? "Check API"
                        : "Live data"}
                  </span>
                  <p className="mt-4 text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {metric.value}
                  </p>
                </div>
              ))}
            </section>

            <div id="live-monitor" className="scroll-mt-5">
              <MonitorBox socket={socket} connected={connected} />
            </div>

            <section
              id="users"
              className="grid scroll-mt-5 gap-6 xl:grid-cols-[1.7fr_0.9fr]"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-blue-700">
                      User management
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      Workspace users
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {roleFilters.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        aria-pressed={roleFilter === filter.value}
                        onClick={() => {
                          setRoleFilter(filter.value);
                          setPage(1);
                        }}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                          roleFilter === filter.value
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="w-full max-w-md">
                    <Input
                      aria-label="Search users"
                      placeholder="Search by name, email or user ID"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Filter by status"
                      value={statusFilter}
                      onChange={(event) => {
                        setStatusFilter(
                          event.target.value as AdminUserStatus | "ALL",
                        );
                        setPage(1);
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="ALL">All statuses</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        !canManageUsers || bulkBusy || !selectedIds.length
                      }
                      isLoading={bulkBusy}
                      onClick={() => {
                        void changeSelectedStatuses("REJECTED");
                      }}
                    >
                      Bulk reject
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={
                        !canManageUsers || bulkBusy || !selectedIds.length
                      }
                      isLoading={bulkBusy}
                      onClick={() => {
                        void changeSelectedStatuses("ACCEPTED");
                      }}
                    >
                      Bulk accept
                    </Button>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-[760px] divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            aria-label="Select eligible users on this page"
                            type="checkbox"
                            disabled={
                              !canManageUsers || listLoading || bulkBusy
                            }
                            checked={
                              records.some(
                                (record) => record.role !== "ADMIN",
                              ) &&
                              records
                                .filter((record) => record.role !== "ADMIN")
                                .every((record) =>
                                  selectedIds.includes(record.id),
                                )
                            }
                            onChange={(event) =>
                              setSelectedIds(
                                event.target.checked
                                  ? records
                                      .filter(
                                        (record) => record.role !== "ADMIN",
                                      )
                                      .map((record) => record.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          User
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Role
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {!listLoading &&
                        records.map((userItem) => (
                          <tr key={userItem.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <input
                                aria-label={`Select ${userItem.displayName}`}
                                type="checkbox"
                                disabled={
                                  !canManageUsers ||
                                  userItem.role === "ADMIN" ||
                                  bulkBusy
                                }
                                checked={selectedIds.includes(userItem.id)}
                                onChange={(event) =>
                                  setSelectedIds((selected) =>
                                    event.target.checked
                                      ? [...selected, userItem.id]
                                      : selected.filter(
                                          (id) => id !== userItem.id,
                                        ),
                                  )
                                }
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {userItem.displayName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {userItem.email}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {userItem.role.toLowerCase()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                  userItem.status === "ACCEPTED"
                                    ? "bg-accent-100 text-accent-800"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {userItem.status.toLowerCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {canManageUsers &&
                                  userItem.role !== "ADMIN" &&
                                  (userItem.status === "REJECTED" ? (
                                    <button
                                      type="button"
                                      disabled={rowBusy === userItem.id}
                                      onClick={() => {
                                        void changeStatus(
                                          userItem.id,
                                          "ACCEPTED",
                                        );
                                      }}
                                      className="rounded-full bg-accent-50 px-2 py-1 text-xs font-semibold text-accent-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {rowBusy === userItem.id
                                        ? "Saving…"
                                        : "Approve"}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={rowBusy === userItem.id}
                                      onClick={() => {
                                        void changeStatus(
                                          userItem.id,
                                          "REJECTED",
                                        );
                                      }}
                                      className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {rowBusy === userItem.id
                                        ? "Saving…"
                                        : "Reject"}
                                    </button>
                                  ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      {listLoading && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-10 text-center text-slate-500"
                          >
                            Loading users…
                          </td>
                        </tr>
                      )}
                      {!listLoading && !records.length && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-10 text-center text-slate-500"
                          >
                            No users match these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
                  <span>
                    {total
                      ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total}`
                      : "No users found"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || listLoading}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="rounded-lg bg-blue-600 px-2.5 py-1 font-semibold text-white">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages || listLoading}
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div
                  id="invites"
                  className="scroll-mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                        Invite user
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">
                        Create access
                      </h3>
                    </div>
                  </div>

                  <form
                    onSubmit={(event) => {
                      void submitInvite(event);
                    }}
                    className="mt-4 space-y-3"
                  >
                    <Input
                      label="Full name"
                      placeholder="e.g. Aisha Khan"
                      value={inviteName}
                      onChange={(event) => setInviteName(event.target.value)}
                      required
                      maxLength={100}
                    />
                    <Input
                      label="Email address"
                      type="email"
                      placeholder="user@rahmah.edu"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      required
                    />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(event) =>
                          setInviteRole(event.target.value as AdminRole)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="TEACHER">Teacher</option>
                        <option value="MODERATOR">Moderator</option>
                      </select>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      isLoading={inviteBusy}
                      disabled={!canManageUsers || inviteBusy}
                    >
                      Send invite
                    </Button>
                  </form>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Latest invitation
                  </p>
                  {lastInvite ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-semibold text-slate-800">
                        {lastInvite.email}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        User ID: {lastInvite.userId}
                      </p>
                      <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        {lastInvite.invite}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      New invitations you create will appear here.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section
              id="audit"
              className="grid scroll-mt-5 gap-6 xl:grid-cols-[1.35fr_0.65fr]"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                      Moderation
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      Audit logs
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Recent activity
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={`${log.actor}-${log.target}`}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {log.action}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {log.actor} • {log.target} • {log.time}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Reason: {log.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                id="system"
                className="scroll-mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                  System status
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  Infrastructure
                </h3>
                <div className="mt-5 space-y-3">
                  {systemStatus.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700">
                          {item.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${item.tone}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              id="notifications"
              className="scroll-mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                Notifications
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                Live account activity
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Registration, first-login, approval and rejection events appear
                here in real time.
              </p>
              {adminNotifications.length ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {adminNotifications.map((notification) => (
                    <li key={notification.id} className="py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {notification.detail}
                      </p>
                      <time
                        className="mt-1 block text-xs text-slate-500"
                        dateTime={notification.createdAt}
                      >
                        {new Date(notification.createdAt).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No new account activity while this dashboard is open.
                </p>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard allowedRoles={[...ADMIN_ROLES]}>
      <SocketProvider>
        <AdminDashboardContent />
      </SocketProvider>
    </AuthGuard>
  );
}
