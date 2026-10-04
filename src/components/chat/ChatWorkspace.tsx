'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import { useAuth } from '@/hooks/useAuth';

type MessageKind = 'text' | 'voice' | 'attachment';
type MessageSender = 'them' | 'me';

interface ChatMessage {
  id: string;
  sender: MessageSender;
  kind: MessageKind;
  text: string;
  time: string;
  duration?: string;
}

interface Conversation {
  id: string;
  name: string;
  subtitle: string;
  lastSeen: string;
  preview: string;
  time: string;
  unread: number;
  favorite: boolean;
  online: boolean;
  color: string;
  messages: ChatMessage[];
}

const initialConversations: Conversation[] = [
  {
    id: 'amina', name: 'Amina Yusuf', subtitle: 'Teacher · Quran Studies', lastSeen: 'today at 10:42', preview: 'I have shared the class notes.', time: '10:42', unread: 2, favorite: true, online: true, color: 'bg-rose-100 text-rose-800',
    messages: [
      { id: 'a1', sender: 'them', kind: 'text', text: 'Assalamu alaikum! I have shared the class notes for today.', time: '10:37' },
      { id: 'a2', sender: 'me', kind: 'text', text: 'Wa alaikum assalam, thank you. I will review them before class.', time: '10:39' },
      { id: 'a3', sender: 'them', kind: 'attachment', text: 'Lesson 04 · study notes.pdf', time: '10:42' },
    ],
  },
  {
    id: 'classroom', name: 'Arabic Level 2', subtitle: 'Group · 18 members', lastSeen: 'today at 10:18', preview: 'Hassan: See you all tomorrow', time: '10:18', unread: 5, favorite: true, online: false, color: 'bg-emerald-100 text-emerald-800',
    messages: [
      { id: 'b1', sender: 'them', kind: 'text', text: 'Reminder: our speaking practice starts at 9:00 tomorrow.', time: '10:04' },
      { id: 'b2', sender: 'me', kind: 'text', text: 'JazakAllahu khayran for the reminder.', time: '10:10' },
      { id: 'b3', sender: 'them', kind: 'voice', text: 'Voice message', time: '10:15', duration: '0:14' },
      { id: 'b4', sender: 'them', kind: 'text', text: 'See you all tomorrow.', time: '10:18' },
    ],
  },
  {
    id: 'sulaiman', name: 'Sulaiman Karim', subtitle: 'Student · Arabic Level 2', lastSeen: 'yesterday', preview: 'Could you explain exercise 3?', time: 'Yesterday', unread: 0, favorite: false, online: false, color: 'bg-sky-100 text-sky-800',
    messages: [
      { id: 'c1', sender: 'them', kind: 'text', text: 'Could you explain exercise 3 from the workbook?', time: 'Yesterday' },
      { id: 'c2', sender: 'me', kind: 'text', text: 'Of course. I will send you a short explanation after class.', time: 'Yesterday' },
    ],
  },
  {
    id: 'study-group', name: 'Quran Study Circle', subtitle: 'Group · 9 members', lastSeen: 'Monday', preview: 'Maryam: Recording is ready', time: 'Monday', unread: 0, favorite: false, online: false, color: 'bg-amber-100 text-amber-900',
    messages: [
      { id: 'd1', sender: 'them', kind: 'text', text: 'The recording from our study circle is ready.', time: 'Monday' },
      { id: 'd2', sender: 'them', kind: 'voice', text: 'Voice message', time: 'Monday', duration: '0:32' },
    ],
  },
];

const filters = ['All', 'Unread', 'Favorites'] as const;
type ConversationFilter = (typeof filters)[number];
const quickEmojis = ['🙂', '😊', '❤️', '👍', '✨', '🤲'];

const currentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

