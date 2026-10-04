"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface NavigationItem {
  label: string;
  href: string;
}

interface SidebarProps {
  user: { displayName?: string; role?: string } | null;
  visibleNavigation: NavigationItem[];
  activeHref: string;
  onLogout: () => void;
  loggingOut: boolean;
  notificationCount: number;
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function LogoMark() {
  return (
    <Image
      src="/ri_icon_192x192.png"
      alt=""
      width={36}
      height={36}
      className="h-9 w-9 rounded-full bg-white p-1 object-contain ring-1 ring-white/15 shadow-inner shadow-white/10"
    />
  );
}

const getItemGlyph = (href: string) => {
  if (href.includes("users")) return "◉";
  if (href.includes("moderation")) return "◌";
  if (href.includes("notifications")) return "◍";
  if (href.includes("settings")) return "⚙";
  if (href.includes("chat-monitor")) return "◫";
  return "◈";
};

export default function Sidebar({
  user,
  visibleNavigation,
  activeHref,
  onLogout,
  loggingOut,
  notificationCount,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("rahmah-sidebar-collapsed");
    setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("rahmah-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={[
        "hidden shrink-0 flex-col bg-[var(--rahmah-primary-dark)] text-white md:flex",
        collapsed ? "w-24" : "w-72",
        "min-h-screen border-r border-white/10",
      ].join(" ")}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
        >
          <LogoMark />
          {!collapsed && (
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-white/70">
                Rahmah
              </span>
              <span className="block text-sm font-semibold text-white">
                Institute
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((value) => !value)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </header>

      <nav aria-label="Dashboard navigation" className="mt-6 flex-1 space-y-1.5 px-3">
        {visibleNavigation.map((item) => {
          const isActive = activeHref === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                collapsed ? "justify-center px-2" : "",
                isActive
                  ? "bg-[var(--rahmah-accent)] text-white shadow-[0_10px_24px_rgba(45,182,212,0.25)]"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <span aria-hidden="true" className="relative flex h-5 w-5 items-center justify-center text-base">
                {getItemGlyph(item.href)}
                {item.href.includes("notifications") && notificationCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#ef4b73] px-1 text-[8px] font-bold text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </span>

              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 px-3 pb-4 pt-5">
        <Link
          href="/"
          className={[
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white",
            collapsed ? "justify-center px-2" : "",
          ].join(" ")}
        >
          <span aria-hidden="true" className="text-base">⌂</span>
          {!collapsed && "Back to Home Page"}
        </Link>

        <button
          type="button"
          disabled={loggingOut}
          onClick={onLogout}
          className={[
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
            collapsed ? "justify-center px-2" : "",
          ].join(" ")}
        >
          <span aria-hidden="true" className="text-base">⇥</span>
          {!collapsed && (loggingOut ? "Logging out…" : "Logout")}
        </button>
      </div>

      {!collapsed && user && (
        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-sm font-semibold text-white">
            {user.displayName || "User"}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
            {user.role || "ADMIN"}
          </p>
        </div>
      )}

      <footer className="border-t border-white/10 px-4 py-3">
        <p className="text-[11px] font-medium text-white/55">v2.0.4</p>
      </footer>
    </aside>
  );
}
