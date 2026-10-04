"use client";

import Pagination from "@/components/Pagination";
import { adminService, type AuditLogEntry } from "@/services/admin.service";
import Link from "next/link";
import { useEffect, useState } from "react";

const notificationActions = new Set([
  "USER_CREATED",
  "USER_REGISTERED",
  "USER_FIRST_LOGIN",
  "USER_ACCEPTED",
  "USER_REJECTED",
]);
export default function NotificationsPage() {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminService
      .getAuditLogs(page, limit, "notifications")
      .then((response) => {
        if (!active) return;
        const filtered = (response.data || []).filter((event) =>
          notificationActions.has(event.action),
        );
        setEvents(filtered);
        setTotal(response.meta?.total ?? filtered.length);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load notification activity.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [limit, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">
          Notifications
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Invitation and access activity
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Registration, first-login, approval and rejection events recorded by the server.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p className="py-8 text-sm text-slate-500">Loading notifications…</p>
      ) : events.length ? (
        <div className="mt-3 divide-y divide-slate-100">
          {events.map((event) => (
            <article
              key={event.id}
              className="flex flex-wrap items-start justify-between gap-3 py-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {event.action === "USER_CREATED"
                    ? "Account invitation created"
                    : event.action === "USER_REGISTERED"
                      ? "New user registered"
                      : event.action === "USER_FIRST_LOGIN"
                        ? "New user first login"
                        : event.action === "USER_ACCEPTED"
                          ? "Account approved"
                          : "Account rejected"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {event.detail || "Access status changed."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  By {event.actor.displayName} ·{" "}
                  {event.actor.role.toLowerCase()}
                </p>
              </div>
              <time className="text-xs text-slate-500">
                {new Date(event.createdAt).toLocaleString()}
              </time>
            </article>
          ))}
        </div>
      ) : (
        <p className="py-8 text-sm text-slate-500">
          No invitation or access events recorded.
        </p>
      )}
      <div className="mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }}
        />
      </div>
      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="text-xs leading-5 text-slate-500">
          Email delivery outcomes are not persisted by the current server, so
          this view shows account activity rather than claiming delivery status.
        </p>
        <Link
          href="/dashboard/users"
          className="mt-3 inline-flex rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Open user management
        </Link>
      </div>
    </section>
  );
}
