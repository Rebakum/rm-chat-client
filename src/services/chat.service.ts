import { apiClient } from "./apiClient";

export interface DirectoryUser {
  id: string;
  userId: string;
  displayName: string;
  avatar: string | null;
  role: "STUDENT" | "TEACHER" | "MODERATOR" | "ADMIN";
  lastSeen: string | null;
  online?: boolean;
  unavailable?: boolean;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string | null;
  text: string | null;
  type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
  fileUrl: string | null;
  fileName: string | null;
  timestamp: string;
  status: "SENT" | "DELIVERED" | "SEEN";
  isEdited: boolean;
  reactions: Array<{ userId: string; emoji: string }>;
  sender?: {
    name: string;
    displayName: string;
    avatar: string | null;
    role: DirectoryUser["role"];
  };
  replyTo?: ChatMessage | null;
}

export interface MessageEditHistoryEntry {
  id: string;
  previousText: string;
  editedById: string | null;
  editedAt: string;
}

export interface DirectChat {
  id: string;
  participant: DirectoryUser;
}

export interface ChatListEntry {
  id: string;
  participant: DirectoryUser;
  lastMessage: {
    text: string | null;
    type: string;
    fileName: string | null;
    timestamp: string;
    mine: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface MonitorRoom {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  flaggedAt: string | null;
  lastMessageAt: string | null;
  members: Array<{ user: DirectoryUser }>;
  messages: ChatMessage[];
}

// ---- raw → UI shape mapping --------------------------------------------
// The backend speaks Prisma naming (camelCase fields, lowercase enums,
// photoURL, `name`); the UI speaks DirectoryUser/ChatMessage. Every fetch
// funnels through these helpers so the components stay backend-agnostic.

interface RawMember {
  id?: string;
  name?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  image?: string | null;
  role?: string | null;
  status?: string | null;
  online?: boolean;
  lastSeen?: string | null;
  offlineAt?: string | null;
}

interface RawMessage {
  id?: string;
  chatId?: string;
  senderId?: string;
  receiverId?: string | null;
  text?: string | null;
  type?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  timestamp?: string;
  read?: boolean;
  isEdited?: boolean;
  reactions?: Array<{ userId: string; emoji: string }>;
  sender?: RawMember & { id?: string };
  replyTo?: RawMessage | null;
}

interface RawChat {
  id?: string;
  member1Id?: string;
  member2Id?: string;
  member1?: RawMember;
  member2?: RawMember;
  messages?: RawMessage[];
  unreadCount?: number;
  updatedAt?: string;
  createdAt?: string;
}

const ROLE_MAP: Record<string, DirectoryUser["role"]> = {
  admin: "ADMIN",
  moderator: "MODERATOR",
  teacher: "TEACHER",
  student: "STUDENT",
};

export const toDirectoryUser = (raw: RawMember): DirectoryUser => ({
  id: raw.id || "",
  userId: raw.id || "",
  displayName: raw.displayName || raw.name || "Member",
  avatar: raw.photoURL ?? raw.image ?? null,
  role: raw.role ? ROLE_MAP[raw.role.toLowerCase()] || "STUDENT" : "STUDENT",
  lastSeen: raw.lastSeen ?? raw.offlineAt ?? null,
  online: Boolean(raw.online),
  unavailable: raw.status === "rejected" || raw.status === "banned",
});

const toMessageType = (
  raw: RawMessage
): ChatMessage["type"] => {
  const type = (raw.type || "text").toLowerCase();
  if (type === "order") return "FILE";
  if (type === "text") return "TEXT";
  const byName = `${raw.fileName || ""}${raw.fileUrl || ""}`;
  if (type === "file") {
    if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(byName)) return "IMAGE";
    if (/\.(mp4|webm|mov|mkv)$/i.test(byName)) return "VIDEO";
    if (/\.(mp3|wav|ogg|m4a)$/i.test(byName)) return "AUDIO";
    return "FILE";
  }
  return "FILE";
};

export const toChatMessage = (raw: RawMessage): ChatMessage => ({
  id: raw.id || "",
  chatId: raw.chatId || "",
  senderId: raw.senderId || "",
  receiverId: raw.receiverId ?? null,
  text: raw.text || null,
  type: toMessageType(raw),
  fileUrl: raw.fileUrl ?? null,
  fileName: raw.fileName ?? null,
  timestamp: raw.timestamp || new Date().toISOString(),
  status: raw.read ? "SEEN" : "DELIVERED",
  isEdited: Boolean(raw.isEdited),
  reactions: raw.reactions || [],
  sender: raw.sender
    ? {
        name: raw.sender.displayName || raw.sender.name || "Member",
        displayName:
          raw.sender.displayName || raw.sender.name || "Member",
        avatar: raw.sender.photoURL ?? raw.sender.image ?? null,
        role: raw.sender.role
          ? ROLE_MAP[raw.sender.role.toLowerCase()] || "STUDENT"
          : "STUDENT",
      }
    : undefined,
  replyTo: raw.replyTo ? toChatMessage(raw.replyTo) : undefined,
});

const toChatListEntry = (raw: RawChat, viewerId: string): ChatListEntry | null => {
  if (!raw.id || !raw.member1 || !raw.member2) return null;
  const mine = raw.member1Id === viewerId;
  const other = mine ? raw.member2 : raw.member1;
  const last = raw.messages?.[0];
  return {
    id: raw.id,
    participant: toDirectoryUser(other),
    lastMessage: last
      ? {
          text: last.text || null,
          type: last.type || "text",
          fileName: last.fileName ?? null,
          timestamp: last.timestamp || "",
          mine: last.senderId === viewerId,
        }
      : null,
    unreadCount: raw.unreadCount || 0,
    updatedAt: raw.updatedAt || raw.createdAt || "",
  };
};

const toMonitorRoom = (raw: RawChat): MonitorRoom | null => {
  if (!raw.id || !raw.member1 || !raw.member2) return null;
  return {
    id: raw.id,
    type: "DIRECT",
    name: null,
    flaggedAt: null,
    lastMessageAt: raw.updatedAt || null,
    members: [{ user: toDirectoryUser(raw.member1) }, { user: toDirectoryUser(raw.member2) }],
    messages: (raw.messages || []).map(toChatMessage),
  };
};

const getApiOrigin = () => {
  const configuredBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000";
  return new URL(configuredBase).origin;
};

export const normalizeAttachmentUrl = (fileUrl: string) => {
  try {
    const url = new URL(fileUrl, `${getApiOrigin()}/`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
};

export const getMessageFileUrl = (chatId: string, messageId: string) => {
  const origin = getApiOrigin();
  return `${origin}/api/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/file`;
};

export const chatService = {
  async getDirectory(search?: string) {
    const params = search?.trim() ? { search: search.trim() } : undefined;
    const response = await apiClient.get<RawMember[]>("/chats/directory", params);
    return { ...response, data: (response.data || []).map(toDirectoryUser) };
  },

  // Recent conversations for the WhatsApp-style sidebar.
  async getChats(userId: string) {
    const response = await apiClient.get<RawChat[]>(
      `/chats/${encodeURIComponent(userId)}`
    );
    const entries = (response.data || [])
      .map((raw) => toChatListEntry(raw, userId))
      .filter((entry): entry is ChatListEntry => Boolean(entry));
    return { ...response, data: entries };
  },

  async openDirect(userId: string) {
    const response = await apiClient.post<RawChat>(
      `/chats/direct/${encodeURIComponent(userId)}`,
      {}
    );
    const raw = response.data;
    const other =
      raw && raw.member1Id === userId ? raw.member1 : raw?.member2;
    return {
      ...response,
      data: raw
        ? {
            id: raw.id || "",
            participant: other ? toDirectoryUser(other) : toDirectoryUser({ id: userId }),
          }
        : undefined,
    };
  },

  async getMessages(chatId: string, limit = 50, before?: string) {
    const response = await apiClient.get<RawMessage[]>(
      `/chats/${encodeURIComponent(chatId)}/messages`,
      {
        limit: String(limit),
        ...(before ? { before } : {}),
      }
    );
    return { ...response, data: (response.data || []).map(toChatMessage) };
  },

  // Opening a thread clears its unread badge (server-side read receipts).
  async markRead(chatId: string) {
    return apiClient.patch<null>(`/messages/${encodeURIComponent(chatId)}/read`, {});
  },

  async updateMessage(messageId: string, text: string) {
    const response = await apiClient.patch<RawMessage>(
      `/messages/${encodeURIComponent(messageId)}`,
      { text },
    );
    return {
      ...response,
      data: response.data ? toChatMessage(response.data) : undefined,
    };
  },

  async getMonitorRooms() {
    const response = await apiClient.get<RawChat[]>("/chats/monitor/rooms");
    const rooms = (response.data || [])
      .map(toMonitorRoom)
      .filter((room): room is MonitorRoom => Boolean(room));
    return { ...response, data: rooms };
  },

  async getMessageEditHistory(messageId: string) {
    return apiClient.get<MessageEditHistoryEntry[]>(
      `/chats/messages/${encodeURIComponent(messageId)}/edit-history`,
    );
  },

  async deleteMessage(messageId: string) {
    return apiClient.delete<{ messageId: string; chatId: string }>(
      `/chats/messages/${encodeURIComponent(messageId)}`
    );
  },

  async uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.postForm<{
      url?: string;
      fileUrl?: string;
      name?: string;
      fileName?: string;
    }>("/upload", form);
    const raw = response.data;
    return {
      ...response,
      data: raw
        ? {
            fileUrl: raw.url || raw.fileUrl || "",
            fileName: raw.fileName || raw.name || file.name,
            size: file.size,
          }
        : undefined,
    };
  },
};
