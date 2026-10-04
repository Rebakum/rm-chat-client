"use client";

import {
  getMessageFileUrl,
  normalizeAttachmentUrl,
  type ChatMessage,
  type DirectoryUser,
} from "@/services/chat.service";
import Image from "next/image";
import {
  MoreHorizontal,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
  Download,
  Check,
  File,
  FileArchive,
  FileText,
  MoreVertical,
  Pencil,
  X,
} from "lucide-react";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

interface ChatBoxProps {
  user: DirectoryUser | null;
  messages: ChatMessage[];
  loading: boolean;
  loadingOlder: boolean;
  hasOlderMessages: boolean;
  currentUserId: string;
  online: boolean;
  lastSeen: string | null;
  typing: boolean;
  sending: boolean;
  replyTo: ChatMessage | null;
  onReply: (message: ChatMessage) => void;
  onCancelReply: () => void;
  onEditMessage: (messageId: string, text: string) => Promise<void>;
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>;
  onSend: (
    text: string,
    file?: File,
    reply?: ChatMessage | null,
  ) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onLoadOlder: () => Promise<boolean>;
  onBack: () => void;
  error: string;
}

const EMOJI_OPTIONS = [
  "😀", "😃", "😄", "😁", "😆", "😂", "🤣", "😊", "😍", "🥰",
  "😘", "😎", "🤔", "😮", "😢", "😭", "😡", "🙏", "🤲", "👍",
  "👎", "👏", "🙌", "❤️", "💙", "💚", "💯", "🎉", "✨", "🔥",
];
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];

const timeLabel = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
const dateLabel = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const fileExtension = (value?: string | null) => {
  if (!value) return "";
  const path = value.split(/[?#]/, 1)[0];
  return path.match(/\.([^.\\/]+)$/)?.[1]?.toLowerCase() || "";
};
const isImageAttachment = (message: ChatMessage) =>
  message.type === "IMAGE" ||
  /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(message.fileName || "") ||
  /\.(png|jpe?g|gif|webp|avif|bmp|svg)(?:[?#].*)?$/i.test(message.fileUrl || "");

// First URL in a text bubble → rendered as a tappable link preview chip.
const extractLink = (text: string | null) => {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) return null;
  const url = match[0].replace(/[.,);]+$/, "");
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // keep the raw match if it is not a parseable absolute URL
  }
  return { url, host };
};

function MessageStatusIcon({ status }: { status: ChatMessage["status"] }) {
  const isRead = status === "SEEN";
  const isDelivered = status === "DELIVERED" || isRead;
  return (
    <svg
      aria-label={isRead ? "Read" : isDelivered ? "Delivered" : "Sent"}
      role="img"
      viewBox={isDelivered ? "0 0 20 14" : "0 0 14 14"}
      className={`inline-block h-3.5 w-4 ${isRead ? "text-blue-500" : "text-slate-400"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m1 7 3.5 3.5L12 3" />
      {isDelivered && <path d="m7 7 3.5 3.5L18 3" />}
    </svg>
  );
}

function AttachmentCard({
  fileName,
  url,
}: {
  fileName: string;
  url: string | null;
}) {
  const extension = fileExtension(fileName);
  const Icon = ["zip", "rar", "7z", "tar", "gz"].includes(extension)
    ? FileArchive
    : ["pdf", "doc", "docx", "txt", "rtf"].includes(extension)
      ? FileText
      : File;

  return (
    <div className="flex w-full min-w-0 max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800" title={fileName}>
          {fileName}
        </p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {extension || "File"}
        </p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open or download ${fileName}`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary-700 px-3 text-xs font-semibold text-white transition hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Open</span>
        </a>
      )}
    </div>
  );
}

