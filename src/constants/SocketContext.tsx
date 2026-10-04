"use client";

import { useAuth } from "@/hooks/useAuth";
import { toChatMessage, type ChatMessage } from "@/services/chat.service";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";

interface Presence {
  online: boolean;
  lastSeen: string;
}

interface NewMessagePayload {
  chatId: string;
  senderId: string;
  receiverId: string | null;
  message: ChatMessage;
}

interface ServerEvents {
  receive_message: (message: ChatMessage) => void;
  new_message: (payload: NewMessagePayload) => void;
  message_edited: (message: ChatMessage) => void;
  message_reacted: (message: ChatMessage) => void;
  "admin:notification": (payload: {
    id: string;
    action: string;
    targetId: string;
    detail: string;
    createdAt: string;
  }) => void;
  account_status_changed: (payload: { userId: string; status: string }) => void;
  typing: (payload: { senderId: string; isTyping: boolean }) => void;
  user_status: (payload: {
    userId: string;
    online: boolean;
    lastSeen: string;
  }) => void;
  monitor_snapshot: (payload: {
    chatId: string;
    messages: ChatMessage[];
  }) => void;
  message_deleted: (payload: {
    messageId: string;
    chatId: string;
    deletedAt: string;
    deletedById: string | null;
    reason: string | null;
  }) => void;
}

interface ClientEvents {
  send_message: (
    payload: Record<string, unknown>,
    ack?: (response: unknown) => void,
  ) => void;
  edit_message: (
    payload: { messageId: string; text: string },
    ack?: (response: { ok: boolean; error?: string; message?: unknown }) => void,
  ) => void;
  react_message: (
    payload: { messageId: string; emoji: string },
    ack?: (response: { ok: boolean; error?: string; message?: unknown }) => void,
  ) => void;
  typing: (payload: { receiverId: string; isTyping: boolean }) => void;
  join_room: (
    payload: { chatId: string },
    ack?: (response: { ok: boolean; error?: string }) => void,
  ) => void;
  leave_room: (payload: { chatId: string }) => void;
  monitor_room: (
    payload: { chatId: string },
    ack?: (response: { ok: boolean; error?: string }) => void,
  ) => void;
  unmonitor_room: (payload: { chatId: string }) => void;
}

export type ChatSocket = Socket<ServerEvents, ClientEvents>;

interface SocketContextValue {
  socket: ChatSocket | null;
  connected: boolean;
  presence: Record<string, Presence>;
  notificationCount: number;
  unreadCounts: Record<string, number>;
  latestNotification: NewMessagePayload | null;
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  clearUnread: (userId: string) => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const playNotificationFallback = () => {
  if (typeof window === "undefined") return;

  const AudioCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtor) return;

  try {
    const audioContext = new AudioCtor();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(680, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      430,
      audioContext.currentTime + 0.14,
    );
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.035,
      audioContext.currentTime + 0.02,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.22,
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.24);
  } catch {
    // browser support is optional; ignore audio failures gracefully
  }
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const authenticatedUserId = user?.id;
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [latestNotification, setLatestNotification] =
    useState<NewMessagePayload | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (isLoading || !authenticatedUserId) return;
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    const connection: ChatSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
    });
    setSocket(connection);

    connection.on("connect", () => setConnected(true));
    connection.on("disconnect", () => setConnected(false));
    connection.on("connect_error", () => setConnected(false));
    connection.on("user_status", (payload) => {
      setPresence((current) => ({
        ...current,
        [payload.userId]: {
          online: payload.online,
          lastSeen: payload.lastSeen,
        },
      }));
    });
    connection.on("new_message", (payload) => {
      // Socket payloads arrive in backend naming; map once before anything
      // (badges, toasts, unread counters) reads the message.
      const message = toChatMessage(
        payload.message as Parameters<typeof toChatMessage>[0]
      );
      const normalized = { ...payload, message };
      const isCurrentChat =
        activeChatIdRef.current && payload.chatId === activeChatIdRef.current;
      const isVisible = document.visibilityState === "visible";
      if (
        message.senderId === user?.userId ||
        (isCurrentChat && isVisible)
      )
        return;

      setLatestNotification(normalized);
      setNotificationCount((current) => current + 1);
      setUnreadCounts((current) => ({
        ...current,
        [payload.senderId]: (current[payload.senderId] || 0) + 1,
      }));
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const sender = message.sender?.displayName || "New message";
        new Notification("Rahmah Chat", {
          body: `${sender}: ${message.text || message.fileName || "sent a file"}`,
        });
      }
      if (typeof window !== "undefined") {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.25;
        void audio.play().catch(() => playNotificationFallback());
      }
    });

    return () => {
      connection.removeAllListeners();
      connection.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [authenticatedUserId, isLoading, user?.userId]);

  const clearNotifications = useCallback(() => setNotificationCount(0), []);
  const clearUnread = (userId: string) => {
    setUnreadCounts((current) => {
      if (!current[userId]) return current;
      const next = { ...current };
      delete next[userId];
      return next;
    });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        presence,
        notificationCount,
        unreadCounts,
        latestNotification,
        activeChatId,
        setActiveChatId,
        clearUnread,
        clearNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
}
