"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Circle,
  MessageCircle,
  Megaphone,
  Phone,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

interface ChatNavigationRailProps {
  user: { displayName: string; avatar: string | null };
  unreadCount: number;
  onLogout: () => void;
  logoutBusy: boolean;
}

const navigation: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Chats", icon: MessageCircle },
  { label: "Calls", icon: Phone },
  { label: "Status", icon: Circle },
  { label: "Channels", icon: Megaphone },
  { label: "Communities", icon: Users },
] as const;

export default function ChatNavigationRail({
  user,
  unreadCount,
  onLogout,
  logoutBusy,
}: ChatNavigationRailProps) {
  const [active, setActive] = useState("Chats");

  return (
    <nav aria-label="Primary navigation" className="hidden min-h-0 flex-col items-center border-r border-[#202c33] bg-[#202c33] py-4 text-[#aebac1] md:flex">
      <div className="flex w-full flex-col items-center gap-2">
        {navigation.map((item) => (
          <button key={item.label} type="button" title={item.label} aria-label={item.label} aria-current={active === item.label ? "page" : undefined} onClick={() => setActive(item.label)} className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${active === item.label ? "bg-[#374248] text-white" : "hover:bg-[#2a3942] hover:text-white"}`}>
            <item.icon className="h-[21px] w-[21px]" strokeWidth={1.7} />
            {item.label === "Chats" && unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary-500 px-1 text-[9px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center gap-3">
        <Link href="/dashboard/settings" title="Settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#2a3942] hover:text-white">
          <Settings className="h-[21px] w-[21px]" strokeWidth={1.7} />
        </Link>
        <button type="button" title={logoutBusy ? "Signing out" : `Sign out ${user.displayName}`} aria-label="Sign out" disabled={logoutBusy} onClick={onLogout} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#d9fdd3] text-xs font-semibold text-[#075e54] ring-2 ring-transparent hover:ring-white/50 disabled:opacity-60">
          {user.avatar ? <Image src={user.avatar} alt="" width={40} height={40} unoptimized className="h-full w-full object-cover" /> : user.displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
        </button>
      </div>
    </nav>
  );
}
