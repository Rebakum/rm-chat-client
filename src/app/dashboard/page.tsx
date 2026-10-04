"use client";

import MonitorBox from "@/components/chat/MonitorBox";
import { useSocket } from "@/constants/SocketContext";
import { useAuth } from "@/hooks/useAuth";
import { adminService } from "@/services/admin.service";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [usersTotal, setUsersTotal] = useState<number | null>(null);
  const [rejectedTotal, setRejectedTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([
      adminService.getUsers({ page: 1, limit: 1 }),
      adminService.getUsers({ page: 1, limit: 1, status: "REJECTED" }),
    ])
      .then(([allUsers, rejectedUsers]) => {
        if (!active) return;
        setUsersTotal(allUsers.meta?.total ?? 0);
        setRejectedTotal(rejectedUsers.meta?.total ?? 0);
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load overview data.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const cards = [
    {
      label: "Registered users",
      value:
        user?.role === "ADMIN"
          ? loading
            ? "…"
            : (usersTotal?.toLocaleString() ?? "—")
          : "Admin only",
      tone: "bg-blue-50 text-blue-800",
    },
    {
      label: "Rejected accounts",
      value:
        user?.role === "ADMIN"
          ? loading
            ? "…"
            : (rejectedTotal?.toLocaleString() ?? "—")
          : "Admin only",
      tone: "bg-red-50 text-red-800",
    },
    {
      label: "Realtime connection",
      value: connected ? "Connected" : "Offline",
      tone: connected
        ? "bg-emerald-50 text-emerald-800"
        : "bg-slate-100 text-slate-700",
    },
    {
      label: "Infrastructure API",
      value: error ? "Unavailable" : "Connected",
      tone: error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800",
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <section
        aria-label="Dashboard statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${card.tone}`}
            >
              {loading && card.value === "…" ? "Loading" : "Current"}
            </span>
            <p className="mt-4 text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {card.value}
            </p>
          </article>
        ))}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              Workspace
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Administration overview
            </h2>
          </div>
          <Link
            href="/dashboard/users"
            className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Manage users
          </Link>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Review access requests, supervise active conversations, and inspect
          moderation activity from the dedicated sections.
        </p>
      </section>
      <MonitorBox socket={socket} connected={connected} />
    </div>
  );
}
