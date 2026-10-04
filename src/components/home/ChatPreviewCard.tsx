import { CheckCheck, FileText, MessageCircle, ShieldCheck } from "lucide-react";

interface PreviewMessage {
  incoming: boolean;
  text: string;
}

const previewMessages: PreviewMessage[] = [
  {
    incoming: true,
    text: "Assalamu alaikum, ustadh. I have a question about today's lesson.",
  },
  { incoming: false, text: "Wa alaikum assalam. Of course, how can I help?" },
  {
    incoming: true,
    text: "Could you please share the notes for the next topic?",
  },
  {
    incoming: false,
    text: "Certainly — I've attached the reading material here.",
  },
];

export default function ChatPreviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-[530px]">
      <div
        aria-hidden="true"
        className="absolute -inset-5 rounded-[2.5rem] bg-[var(--rahmah-primary-soft)]/80 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] border border-[var(--rahmah-primary-soft)] bg-white shadow-[0_30px_90px_rgba(13,74,99,.12)]">
        <div className="flex h-14 items-center justify-between border-b border-[var(--rahmah-primary-soft)] bg-[var(--rahmah-primary-soft)] px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1565d8] text-xs font-semibold text-white">
              UT
            </span>
            <div>
              <p className="text-xs font-semibold text-[var(--rahmah-text)]">
                Ustadh Tariq
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--rahmah-muted)]">
                Verified teacher · online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--rahmah-accent)]" />
            <span className="text-[10px] font-medium text-[var(--rahmah-muted)]">
              Secure chat
            </span>
          </div>
        </div>
        <div className="whatsapp-wallpaper flex min-h-[290px] sm:min-h-[310px] flex-col gap-3 px-3 py-4 sm:px-6 sm:py-5">
          <div className="mx-auto mb-1 rounded-lg bg-white/90 px-3 py-1.5 text-[10px] font-medium text-[var(--rahmah-muted)] shadow-sm">
            Today
          </div>
          {previewMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.incoming ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`relative max-w-[88%] sm:max-w-[78%] rounded-xl border px-3 py-2.5 text-[11px] leading-[18px] shadow-sm ${
                  message.incoming
                    ? "rounded-tl-none border-transparent bg-white text-[var(--rahmah-text)]"
                    : "rounded-tr-none border-[var(--rahmah-primary-soft)] bg-[var(--rahmah-primary-soft)] text-[var(--rahmah-text)]"
                }`}
              >
                <p>{message.text}</p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[var(--rahmah-muted)]">
                  <span>{index < 2 ? "10:24 AM" : "10:26 AM"}</span>
                  {!message.incoming && (
                    <CheckCheck className="h-3 w-3 text-[var(--rahmah-accent)]" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="ml-auto flex max-w-[88%] sm:max-w-[78%] items-center gap-2 rounded-xl border border-[var(--rahmah-primary-soft)] bg-[var(--rahmah-primary-soft)] px-3 py-2 text-[10px] text-[var(--rahmah-text)] shadow-sm">
            <FileText className="h-4 w-4 text-[#1565d8] shrink-0" />
            <span className="truncate">Lesson-notes.pdf</span>
            <span className="text-[var(--rahmah-muted)] shrink-0">
              · 1.2 MB
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 border-t border-[var(--rahmah-primary-soft)] bg-[var(--rahmah-primary-soft)] px-3 sm:px-4 py-3">
          <MessageCircle className="h-4 w-4 text-[#1565d8] shrink-0" />
          <div className="h-9 flex-1 rounded-lg bg-white px-3 py-2 text-[10px] sm:text-xs text-[var(--rahmah-muted)] flex items-center">
            Type a message
          </div>
          <button
            type="button"
            aria-label="Send message"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1565d8] text-xs text-white shrink-0 hover:bg-[#078dca]"
          >
            ➤
          </button>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-xl border border-[var(--rahmah-primary-soft)] bg-white px-4 py-3 shadow-lg sm:flex">
        <ShieldCheck className="h-5 w-5 text-[#1565d8]" />
        <div>
          <p className="text-[10px] font-semibold text-[var(--rahmah-text)]">
            Institute verified
          </p>
          <p className="mt-0.5 text-[9px] text-[var(--rahmah-muted)]">
            A community you can trust
          </p>
        </div>
      </div>
    </div>
  );
}