function BubbleTail({ outgoing }: { outgoing: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 12"
      className={`absolute top-0 h-3 w-2 ${outgoing ? '-right-[7px] scale-x-[-1] text-[#f5faeb]' : '-left-[7px] text-white'}`}
    >
      <path d="M8 0H0C1 4 3 8 8 12Z" fill="currentColor" />
    </svg>
  );
}

function Avatar({ name, color, online = false, src }: { name: string; color: string; online?: boolean; src?: string | null }) {
  return (
    <div className="relative shrink-0">
      <div role="img" aria-label={`${name} profile picture`} className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-xs font-semibold ${color}`}>
        {src ? <Image src={src} alt="" fill sizes="44px" unoptimized className="object-cover" /> : initials(name)}
      </div>
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-accent-500" aria-label="Online" />}
    </div>
  );
}

export default function ChatWorkspace() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialConversations[0].id);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ConversationFilter>('All');
  const [messageText, setMessageText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId);
  const visibleConversations = conversations.filter((conversation) => {
    const matchesSearch = `${conversation.name} ${conversation.subtitle} ${conversation.preview}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Unread' ? conversation.unread > 0 : conversation.favorite);
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeId, conversations]);

  const showNotice = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2800);
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    setMobileChatOpen(true);
    setConversations((current) => current.map((conversation) => conversation.id === id ? { ...conversation, unread: 0 } : conversation));
  };

  const addMessage = (message: ChatMessage) => {
    if (!activeConversation) return;
    const preview = message.kind === 'text' ? message.text : message.kind === 'voice' ? 'Voice message' : message.text;
    setConversations((current) => current.map((conversation) => conversation.id === activeConversation.id
      ? { ...conversation, messages: [...conversation.messages, message], preview, time: message.time }
      : conversation));
  };

  const sendMessage = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const text = messageText.trim();
    if (!text || !activeConversation) return;
    addMessage({ id: `message-${Date.now()}`, sender: 'me', kind: 'text', text, time: currentTime() });
    setMessageText('');
    setEmojiOpen(false);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeConversation) return;
    addMessage({ id: `file-${Date.now()}`, sender: 'me', kind: 'attachment', text: file.name, time: currentTime() });
    event.target.value = '';
  };

  const handleLogout = async () => {
    setLogoutBusy(true);
    await logout().catch(() => undefined);
    router.replace('/login');
    setLogoutBusy(false);
  };

  const toggleFavorite = () => {
    if (!activeConversation) return;
    setConversations((current) => current.map((conversation) => conversation.id === activeConversation.id
      ? { ...conversation, favorite: !conversation.favorite }
      : conversation));
  };

  return (
    <AuthGuard allowedRoles={['STUDENT', 'TEACHER']}>
      <div className="h-[100dvh] overflow-hidden bg-[#e9eeea] text-slate-800">
        <div className="mx-auto grid h-full w-full max-w-[1700px] grid-cols-1 overflow-hidden bg-white shadow-[0_20px_65px_rgba(18,44,32,0.12)] md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className={`${mobileChatOpen ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-slate-200 bg-white`}>
            <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-100 px-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={user?.displayName || 'Rahmah User'} color="bg-emerald-100 text-emerald-900" src={user?.avatar} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.displayName || 'Rahmah Chat'}</p>
                  <p className="text-xs text-emerald-700">Community inbox</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">{user?.role?.toLowerCase() || 'member'}</span>
            </header>

            <div className="border-b border-slate-100 p-4">
              <label className="sr-only" htmlFor="chat-search">Search conversations</label>
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2.5 text-slate-500 transition focus-within:ring-2 focus-within:ring-emerald-200">
                <span aria-hidden="true" className="text-lg leading-none">⌕</span>
                <input id="chat-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500" />
                {search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-900">×</button>}
              </div>
            </div>

            <div className="flex shrink-0 gap-2 border-b border-slate-100 px-4 py-3" role="tablist" aria-label="Conversation filters">
              {filters.map((option) => (
                <button key={option} type="button" role="tab" aria-selected={filter === option} onClick={() => setFilter(option)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === option ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {option}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {visibleConversations.length ? visibleConversations.map((conversation) => (
                <button key={conversation.id} type="button" onClick={() => selectConversation(conversation.id)} aria-current={activeId === conversation.id ? 'true' : undefined} className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition ${activeId === conversation.id ? 'bg-emerald-50/70' : 'hover:bg-slate-50'}`}>
                  <Avatar name={conversation.name} color={conversation.color} online={conversation.online} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{conversation.name}</span>
                      <span className={`shrink-0 text-[11px] ${conversation.unread ? 'font-semibold text-primary-700' : 'text-slate-400'}`}>{conversation.time}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">{conversation.preview}</span>
                      {conversation.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">{conversation.unread}</span>}
                    </span>
                  </span>
                </button>
              )) : <p className="px-5 py-10 text-center text-sm text-slate-500">No conversations match.</p>}
            </div>

            <nav aria-label="Account navigation" className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-white p-3">
              <Link href="/" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                <span aria-hidden="true">⌂</span> Back to Home Page
              </Link>
              <button type="button" disabled={logoutBusy} onClick={() => { void handleLogout(); }} className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-50">
                <span aria-hidden="true">⇥</span> {logoutBusy ? 'Signing out…' : 'Logout'}
              </button>
            </nav>
          </aside>

          <main className={`${mobileChatOpen ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-col bg-[#f7f5ef]`}>
            {activeConversation ? <>
              <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" aria-label="Back to conversations" onClick={() => setMobileChatOpen(false)} className="rounded-full p-2 text-slate-600 hover:bg-slate-100 md:hidden">‹</button>
                  <Avatar name={activeConversation.name} color={activeConversation.color} online={activeConversation.online} />
                  <div className="min-w-0">
                    <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{activeConversation.name}</h1>
                    <p className="truncate text-xs text-slate-500">{activeConversation.online ? 'online now' : `last seen ${activeConversation.lastSeen}`}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <button type="button" title="Voice call" aria-label="Voice call" onClick={() => showNotice('Voice calling is not available yet.')} className="rounded-full p-2.5 text-emerald-800 transition hover:bg-emerald-50">☎</button>
                  <button type="button" title="Video call" aria-label="Video call" onClick={() => showNotice('Video calling is not available yet.')} className="rounded-full p-2.5 text-emerald-800 transition hover:bg-emerald-50">▣</button>
                  <button type="button" title={activeConversation.favorite ? 'Remove favorite' : 'Add favorite'} aria-label={activeConversation.favorite ? 'Remove favorite' : 'Add favorite'} onClick={toggleFavorite} className={`rounded-full p-2.5 transition hover:bg-emerald-50 ${activeConversation.favorite ? 'text-amber-500' : 'text-slate-500'}`}>★</button>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_#f7f5ef_0%,_#f1eee5_70%,_#eeeade_100%)] px-3 py-5 sm:px-6" aria-label={`Messages with ${activeConversation.name}`}>
                <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-3">
                  <div className="flex justify-center pb-2">
                    <span className="rounded-full border border-white bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">Today</span>
                  </div>
                  {activeConversation.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      {message.kind === 'voice' ? (
                        <div className={`relative flex max-w-[85%] items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-sm sm:max-w-[70%] ${message.sender === 'me' ? 'rounded-tr-none border-[#dcecc5] bg-[#f5faeb]' : 'rounded-tl-none border-transparent bg-white'}`}>
                          <BubbleTail outgoing={message.sender === 'me'} />
                          <button type="button" aria-label={playingVoiceId === message.id ? 'Pause voice note preview' : 'Play voice note preview'} onClick={() => setPlayingVoiceId((playing) => playing === message.id ? null : message.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm text-white">{playingVoiceId === message.id ? 'Ⅱ' : '▶'}</button>
                          <div className="min-w-[100px] flex-1">
                            <div className="flex h-5 items-center gap-1" aria-label="Voice note waveform">
                              {Array.from({ length: 22 }, (_, index) => <span key={index} className={`w-1 rounded-full ${playingVoiceId === message.id && index < 10 ? 'bg-emerald-800' : 'bg-emerald-700/40'}`} style={{ height: `${7 + ((index * 7) % 13)}px` }} />)}
                            </div>
                            <p className="mt-1 text-[10px] text-slate-500">{playingVoiceId === message.id ? 'Previewing' : message.duration}</p>
                          </div>
                          <span className="self-end text-[10px] text-slate-400">{message.time}</span>
                        </div>
                      ) : message.kind === 'attachment' ? (
                        <div className={`relative max-w-[85%] rounded-2xl border p-2.5 shadow-sm sm:max-w-[70%] ${message.sender === 'me' ? 'rounded-tr-none border-[#dcecc5] bg-[#f5faeb]' : 'rounded-tl-none border-transparent bg-white'}`}>
                          <BubbleTail outgoing={message.sender === 'me'} />
                          <div className="flex min-w-[210px] items-center gap-3 rounded-xl border border-slate-200/80 bg-white/75 p-3">
                            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-lg text-emerald-900">▤</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-slate-800">{message.text}</span>
                              <span className="mt-1 block text-[10px] text-slate-500">Attachment</span>
                            </span>
                          </div>
                          <p className="mt-1 text-right text-[10px] text-slate-400">{message.time}</p>
                        </div>
                      ) : (
                        <div className={`relative max-w-[85%] rounded-2xl border px-3.5 py-2.5 shadow-sm sm:max-w-[70%] ${message.sender === 'me' ? 'rounded-tr-none border-[#dcecc5] bg-[#f5faeb]' : 'rounded-tl-none border-transparent bg-white'}`}>
                          <BubbleTail outgoing={message.sender === 'me'} />
                          <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">{message.text}</p>
                          <p className="mt-1 text-right text-[10px] text-slate-400">{message.time}{message.sender === 'me' ? <span className="ml-1 font-semibold text-blue-500">✓✓</span> : null}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {notice && <div role="status" className="border-t border-emerald-100 bg-emerald-50 px-4 py-2 text-center text-xs text-emerald-900">{notice}</div>}

              <form onSubmit={sendMessage} className="relative shrink-0 border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4">
                {emojiOpen && <div className="absolute bottom-[calc(100%-4px)] left-3 z-20 flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg" aria-label="Emoji picker">{quickEmojis.map((emoji) => <button key={emoji} type="button" onClick={() => setMessageText((text) => `${text}${emoji}`)} className="rounded-lg p-2 text-lg hover:bg-slate-100">{emoji}</button>)}</div>}
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} aria-label="Attach a file" />
                <div className="mx-auto flex max-w-5xl items-end gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 sm:gap-2 sm:p-2">
                  <button type="button" aria-label="Choose emoji" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((open) => !open)} className="mb-0.5 rounded-xl p-2 text-lg text-slate-500 transition hover:bg-white hover:text-emerald-800">☺</button>
                  <button type="button" aria-label="Attach a file" onClick={() => fileInputRef.current?.click()} className="mb-0.5 rounded-xl p-2 text-lg text-slate-500 transition hover:bg-white hover:text-emerald-800">＋</button>
                  <textarea aria-label="Type a message" value={messageText} onChange={(event) => setMessageText(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Write a message" rows={1} className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                  <button type="submit" disabled={!messageText.trim()} aria-label="Send message" className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300">➤</button>
                </div>
              </form>
            </> : <div className="hidden flex-1 items-center justify-center md:flex">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-900">R</div>
                <h1 className="mt-5 text-xl font-semibold text-slate-800">Your Rahmah conversations</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">Choose a conversation from the list to open your messages.</p>
              </div>
            </div>}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
