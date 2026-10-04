"use client";

import Sidebar from "@/components/Sidebar";
import { useSocket } from "@/constants/SocketContext";
import { useAuth } from "@/hooks/useAuth";
import { adminService, type AuditLogEntry } from "@/services/admin.service";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RecentNotification {
  key: string;
  title: string;
  detail: string;
  status: string;
  createdAt: string;
}

const auditTitle = (action: string) => {
  if (action === "USER_CREATED") return "Account invitation created";
  if (action === "USER_REGISTERED") return "New user registered";
  if (action === "USER_FIRST_LOGIN") return "New user first login";
  if (action === "USER_ACCEPTED") return "Account approved";
  if (action === "USER_REJECTED") return "Account rejected";
  return action.toLowerCase().replaceAll("_", " ");
};

const navigation = [
  { label: "Dashboard Overview", href: "/dashboard" },
  { label: "User Management", href: "/dashboard/users" },
  { label: "Chat Monitor", href: "/dashboard/chat-monitor" },
  { label: "Moderation & Audit", href: "/dashboard/moderation" },
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "System Settings", href: "/dashboard/settings" },
];

const titles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/dashboard/users": "User Management",
  "/dashboard/chat-monitor": "Chat Monitor",
  "/dashboard/moderation": "Moderation & Audit",
  "/dashboard/notifications": "Notifications",
  "/dashboard/settings": "System Settings",
};

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notificationCount, clearNotifications, socket } = useSocket();
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationRefresh, setNotificationRefresh] = useState(0);
  const [auditEvents, setAuditEvents] = useState<AuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [lastReadAt, setLastReadAt] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const [activeHref, setActiveHref] = useState(() =>
    typeof window === "undefined"
      ? pathname
      : `${pathname}${window.location.hash}`,
  );
  const pageTitle = titles[pathname] || "Dashboard Overview";
  const readStorageKey = user?.id
    ? `rahmah-dashboard-notifications-read:${user.id}`
    : null;
  const visibleNavigation =
    user?.role === "ADMIN"
      ? navigation
      : navigation.filter(
          (item) =>
            item.href !== "/dashboard/users" &&
            item.href !== "/dashboard/chat-monitor",
        );

  useEffect(() => {
    const syncActiveHref = () =>
      setActiveHref(`${window.location.pathname}${window.location.hash}`);
    syncActiveHref();
    window.addEventListener("hashchange", syncActiveHref);
    return () => window.removeEventListener("hashchange", syncActiveHref);
  }, [pathname]);

  useEffect(() => {
    if (!readStorageKey) {
      setLastReadAt(0);
      return;
    }
    setLastReadAt(Number(window.localStorage.getItem(readStorageKey)) || 0);
  }, [readStorageKey]);

  useEffect(() => {
    const role = user?.role;
    if (!role) return;
    let active = true;

    const refreshNotifications = async () => {
      try {
        const auditResponse = await adminService.getAuditLogs(
          1,
          100,
          "notifications",
        );
        if (!active) return;
        setAuditEvents(auditResponse.data || []);
        setAuditTotal(auditResponse.meta?.total || 0);
        setNotificationError("");
      } catch {
        if (active) setNotificationError("Unable to refresh notifications.");
      }
    };

    void refreshNotifications();
    const refreshTimer = window.setInterval(() => {
      void refreshNotifications();
    }, 30_000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [notificationRefresh, user?.role]);

  useEffect(() => {
    if (user?.role !== "ADMIN" || !socket) return;
    const refreshOnAdminNotification = () => {
      setNotificationRefresh((current) => current + 1);
    };
    socket.on("admin:notification", refreshOnAdminNotification);
    return () => {
      socket.off("admin:notification", refreshOnAdminNotification);
    };
  }, [socket, user?.role]);

  useEffect(() => {
    if (pathname !== "/dashboard/notifications") return;
    const timestamp = Date.now();
    setLastReadAt(timestamp);
    if (readStorageKey)
      window.localStorage.setItem(readStorageKey, String(timestamp));
    clearNotifications();
  }, [clearNotifications, pathname, readStorageKey]);

  const recentNotifications: RecentNotification[] = [
    ...auditEvents.map((event) => ({
      key: `audit:${event.id}`,
      title: auditTitle(event.action),
      detail: event.detail || "Account access activity recorded.",
      status: "Recorded",
      createdAt: event.createdAt,
    })),
  ]
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    )
    .slice(0, 5);
  const unreadAuditCount = lastReadAt
    ? auditEvents.filter((event) => Date.parse(event.createdAt) > lastReadAt)
        .length
    : auditTotal;
  const unreadCount = notificationCount + unreadAuditCount;

  const markAllNotificationsRead = () => {
    const timestamp = Date.now();
    setLastReadAt(timestamp);
    if (readStorageKey)
      window.localStorage.setItem(readStorageKey, String(timestamp));
    clearNotifications();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout().catch(() => undefined);
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar
        user={user}
        visibleNavigation={visibleNavigation}
        activeHref={activeHref}
        onLogout={() => {
          void handleLogout();
        }}
        loggingOut={loggingOut}
        notificationCount={notificationCount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-[82px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-7">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_0_3px_rgba(6,182,212,0.12)]" />
              Rahmah Chat Administration
            </p>
            <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-[22px]">
              {pageTitle}
            </h1>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="relative">
              <button
                type="button"
                aria-label={
                  unreadCount
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
                }
                aria-expanded={notificationOpen}
                aria-controls="dashboard-notification-popover"
                onClick={() => {
                  const opening = !notificationOpen;
                  setNotificationOpen(opening);
                  if (opening) {
                    markAllNotificationsRead();
                    setNotificationRefresh((current) => current + 1);
                  }
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:h-11 sm:w-11"
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
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <section
                  id="dashboard-notification-popover"
                  aria-label="Recent notifications"
                  className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl"
                >
                  <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Notifications
                    </h2>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  </header>
                  {notificationError && (
                    <p
                      role="status"
                      className="px-4 py-2 text-xs text-amber-700"
                    >
                      {notificationError}
                    </p>
                  )}
                  {recentNotifications.length ? (
                    <ul className="max-h-[22rem] divide-y divide-slate-100 overflow-y-auto">
                      {recentNotifications.map((item) => (
                        <li key={item.key} className="flex gap-3 px-4 py-3">
                          <span
                            aria-hidden="true"
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.status === "Pending review" ? "bg-amber-500" : "bg-blue-500"}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800">
                                {item.title}
                              </p>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${item.status === "Pending review" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-600">
                              {item.detail}
                            </p>
                            <time
                              className="mt-1 block text-[10px] text-slate-400"
                              dateTime={item.createdAt}
                            >
                              {Number.isNaN(Date.parse(item.createdAt))
                                ? "Date unavailable"
                                : new Date(item.createdAt).toLocaleString()}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">
                      No recent notifications.
                    </p>
                  )}
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setNotificationOpen(false)}
                    className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-blue-700 hover:bg-slate-50"
                  >
                    View all notifications
                  </Link>
                </section>
              )}
            </div>
            <span className="hidden h-9 border-l border-slate-200 sm:block" />
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white py-1.5 pl-3 pr-1.5 shadow-sm sm:gap-3 sm:pl-3.5 sm:pr-2">
              <span className="hidden text-right sm:block">
                <span className="block max-w-40 truncate text-sm font-semibold text-slate-800">
                  {user?.displayName || "Admin User"}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {user?.role || "ADMIN"}
                </span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-[0_4px_10px_rgba(37,99,235,0.24)] ring-2 ring-blue-100">
                {user?.displayName?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
          </div>
        </header>
        <nav
          aria-label="Mobile dashboard navigation"
          className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden"
        >
          {visibleNavigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setActiveHref(item.href)}
              aria-current={activeHref === item.href ? "page" : undefined}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${activeHref === item.href ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => {
              void handleLogout();
            }}
            className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </nav>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
