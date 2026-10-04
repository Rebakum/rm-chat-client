"use client";

import type { ChatSocket } from "@/constants/SocketContext";
import {
  chatService,
  toChatMessage,
  type ChatMessage,
  type MessageEditHistoryEntry,
  type MonitorRoom,
} from "@/services/chat.service";
import { useEffect, useState } from "react";

interface MonitorBoxProps {
  socket: ChatSocket | null;
  connected: boolean;
}

export default function MonitorBox({ socket, connected }: MonitorBoxProps) {
  const [rooms, setRooms] = useState<MonitorRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [historyMessageId, setHistoryMessageId] = useState<string | null>(null);
  const [messageEditHistory, setMessageEditHistory] = useState<
    MessageEditHistoryEntry[]
  >([]);
  const [loadingEditHistory, setLoadingEditHistory] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await chatService.getMonitorRooms();
        if (active) setRooms(response.data || []);
        if (active) setError("");
      } catch (requestError) {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load monitored rooms.",
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!socket || !activeRoomId) return;
    const onMessage = (raw: unknown) => {
      const message = toChatMessage(raw as Parameters<typeof toChatMessage>[0]);
      if (message.chatId !== activeRoomId) return;
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
    };
    const onDelete = (payload: { messageId: string; chatId: string }) => {
      if (payload.chatId !== activeRoomId) return;
      setMessages((current) =>
        current.filter((item) => item.id !== payload.messageId),
      );
    };
    const onEdit = (raw: unknown) => {
      const message = toChatMessage(raw as Parameters<typeof toChatMessage>[0]);
      if (message.chatId !== activeRoomId) return;
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? message : item)),
      );
      setRooms((current) =>
        current.map((room) =>
          room.id === activeRoomId
            ? {
                ...room,
                messages: room.messages.map((item) =>
                  item.id === message.id ? message : item,
                ),
              }
            : room,
        ),
      );
    };
    socket.on("receive_message", onMessage);
    socket.on("message_deleted", onDelete);
    socket.on("message_edited", onEdit);
    return () => {
      socket.off("receive_message", onMessage);
      socket.off("message_deleted", onDelete);
      socket.off("message_edited", onEdit);
    };
  }, [activeRoomId, socket]);

  const toggleEditHistory = async (messageId: string) => {
    if (historyMessageId === messageId) {
      setHistoryMessageId(null);
      return;
    }
    setHistoryMessageId(messageId);
    setMessageEditHistory([]);
    setLoadingEditHistory(true);
    try {
      const response = await chatService.getMessageEditHistory(messageId);
      setMessageEditHistory(response.data || []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load message edit history.",
      );
    } finally {
      setLoadingEditHistory(false);
    }
  };

  const monitor = async (room: MonitorRoom) => {
    if (!socket?.connected) {
      setError("Realtime connection is unavailable.");
      return;
    }
    if (activeRoomId) socket.emit("unmonitor_room", { chatId: activeRoomId });
    setActiveRoomId(room.id);
    try {
      const history = await chatService.getMessages(room.id, 100);
      setMessages(history.data || []);
      socket.emit("monitor_room", { chatId: room.id }, (response) => {
        if (!response.ok)
          setError(response.error || "Unable to monitor this room.");
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load room history.",
      );
    }
  };

  const deleteMessage = async (messageId: string) => {
    setDeletingMessageId(messageId);
    setError("");
    try {
      await chatService.deleteMessage(messageId);
      setMessages((current) => current.filter((item) => item.id !== messageId));
      setRooms((current) =>
        current.map((room) => {
          if (room.id !== activeRoomId) return room;
          return {
            ...room,
            messages: room.messages.filter((item) => item.id !== messageId),
          };
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete that message.",
      );
    } finally {
      setDeletingMessageId(null);
    }
  };

  return (
    <section
      className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      aria-label="Live chat monitor"
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">
              Supervision
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Active chat rooms
            </h2>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${connected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
          >
            {connected ? "Live" : "Offline"}
          </span>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-500">Loading active rooms…</p>
          ) : rooms.length ? (
            rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  void monitor(room);
                }}
                className={`w-full rounded-xl border p-3 text-left transition ${activeRoomId === room.id ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-800">
                    {room.members
                      .map((member) => member.user.displayName)
                      .join(" · ") ||
                      room.name ||
                      "Group room"}
                  </span>
                  {room.flaggedAt && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Flagged
                    </span>
                  )}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {room.messages[0]?.text ||
                    room.messages[0]?.fileName ||
                    room.messages[0]?.type.toLowerCase() ||
                    "No preview"}
                </span>
                <span className="mt-1 block text-[10px] text-slate-400">
                  {room.lastMessageAt
                    ? new Date(room.lastMessageAt).toLocaleString()
                    : "No recent activity"}
                </span>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500">No active chat rooms.</p>
          )}
        </div>
      </div>
      <div className="min-h-[220px] rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">
          {activeRoomId ? "Live conversation" : "Select a room to monitor"}
        </h3>
        <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto">
          {messages.length ? (
            messages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold text-emerald-800">
                    {message.sender?.name || "Unknown sender"}
                  </p>
                  <button
                    type="button"
                    disabled={deletingMessageId === message.id}
                    onClick={() => {
                      void deleteMessage(message.id);
                    }}
                    className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 disabled:opacity-50"
                  >
                    {deletingMessageId === message.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                  {message.text ||
                    message.fileName ||
                    message.type.toLowerCase()}
                </p>
                {message.isEdited && (
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => void toggleEditHistory(message.id)}
                      className="text-[10px] font-semibold text-blue-700 hover:text-blue-900"
                    >
                      {historyMessageId === message.id
                        ? "Hide edit history"
                        : "View edit history"}
                    </button>
                    {historyMessageId === message.id && (
                      <div className="mt-2 space-y-2">
                        {loadingEditHistory ? (
                          <p className="text-xs text-slate-500">Loading history…</p>
                        ) : messageEditHistory.length ? (
                          messageEditHistory.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-md bg-amber-50 p-2"
                            >
                              <p className="whitespace-pre-wrap break-words text-xs text-slate-700">
                                {entry.previousText}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-500">
                                Edited {new Date(entry.editedAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">
                            No previous versions are recorded.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-1 text-right text-[10px] text-slate-400">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No messages in the selected room yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