function MessageAttachment({
  message,
  url,
  onPreview,
}: {
  message: ChatMessage;
  url: string | null;
  onPreview: (url: string) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const fileName = message.fileName || `Attachment.${fileExtension(message.fileUrl) || "file"}`;
  const showImage = Boolean(url && isImageAttachment(message) && !imageFailed);

  if (showImage && url) {
    return (
      <div className="w-full min-w-0 max-w-sm space-y-2">
        <button
          type="button"
          onClick={() => onPreview(url)}
          aria-label={`Preview ${fileName}`}
          className="group block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left shadow-sm transition hover:border-primary-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Image
            src={url}
            alt={fileName}
            width={640}
            height={480}
            unoptimized
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-auto max-h-80 w-full object-contain transition duration-200 group-hover:scale-[1.02]"
          />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
        >
          <Download aria-hidden="true" className="h-3.5 w-3.5" />
          Open image
        </a>
      </div>
    );
  }

  return <AttachmentCard fileName={fileName} url={url} />;
}

function Avatar({ user }: { user: DirectoryUser }) {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900">
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt=""
          fill
          sizes="40px"
          unoptimized
          className="object-cover"
        />
      ) : (
        initials(user.displayName)
      )}
    </span>
  );
}

export default function ChatBox({
  user,
  messages,
  loading,
  loadingOlder,
  hasOlderMessages,
  currentUserId,
  online,
  lastSeen,
  typing,
  sending,
  replyTo,
  onReply,
  onCancelReply,
  onEditMessage,
  onReactToMessage,
  onSend,
  onTyping,
  onLoadOlder,
  onBack,
  error,
}: ChatBoxProps) {
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [actionPickerMessageId, setActionPickerMessageId] = useState<string | null>(null);
  const [actionMenuMessageId, setActionMenuMessageId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const restoreScrollRef = useRef<{
    height: number;
    top: number;
    lastMessageId: string | null;
  } | null>(null);
  const previousLastMessageIdRef = useRef<string | null>(null);
  const previousUserIdRef = useRef<string | null>(user?.userId ?? null);
  const previousLoadingRef = useRef(loading);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const restore = restoreScrollRef.current;
    if (restore) {
      restoreScrollRef.current = null;
      const latestMessageId = messages.at(-1)?.id ?? null;
      if (latestMessageId === restore.lastMessageId) {
        container.scrollTop =
          restore.top + (container.scrollHeight - restore.height);
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
      previousLastMessageIdRef.current = latestMessageId;
      previousUserIdRef.current = user?.userId ?? null;
      previousLoadingRef.current = loading;
      return;
    }

    const userId = user?.userId ?? null;
    const chatChanged = previousUserIdRef.current !== userId;
    const latestMessageId = messages.at(-1)?.id ?? null;
    const latestMessageChanged =
      latestMessageId !== null &&
      latestMessageId !== previousLastMessageIdRef.current;
    const historyFinishedLoading =
      previousLoadingRef.current && !loading && latestMessageId !== null;

    if (latestMessageChanged || historyFinishedLoading) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior:
          chatChanged || historyFinishedLoading || !previousLastMessageIdRef.current
            ? "auto"
            : "smooth",
      });
    }

    previousLastMessageIdRef.current = latestMessageId;
    previousUserIdRef.current = userId;
    previousLoadingRef.current = loading;
  }, [loading, messages, user?.userId]);

  const handleMessageScroll = () => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      container.scrollTop > 24 ||
      loading ||
      loadingOlder ||
      !hasOlderMessages ||
      restoreScrollRef.current
    ) {
      return;
    }

    restoreScrollRef.current = {
      height: container.scrollHeight,
      top: container.scrollTop,
      lastMessageId: messages.at(-1)?.id ?? null,
    };
    void onLoadOlder().then((loaded) => {
      if (!loaded) restoreScrollRef.current = null;
    });
  };

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if ((!draft.trim() && !attachment) || sending || user?.unavailable) return;
    try {
      await onSend(draft.trim(), attachment || undefined, replyTo);
    } catch {
      return;
    }
    setDraft("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onCancelReply();
    onTyping(false);
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    setAttachment(event.target.files?.[0] || null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const beginEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditDraft(message.text || "");
    setEditError("");
    setActionMenuMessageId(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditDraft("");
    setEditError("");
    setSavingEdit(false);
  };

  const saveEdit = async (messageId: string) => {
    const text = editDraft.trim();
    if (!text || savingEdit) return;
    setSavingEdit(true);
    setEditError("");
    try {
      await onEditMessage(messageId, text);
      cancelEdit();
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : "Unable to edit message.");
      setSavingEdit(false);
    }
  };

  if (!user) {
    return (
      <main className="hidden min-w-0 flex-1 items-center justify-center bg-[#f7f5ef] md:flex">
        <div className="max-w-sm px-6 text-center">
          <Image
            src="/Rahmah-Institute-Logo.png"
            alt="Rahmah Institute"
            width={260}
            height={52}
            priority
            className="mx-auto h-auto w-56 object-contain"
          />
          <h1 className="mt-5 text-xl font-semibold text-slate-800">
            Rahmah Institute chat system
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Choose a teacher or student to open a private conversation.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#efeae2]">
      <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#e9edef] bg-[#f0f2f5] px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Back to directory"
            onClick={onBack}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            ‹
          </button>
          <Avatar user={user} />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {user.displayName}
            </h1>
            <p className="truncate text-xs text-slate-500">
              {typing
                ? "typing…"
                : online
                  ? "online"
                  : lastSeen
                    ? `last seen ${new Date(lastSeen).toLocaleString()}`
                    : user.role.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            title="Voice calling is not available yet"
            aria-label="Voice call unavailable"
            disabled
            className="cursor-not-allowed rounded-full p-2.5 text-[#54656f]"
          >
            <Phone className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            title="Video calling is not available yet"
            aria-label="Video call unavailable"
            disabled
            className="cursor-not-allowed rounded-full p-2.5 text-[#54656f]"
          >
            <Video className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <button type="button" aria-label="Search in conversation" title="Search" className="rounded-full p-2.5 text-[#54656f] hover:bg-black/5">
            <Search className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <button type="button" aria-label="More chat options" title="More options" className="rounded-full p-2.5 text-[#54656f] hover:bg-black/5">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        onScroll={handleMessageScroll}
        className="whatsapp-wallpaper min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6"
        aria-label={`Messages with ${user.displayName}`}
      >
        <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-3">
          {loadingOlder && (
            <p className="py-2 text-center text-xs text-slate-500">
              Loading older messages…
            </p>
          )}
          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading conversation…
            </p>
          )}
          {!loading &&
            messages.map((message, index) => {
              const currentDay = new Date(message.timestamp).toDateString();
              const previousDay = index > 0
                ? new Date(messages[index - 1].timestamp).toDateString()
                : null;
              const showDate = currentDay !== previousDay;
              const mine = message.senderId === currentUserId;
              const fileEndpointUrl = message.fileUrl
                ? getMessageFileUrl(message.chatId, message.id)
                : null;
              const isAbsoluteFileUrl = /^https?:\/\//i.test(message.fileUrl || "");
              const attachmentUrl = message.fileUrl
                ? isAbsoluteFileUrl
                  ? fileEndpointUrl
                  : normalizeAttachmentUrl(message.fileUrl)
                : null;
              const link = message.type === "TEXT"
                ? extractLink(message.text)
                : null;

              return (
                <Fragment key={message.id}>
                  {showDate && (
                    <div className="sticky top-2 z-[1] mx-auto my-2 rounded-lg bg-[#f0f2f5] px-3 py-1.5 text-[11px] font-medium text-[#54656f] shadow-sm">
                      {dateLabel(message.timestamp)}
                    </div>
                  )}
                  <div className={`group relative flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`absolute -top-10 z-20 flex max-w-[calc(100vw-2rem)] items-center gap-0.5 rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${mine ? "right-0" : "left-0"}`}
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={`React with ${emoji}`}
                        onClick={() => {
                          void onReactToMessage(message.id, emoji).catch(() => undefined);
                        }}
                        className="rounded-full p-1.5 text-base transition hover:scale-125 hover:bg-slate-100"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="More emoji reactions"
                      aria-expanded={actionPickerMessageId === message.id}
                      onClick={() => {
                        setActionMenuMessageId(null);
                        setActionPickerMessageId((current) =>
                          current === message.id ? null : message.id,
                        );
                      }}
                      className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary-700"
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Message actions"
                      aria-expanded={actionMenuMessageId === message.id}
                      onClick={() => {
                        setActionPickerMessageId(null);
                        setActionMenuMessageId((current) =>
                          current === message.id ? null : message.id,
                        );
                      }}
                      className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary-700"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {actionPickerMessageId === message.id && (
                      <div
                        role="group"
                        aria-label="Choose a reaction"
                        className={`absolute top-full mt-2 grid w-56 grid-cols-6 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ${mine ? "right-0" : "left-0"}`}
                      >
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            aria-label={`React with ${emoji}`}
                            onClick={() => {
                              setActionPickerMessageId(null);
                              void onReactToMessage(message.id, emoji).catch(() => undefined);
                            }}
                            className="rounded-lg p-1.5 text-lg hover:bg-slate-100"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    {actionMenuMessageId === message.id && (
                      <div
                        role="menu"
                        className={`absolute right-0 top-full mt-2 min-w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl`}
                      >
                        {mine && message.type === "TEXT" && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => beginEdit(message)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </button>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onReply(message);
                            setActionMenuMessageId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <span aria-hidden="true">↩</span> Reply
                        </button>
                      </div>
                    )}
                  </div>
                  <div
                    className={`relative max-w-[85%] rounded-lg border px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,.13)] sm:max-w-[70%] ${mine ? "rounded-tr-none border-[#dcecc5] bg-[#f5faeb]" : "rounded-tl-none border-transparent bg-white"}`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 8 12"
                      className={`absolute top-0 h-3 w-2 ${mine ? "-right-[7px] scale-x-[-1] text-[#f5faeb]" : "-left-[7px] text-white"}`}
                    >
                      <path d="M8 0H0C1 4 3 8 8 12Z" fill="currentColor" />
                    </svg>
                    {message.replyTo && (
                      <div className="mb-1.5 rounded-lg border-l-4 border-primary-500 bg-black/[0.06] px-2 py-1.5 text-left">
                        <p className="text-[11px] font-semibold text-primary-700">
                          {message.replyTo.senderId === currentUserId
                            ? "You"
                            : message.replyTo.sender?.displayName || "Reply"}
                        </p>
                        <p className="truncate text-xs text-slate-600">
                          {message.replyTo.text ||
                            message.replyTo.fileName ||
                            "Attachment"}
                        </p>
                      </div>
                    )}
                    {editingMessageId === message.id ? (
                      <div className="min-w-[min(18rem,70vw)] max-w-sm">
                        <textarea
                          autoFocus
                          aria-label="Edit message"
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelEdit();
                            } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                              event.preventDefault();
                              void saveEdit(message.id);
                            }
                          }}
                          rows={Math.min(5, Math.max(2, editDraft.split("\n").length))}
                          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                        />
                        {editError && (
                          <p role="alert" className="mt-1 text-xs text-red-600">
                            {editError}
                          </p>
                        )}
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveEdit(message.id)}
                            disabled={!editDraft.trim() || savingEdit}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-600 px-3 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {savingEdit ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : message.type === "AUDIO" && attachmentUrl ? (
                      <audio
                        controls
                        src={attachmentUrl}
                        className="w-full max-w-[min(18rem,70vw)]"
                      />
                    ) : message.type !== "TEXT" ? (
                      <MessageAttachment
                        message={message}
                        url={attachmentUrl}
                        onPreview={setPreviewUrl}
                      />
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap break-words text-[14px] leading-[19px] text-[#111b21]">
                          {message.text}
                        </p>
                        {link && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50/70 px-2 py-1 text-xs font-medium text-primary-800 hover:bg-primary-100"
                          >
                            <span aria-hidden="true">🔗</span>
                            <span className="truncate">{link.host}</span>
                          </a>
                        )}
                      </>
                    )}
                    {message.reactions.length > 0 && (
                      <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                        {Array.from(new Set(message.reactions.map((reaction) => reaction.emoji))).map((emoji) => {
                          const reactions = message.reactions.filter((reaction) => reaction.emoji === emoji);
                          const reactedByMe = reactions.some((reaction) => reaction.userId === currentUserId);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              aria-label={`${emoji}, ${reactions.length} reaction${reactions.length === 1 ? "" : "s"}`}
                              onClick={() => {
                                void onReactToMessage(message.id, emoji).catch(() => undefined);
                              }}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs shadow-sm transition ${reactedByMe ? "border-primary-300 bg-primary-50" : "border-slate-200 bg-white/90 hover:bg-slate-50"}`}
                            >
                              <span>{emoji}</span>
                              <span className="text-slate-600">{reactions.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="mt-1 text-right text-[10px] text-[#667781]">
                      <span className="inline-flex items-center justify-end gap-1">
                        {message.isEdited && <span className="italic">edited</span>}
                        {timeLabel(message.timestamp)}
                        {mine && <MessageStatusIcon status={message.status} />}
                      </span>
                    </p>
                  </div>
                </div>
                </Fragment>
              );
            })}
          {previewUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="absolute right-3 top-3 z-10 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white"
                >
                  Close
                </button>
                <Image
                  src={previewUrl}
                  alt="Attachment preview"
                  width={1200}
                  height={800}
                  unoptimized
                  className="h-auto max-h-[85vh] w-full rounded-xl object-contain"
                />
              </div>
            </div>
          )}
          {typing && (
            <p className="text-xs text-slate-500">
              {user.displayName} is typing…
            </p>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-xs text-red-800"
        >
          {error}
        </div>
      )}
      {user.unavailable ? (
        <div className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-4 text-center text-sm text-red-800">
          This user is unavailable. Messaging is disabled.
        </div>
      ) : <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="relative shrink-0 border-t border-[#e9edef] bg-[#f0f2f5] px-3 py-3 sm:px-5 sm:py-3"
      >
        {emojiOpen && (
          <div
            role="group"
            aria-label="Choose an emoji to insert"
            className="absolute bottom-[calc(100%-4px)] left-3 z-20 grid w-64 grid-cols-6 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          >
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`Insert ${emoji}`}
                onClick={() => {
                  setDraft((value) => `${value}${emoji}`);
                  setEmojiOpen(false);
                }}
                className="rounded-lg p-1.5 text-lg hover:bg-slate-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={selectFile}
          aria-label="Attach a file"
        />
        {replyTo && (
          <div className="mx-auto mb-2 flex max-w-5xl items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="min-w-0 flex-1 border-l-4 border-emerald-600 pl-2">
              <p className="text-[11px] font-semibold text-emerald-700">
                Replying to{" "}
                {replyTo.senderId === currentUserId
                  ? "yourself"
                  : replyTo.sender?.displayName || user?.displayName}
              </p>
              <p className="truncate text-xs text-slate-600">
                {replyTo.text || replyTo.fileName || "Attachment"}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Cancel reply"
              className="shrink-0 rounded-full bg-white px-2.5 py-1 text-sm text-slate-500 shadow-sm hover:bg-slate-100"
            >
              ×
            </button>
          </div>
        )}
        <div className="mx-auto flex max-w-5xl items-end gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Choose emoji"
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen((open) => !open)}
            className="rounded-full p-2 text-lg text-[#54656f] hover:bg-white hover:text-primary-600"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Attach a file"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2 text-lg text-[#54656f] hover:bg-white hover:text-primary-600"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            aria-label="Type a message"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              onTyping(Boolean(event.target.value));
            }}
            onKeyDown={handleKeyDown}
            placeholder={attachment?.name || "Type a message"}
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-y rounded-lg bg-white px-3 py-2.5 text-sm text-[#111b21] outline-none placeholder:text-[#667781]"
          />
          {attachment && (
            <button
              type="button"
              aria-label="Remove attachment"
              onClick={() => {
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-white"
            >
              ×
            </button>
          )}
          <button
            type="submit"
            disabled={(!draft.trim() && !attachment) || sending}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-[#aebac1]"
          >
            {sending ? "…" : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>}
    </main>
  );
}
