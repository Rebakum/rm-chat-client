"use client";

import type { ChatListEntry, DirectoryUser } from "@/services/chat.service";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CheckCheck, LogOut, MoreHorizontal, Plus, Search, Star } from "lucide-react";

interface ChatSidebarProps {
  currentUser: { displayName: string; avatar: string | null; role: string };
  chats: ChatListEntry[];
  users: DirectoryUser[];
  selectedUserId: string | null;
  loading: boolean;
  connected: boolean;
  presence: Record<string, { online: boolean; lastSeen: string }>;
  unreadCounts: Record<string, number>;
  onSelect: (user: DirectoryUser) => void;
  onLogout: () => void;
  logoutBusy: boolean;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const conversationTime = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.round(
    (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
};

function UserAvatar({
  user,
  online = false,
}: {
  user: Pick<DirectoryUser, "displayName" | "avatar">;
  online?: boolean;
}) {
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900">
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt=""
          fill
          sizes="48px"
          unoptimized
          className="object-cover"
        />
      ) : (
        initials(user.displayName)
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-accent-500"
          aria-label="Online"
        />
      )}
    </span>
  );
}

export default function ChatSidebar({
  currentUser,
  chats,
  users,
  selectedUserId,
  loading,
  connected,
  presence,
  unreadCounts,
  onSelect,
  onLogout,
  logoutBusy,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "favorites">("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rahmah-chat-favorites");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          setFavorites(parsed);
        }
      }
    } catch {
      setFavorites([]);
    }
  }, []);

  const toggleFavorite = (userId: string) => {
    setFavorites((current) => {
      const next = current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
      window.localStorage.setItem("rahmah-chat-favorites", JSON.stringify(next));
      return next;
    });
  };

  const chatUserIds = useMemo(
    () => new Set(chats.map((chat) => chat.participant.userId)),
    [chats]
  );

  const query = search.trim().toLowerCase();

  const filteredChats = useMemo(() => chats.filter((chat) => {
    const matchesQuery = `${chat.participant.displayName} ${chat.lastMessage?.text || ""}`
      .toLowerCase()
      .includes(query);
    const unread = Math.max(
      chat.unreadCount,
      unreadCounts[chat.participant.userId] || 0,
    );
    return matchesQuery &&
      (filter === "all" ||
        (filter === "unread" && unread > 0) ||
        (filter === "favorites" && favorites.includes(chat.participant.userId)));
  }), [chats, favorites, filter, query, unreadCounts]);

  // People section = directory members you have no conversation with yet
  // (or everyone matching the search while it is open).
  const newContacts = useMemo(
    () =>
      users.filter(
        (person) =>
          filter === "all" &&
          !chatUserIds.has(person.userId) &&
          (!query || person.displayName.toLowerCase().includes(query))
      ),
    [chatUserIds, filter, query, users]
  );

  return (
    <aside
      className={`min-h-0 flex-col border-r border-[#e9edef] bg-white ${
        selectedUserId ? "hidden md:flex" : "flex"
      }`}
    >
      <header className="relative flex h-[76px] shrink-0 items-center justify-between px-5">
        <h1 className="text-[21px] font-semibold tracking-tight text-[#111b21]">Chats</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Start a new chat"
            title="New chat"
            onClick={() => {
              setFilter("all");
              document.getElementById("chat-search")?.focus();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5]"
          >
            <Plus className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Chat list options"
            aria-expanded={optionsOpen}
            onClick={() => setOptionsOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5]"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {optionsOpen && (
            <div className="absolute right-3 top-14 z-20 w-48 rounded-lg bg-white py-1 shadow-[0_4px_16px_rgba(11,20,26,.18)]">
              <button type="button" onClick={() => { setFilter("all"); setOptionsOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm text-[#3b4a54] hover:bg-[#f5f6f6]">Show all chats</button>
              <button type="button" onClick={() => { setFavorites([]); window.localStorage.removeItem("rahmah-chat-favorites"); setOptionsOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm text-[#3b4a54] hover:bg-[#f5f6f6]">Clear favourites</button>
              <button
                type="button"
                disabled={logoutBusy}
                onClick={() => {
                  setOptionsOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#b42332] hover:bg-[#fff1f0] disabled:cursor-wait disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {logoutBusy ? "Signing out…" : "Log out"}
              </button>
            </div>
          )}
          <span className="sr-only">{currentUser.displayName} · {currentUser.role}</span>
          <span
            title={connected ? "Realtime connected" : "Connecting"}
            className={`absolute bottom-3 right-6 h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-400"}`}
          />
        </div>
      </header>

      <div className="px-3 pb-3">
        <label htmlFor="chat-search" className="sr-only">
          Search or start a new chat
        </label>
        <div className="flex h-9 items-center gap-4 rounded-lg bg-[#f0f2f5] px-3.5">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-[#54656f]" strokeWidth={2} />
          <input
            id="chat-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search or start a new chat"
            className="min-w-0 flex-1 bg-transparent text-xs text-[#111b21] outline-none placeholder:text-[#667781]"
          />
        </div>
        <div className="mt-3 flex gap-2 px-1">
          {([
            ["all", "All"],
            ["unread", "Unread"],
            ["favorites", "Favourites"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${filter === value ? "border-primary-500 bg-primary-50 text-primary-700" : "border-[#e9edef] text-[#54656f] hover:bg-[#f5f6f6]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-500">Loading chats…</p>
        ) : (
          <>
            {filteredChats.map((chat) => {
              const status = presence[chat.participant.userId];
              const online = status?.online ?? chat.participant.online;
              const unread = Math.max(
                chat.unreadCount,
                unreadCounts[chat.participant.userId] || 0
              );
              const snippet = chat.lastMessage
                ? `${chat.lastMessage.mine ? "You: " : ""}${
                    chat.lastMessage.text ||
                    (chat.lastMessage.fileName
                      ? `📎 ${chat.lastMessage.fileName}`
                      : "Attachment")
                  }`
                : "Say salam — start the conversation";
              return (
                <div
                  key={chat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(chat.participant)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(chat.participant);
                    }
                  }}
                  aria-current={
                    selectedUserId === chat.participant.userId
                      ? "true"
                      : undefined
                  }
                  className={`group flex w-full items-center gap-3 border-b border-[#f0f2f5] px-4 py-3 text-left transition ${
                    selectedUserId === chat.participant.userId
                      ? "bg-[#f0f2f5]"
                      : "hover:bg-[#f5f6f6]"
                  }`}
                >
                  <UserAvatar user={chat.participant} online={Boolean(online)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[16px] font-normal text-[#111b21]">
                        {chat.participant.displayName}
                      </span>
                      {chat.participant.unavailable && (
                        <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700">
                          Unavailable
                        </span>
                      )}
                      <span
                        className={`shrink-0 text-[10px] ${
                          unread > 0 ? "font-medium text-primary-700" : "text-[#667781]"
                        }`}
                      >
                        {conversationTime(
                          chat.lastMessage?.timestamp || chat.updatedAt
                        )}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1 truncate text-[13px] text-[#667781]">
                        {chat.lastMessage?.mine && <CheckCheck aria-label="Sent" className="h-4 w-4 shrink-0 text-accent-500" />}
                        <span className="truncate">{snippet}</span>
                      </span>
                      <button type="button" aria-label={favorites.includes(chat.participant.userId) ? "Remove from favourites" : "Add to favourites"} title={favorites.includes(chat.participant.userId) ? "Remove favourite" : "Add favourite"} onClick={(event) => { event.stopPropagation(); toggleFavorite(chat.participant.userId); }} className={`shrink-0 rounded-full p-1 ${favorites.includes(chat.participant.userId) ? "text-primary-600" : "text-transparent group-hover:text-[#8696a0]"}`}><Star className={`h-4 w-4 ${favorites.includes(chat.participant.userId) ? "fill-current" : ""}`} /></button>
                      {unread > 0 && (
                        <span
                          className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white"
                          aria-label={`${unread} unread messages`}
                        >
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </span>
                  </span>
                </div>
              );
            })}

            {newContacts.length > 0 && (
              <div>
                <p className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {query ? "People" : "Start a new chat"}
                </p>
                {newContacts.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => onSelect(person)}
                    disabled={person.unavailable}
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
                  >
                    <UserAvatar
                      user={person}
                      online={Boolean(
                        presence[person.userId]?.online ?? person.online
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {person.displayName}
                      </span>
                      <span className={`mt-0.5 block truncate text-xs ${person.unavailable ? "text-red-600" : "capitalize text-slate-500"}`}>
                        {person.unavailable ? "Unavailable" : person.role.toLowerCase()}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!filteredChats.length && !newContacts.length && (
              <p className="px-5 py-8 text-sm text-slate-500">
                {query ? "No chats or people match your search." : "No conversations yet."}
              </p>
            )}
          </>
        )}
      </div>

      <nav
        aria-label="Account navigation"
        className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 p-3 md:hidden"
      >
        <a
          href="/"
          className="flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          Back to Home
        </a>
        <button
          type="button"
          disabled={logoutBusy}
          onClick={onLogout}
          className="rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          {logoutBusy ? "Signing out…" : "Logout"}
        </button>
      </nav>
    </aside>
  );
}
