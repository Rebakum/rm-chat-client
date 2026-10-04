"use client";

import AuthGuard from "@/components/common/AuthGuard";
import { SocketProvider, useSocket } from "@/constants/SocketContext";
import { useAuth } from "@/hooks/useAuth";
import {
  chatService,
  toChatMessage,
  type ChatListEntry,
  type ChatMessage,
  type DirectoryUser,
} from "@/services/chat.service";
import { Minus, Square, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatBox from "./ChatBox";
import ChatNavigationRail from "./ChatNavigationRail";
import ChatSidebar from "./ChatSidebar";

function ChatDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const {
    socket,
    connected,
    presence,
    unreadCounts,
    clearUnread,
    setActiveChatId,
  } = useSocket();
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [chats, setChats] = useState<ChatListEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [windowControlError, setWindowControlError] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const appWindowRef = useRef<HTMLDivElement>(null);
  const selectionVersion = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const loadingOlderRef = useRef(false);
  const chatsRef = useRef<ChatListEntry[]>([]);
  const viewerId = user?.userId || user?.id || "";
  const totalUnread = chats.reduce(
    (total, chat) =>
      total +
      Math.max(chat.unreadCount, unreadCounts[chat.participant.userId] || 0),
    0,
  );

  useEffect(() => {
    activeChatIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  const refreshChats = useCallback(async () => {
    if (!viewerId) return;
    try {
      const response = await chatService.getChats(viewerId);
      setChats(response.data || []);
    } catch {
      // keep the current list; a later event or reload will retry
    }
  }, [viewerId]);

  useEffect(() => {
    if (!viewerId) return;
    let active = true;
    (async () => {
      const [chatsResult, directoryResult] = await Promise.allSettled([
        chatService.getChats(viewerId),
        chatService.getDirectory(),
      ]);
      if (!active) return;
      if (chatsResult.status === "fulfilled") {
        setChats(chatsResult.value.data || []);
      } else {
        setError(
          chatsResult.reason instanceof Error
            ? chatsResult.reason.message
            : "Unable to load your conversations.",
        );
      }
      if (directoryResult.status === "fulfilled") {
        setDirectory(directoryResult.value.data || []);
      } else {
        setError(
          directoryResult.reason instanceof Error
            ? directoryResult.reason.message
            : "Unable to load the people directory.",
        );
      }
      setDirectoryLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [viewerId]);

  // Fold an incoming message into the sidebar (snippet, order, unread badge).
  const applyIncomingToChats = useCallback(
    (payload: ChatMessage) => {
      const isActive = payload.chatId === activeChatIdRef.current;
      const known = chatsRef.current.some(
        (entry) => entry.id === payload.chatId,
      );
      if (!known) {
        void refreshChats();
        return;
      }
      setChats((current) => {
        const index = current.findIndex((entry) => entry.id === payload.chatId);
        if (index === -1) return current;
        const entry = current[index];
        const updated: ChatListEntry = {
          ...entry,
          lastMessage: {
            text: payload.text,
            type: payload.type,
            fileName: payload.fileName,
            timestamp: payload.timestamp,
            mine: payload.senderId === viewerId,
          },
          unreadCount:
            payload.senderId === viewerId || isActive
              ? 0
              : entry.unreadCount + 1,
          updatedAt: payload.timestamp,
        };
        return [updated, ...current.filter((_, i) => i !== index)];
      });
    },
    [refreshChats, viewerId],
  );

  const openConversation = useCallback(
    async (person: DirectoryUser) => {
      const version = ++selectionVersion.current;
      setSelectedUser(person);
      clearUnread(person.userId);
      setChatId(null);
      setMessages([]);
      setHasOlderMessages(false);
      setLoadingOlder(false);
      loadingOlderRef.current = false;
      setReplyTo(null);
      setError("");
      setMessageLoading(true);
      try {
        const chatResponse = await chatService.openDirect(person.userId);
        if (version !== selectionVersion.current || !chatResponse.data) return;
        const openedChatId = chatResponse.data.id;
        setChatId(openedChatId);
        const historyResponse = await chatService.getMessages(openedChatId);
        if (version === selectionVersion.current) {
          setMessages(historyResponse.data || []);
          setHasOlderMessages(Boolean(historyResponse.pagination?.hasMore));
        }
        // Reading the thread clears its server-side unread badge.
        void chatService.markRead(openedChatId).catch(() => undefined);
        setChats((current) => {
          const index = current.findIndex((entry) => entry.id === openedChatId);
          if (index === -1) return current;
          const entry = { ...current[index], unreadCount: 0 };
          return [entry, ...current.filter((_, i) => i !== index)];
        });
      } catch (requestError: unknown) {
        if (version === selectionVersion.current)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to open this conversation.",
          );
      } finally {
        if (version === selectionVersion.current) setMessageLoading(false);
      }
    },
    [clearUnread],
  );

  const loadOlderMessages = useCallback(async (): Promise<boolean> => {
    const targetChatId = chatId;
    const version = selectionVersion.current;
    const cursor = messages[0]?.id;
    if (
      !targetChatId ||
      !cursor ||
      !hasOlderMessages ||
      loadingOlderRef.current
    ) {
      return false;
    }

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const response = await chatService.getMessages(targetChatId, 50, cursor);
      if (
        version !== selectionVersion.current ||
        activeChatIdRef.current !== targetChatId
      ) {
        return false;
      }
      const olderMessages = response.data || [];
      setMessages((current) => {
        const currentIds = new Set(current.map((message) => message.id));
        return [
          ...olderMessages.filter((message) => !currentIds.has(message.id)),
          ...current,
        ];
      });
      setHasOlderMessages(Boolean(response.pagination?.hasMore));
      return olderMessages.length > 0;
    } catch (requestError: unknown) {
      if (version === selectionVersion.current) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load older messages.",
        );
      }
      return false;
    } finally {
      if (version === selectionVersion.current) {
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      }
    }
  }, [chatId, hasOlderMessages, messages]);

  // Realtime: messages arrive regardless of which chat is open (the sidebar
  // needs them too), typing + deletions only matter for the open thread.
  useEffect(() => {
    if (!socket) return;
    const onMessage = (raw: unknown) => {
      const payload = toChatMessage(raw as Parameters<typeof toChatMessage>[0]);
      applyIncomingToChats(payload);
      if (payload.chatId !== activeChatIdRef.current) return;
      setMessages((current) =>
        current.some((message) => message.id === payload.id)
          ? current
          : [...current, payload],
      );
    };
    const onTyping = (payload: { senderId: string; isTyping: boolean }) => {
      if (payload.senderId === selectedUser?.userId)
        setTyping(payload.isTyping);
    };
    const onDeleted = (payload: { messageId: string; chatId: string }) => {
      if (payload.chatId === activeChatIdRef.current) {
        setMessages((current) =>
          current.filter((message) => message.id !== payload.messageId),
        );
      }
      setReplyTo((current) =>
        current && current.id === payload.messageId ? null : current,
      );
    };
    const onMessageEdited = (raw: unknown) => {
      const updated = toChatMessage(
        raw as Parameters<typeof toChatMessage>[0],
      );
      if (updated.chatId !== activeChatIdRef.current) return;
      setMessages((current) =>
        current.map((message) => (message.id === updated.id ? updated : message)),
      );
      setReplyTo((current) => (current?.id === updated.id ? updated : current));
    };
    const onMessageReacted = (raw: unknown) => {
      const updated = toChatMessage(
        raw as Parameters<typeof toChatMessage>[0],
      );
      if (updated.chatId !== activeChatIdRef.current) return;
      setMessages((current) =>
        current.map((message) => (message.id === updated.id ? updated : message)),
      );
    };
    const onAccountStatusChanged = (payload: {
      userId: string;
      status: string;
    }) => {
      const unavailable =
        payload.status === "rejected" || payload.status === "banned";
      const updateParticipant = (person: DirectoryUser): DirectoryUser =>
        person.userId === payload.userId
          ? {
              ...person,
              unavailable,
              online: unavailable ? false : person.online,
            }
          : person;
      setDirectory((current) => current.map(updateParticipant));
      setSelectedUser((current) =>
        current ? updateParticipant(current) : current,
      );
      setChats((current) =>
        current.map((chat) => ({
          ...chat,
          participant: updateParticipant(chat.participant),
        })),
      );
    };
    socket.on("receive_message", onMessage);
    socket.on("typing", onTyping);
    socket.on("message_deleted", onDeleted);
    socket.on("message_edited", onMessageEdited);
    socket.on("message_reacted", onMessageReacted);
    socket.on("account_status_changed", onAccountStatusChanged);
    return () => {
      socket.off("receive_message", onMessage);
      socket.off("typing", onTyping);
      socket.off("message_deleted", onDeleted);
      socket.off("message_edited", onMessageEdited);
      socket.off("message_reacted", onMessageReacted);
      socket.off("account_status_changed", onAccountStatusChanged);
    };
  }, [applyIncomingToChats, selectedUser, socket]);

  // Room membership: join the open thread (and any room we were monitoring).
  useEffect(() => {
    if (!socket || !chatId) return;
    socket.emit("join_room", { chatId }, (response) => {
      if (!response.ok)
        setError(response.error || "Unable to join this conversation.");
    });
    return () => {
      socket.emit("leave_room", { chatId });
    };
  }, [chatId, socket]);

  const sendMessage = useCallback(
    async (text: string, file?: File, reply?: ChatMessage | null) => {
      if (!socket?.connected || !selectedUser || !chatId)
        throw new Error("Realtime connection is unavailable.");
      setSending(true);
      setError("");
      try {
        let filePayload: {
          fileUrl?: string;
          fileName?: string;
          type?: ChatMessage["type"];
        } = {};
        if (file) {
          const uploadResponse = await chatService.uploadFile(file);
          const uploaded = uploadResponse.data;
          if (!uploaded)
            throw new Error("File upload did not return a file URL.");
          const type: ChatMessage["type"] = file.type.startsWith("image/")
            ? "IMAGE"
            : file.type.startsWith("video/")
              ? "VIDEO"
              : file.type.startsWith("audio/")
                ? "AUDIO"
                : "FILE";
          filePayload = {
            fileUrl: uploaded.fileUrl,
            fileName: uploaded.fileName,
            type,
          };
        }
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "send_message",
            {
              chatId,
              receiverId: selectedUser.userId,
              text: text || undefined,
              type: filePayload.type || "TEXT",
              replyToId: reply?.id || undefined,
              ...filePayload,
            },
            (result: unknown) => {
              const response = result as {
                ok?: boolean;
                error?: string;
                message?: unknown;
              };
              if (!response.ok || !response.message) {
                reject(new Error(response.error || "Message was not sent."));
                return;
              }
              const stored = toChatMessage(
                response.message as Parameters<typeof toChatMessage>[0],
              );
              setMessages((current) =>
                current.some((message) => message.id === stored.id)
                  ? current
                  : [...current, stored],
              );
              applyIncomingToChats(stored);
              resolve();
            },
          );
        });
      } catch (sendError: unknown) {
        const message =
          sendError instanceof Error
            ? sendError.message
            : "Message was not sent.";
        setError(message);
        throw sendError;
      } finally {
        setSending(false);
      }
    },
    [applyIncomingToChats, chatId, selectedUser, socket],
  );

  const editMessage = useCallback(
    async (messageId: string, text: string) => {
      if (!socket?.connected) throw new Error("Realtime connection is unavailable.");
      try {
        await new Promise<void>((resolve, reject) => {
          socket.emit("edit_message", { messageId, text }, (response) => {
            if (!response.ok || !response.message) {
              reject(new Error(response.error || "Message was not updated."));
              return;
            }
            const updated = toChatMessage(
              response.message as Parameters<typeof toChatMessage>[0],
            );
            setMessages((current) =>
              current.map((message) => (message.id === updated.id ? updated : message)),
            );
            resolve();
          });
        });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Message was not updated.");
        throw requestError;
      }
    },
    [socket],
  );

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      if (!socket?.connected) throw new Error("Realtime connection is unavailable.");
      try {
        await new Promise<void>((resolve, reject) => {
          socket.emit("react_message", { messageId, emoji }, (response) => {
            if (!response.ok || !response.message) {
              reject(new Error(response.error || "Reaction was not saved."));
              return;
            }
            const updated = toChatMessage(
              response.message as Parameters<typeof toChatMessage>[0],
            );
            setMessages((current) =>
              current.map((message) => (message.id === updated.id ? updated : message)),
            );
            resolve();
          });
        });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Reaction was not saved.");
        throw requestError;
      }
    },
    [socket],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket?.connected || !selectedUser) return;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      socket.emit("typing", { receiverId: selectedUser.userId, isTyping });
      if (isTyping)
        typingTimer.current = setTimeout(
          () =>
            socket.emit("typing", {
              receiverId: selectedUser.userId,
              isTyping: false,
            }),
          1200,
        );
    },
    [selectedUser, socket],
  );

  const handleLogout = async () => {
    setLogoutBusy(true);
    await logout().catch(() => undefined);
    window.location.assign("/login");
  };

  const toggleMaximize = async () => {
    const appWindow = appWindowRef.current;
    if (!appWindow) return;
    setWindowControlError("");
    try {
      if (document.fullscreenElement === appWindow) {
        await document.exitFullscreen();
        setMaximized(false);
      } else {
        await appWindow.requestFullscreen();
        setMaximized(true);
      }
    } catch (controlError) {
      setWindowControlError(
        controlError instanceof Error
          ? controlError.message
          : "Fullscreen mode is unavailable in this browser.",
      );
    }
  };

  useEffect(() => {
    const syncFullscreen = () => {
      setMaximized(document.fullscreenElement === appWindowRef.current);
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  return (
    <div
      ref={appWindowRef}
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#d1d7db] text-[#111b21]"
    >
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-[#e4e7e9] bg-[#f0f2f5] pl-3">
        <Image
          src="/Rahmah-Institute-Logo.png"
          alt="Rahmah Institute"
          width={130}
          height={26}
          priority
          className="h-[22px] w-auto object-contain"
        />
        <div className="flex h-full items-stretch">
          <button
            type="button"
            title="Minimize"
            aria-label="Minimize chat window"
            onClick={() => setMinimized(true)}
            className="flex w-11 items-center justify-center text-[#3b4a54] transition hover:bg-[#e4e7e9]"
          >
            <Minus className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            title={maximized ? "Restore" : "Maximize"}
            aria-label={
              maximized ? "Restore chat window" : "Maximize chat window"
            }
            onClick={() => {
              void toggleMaximize();
            }}
            className="flex w-11 items-center justify-center text-[#3b4a54] transition hover:bg-[#e4e7e9]"
          >
            <Square className="h-[13px] w-[13px]" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            title="Close"
            aria-label="Close chat and return to home"
            onClick={() => router.push("/")}
            className="flex w-12 items-center justify-center text-[#3b4a54] transition hover:bg-[#e81123] hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </div>
      </header>
      {windowControlError && (
        <p
          role="alert"
          className="shrink-0 bg-amber-50 px-3 py-1 text-xs text-amber-800"
        >
          {windowControlError}
        </p>
      )}
      {minimized ? (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f0f2f5]">
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="rounded-xl border border-[#d1d7db] bg-white px-5 py-3 text-sm font-medium text-[#111b21] shadow-sm hover:bg-[#f7f8f8]"
          >
            Restore Rahmah Chat
          </button>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden bg-white md:grid-cols-[64px_320px_minmax(0,1fr)] lg:grid-cols-[64px_380px_minmax(0,1fr)] xl:grid-cols-[64px_400px_minmax(0,1fr)]">
          <ChatNavigationRail
            user={{
              displayName: user?.displayName || "Rahmah member",
              avatar: user?.avatar || null,
            }}
            unreadCount={totalUnread}
            onLogout={() => {
              void handleLogout();
            }}
            logoutBusy={logoutBusy}
          />
          <ChatSidebar
            currentUser={{
              displayName: user?.displayName || "Rahmah member",
              avatar: user?.avatar || null,
              role: user?.role || "STUDENT",
            }}
            chats={chats}
            users={directory}
            selectedUserId={selectedUser?.userId || null}
            loading={directoryLoading}
            connected={connected}
            presence={presence}
            unreadCounts={unreadCounts}
            onSelect={(person) => {
              void openConversation(person);
            }}
            onLogout={() => {
              void handleLogout();
            }}
            logoutBusy={logoutBusy}
          />
          <ChatBox
            user={selectedUser}
            messages={messages}
            loading={messageLoading}
            loadingOlder={loadingOlder}
            hasOlderMessages={hasOlderMessages}
            currentUserId={viewerId}
            online={
              selectedUser
                ? Boolean(presence[selectedUser.userId]?.online)
                : false
            }
            lastSeen={
              selectedUser
                ? presence[selectedUser.userId]?.lastSeen ||
                  selectedUser.lastSeen
                : null
            }
            typing={typing}
            sending={sending}
            replyTo={replyTo}
            onReply={setReplyTo}
            onCancelReply={() => setReplyTo(null)}
            onEditMessage={editMessage}
            onReactToMessage={reactToMessage}
            onSend={sendMessage}
            onTyping={sendTyping}
            onLoadOlder={loadOlderMessages}
            onBack={() => setSelectedUser(null)}
            error={error}
          />
        </div>
      )}
    </div>
  );
}

export default function ChatDashboard() {
  return (
    <AuthGuard allowedRoles={["STUDENT", "TEACHER"]}>
      <SocketProvider>
        <ChatDashboardContent />
      </SocketProvider>
    </AuthGuard>
  );
}
