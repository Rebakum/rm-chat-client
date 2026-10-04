"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
  portalHref: string;
  chatHref: string;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Navbar({
  portalHref,
  chatHref,
  menuOpen,
  setMenuOpen,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[var(--rahmah-border)]">
      <div className="mx-auto flex h-[70px] sm:h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Rahmah Institute home"
          className="flex shrink-0 items-center gap-3"
        >
          <Image
            src="/Rahmah-Institute-Logo.png"
            alt="Rahmah Institute"
            width={160}
            height={34}
            priority
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </Link>

        {/* DESKTOP NAV LINKS */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 lg:flex xl:gap-8"
        >
          <a
            href="#features"
            className="text-sm font-medium text-[var(--rahmah-muted)] transition hover:text-[#1565d8]"
          >
            Features
          </a>
          <a
            href="#community-rules"
            className="text-sm font-medium text-[var(--rahmah-muted)] transition hover:text-[#1565d8]"
          >
            Community Rules
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-[var(--rahmah-muted)] transition hover:text-[#1565d8]"
          >
            About Institute
          </a>
          <Link
            href={portalHref}
            className="text-sm font-medium text-[var(--rahmah-muted)] transition hover:text-[#1565d8]"
          >
            Student Portal
          </Link>
        </nav>

        {/* DESKTOP CTA BUTTONS */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#1565d8] transition hover:bg-[var(--rahmah-primary-soft)]"
          >
            Student/Teacher Login
          </Link>
          <Link
            href={chatHref}
            className="inline-flex items-center gap-2 rounded-full bg-[#1565d8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#078dca]"
          >
            Launch Web Chat <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* MOBILE/TAB HAMBURGER BUTTON */}
        <button
          type="button"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#1565d8] hover:bg-[var(--rahmah-primary-soft)] lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* MOBILE/TAB DRAWER MENU */}
      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[var(--rahmah-border)] bg-white px-4 py-5 shadow-lg lg:hidden"
        >
          <div className="mx-auto w-full max-w-xl space-y-2">
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[var(--rahmah-text)] hover:bg-[var(--rahmah-primary-soft)]"
            >
              Features
            </a>
            <a
              href="#community-rules"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[var(--rahmah-text)] hover:bg-[var(--rahmah-primary-soft)]"
            >
              Community Rules
            </a>
            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[var(--rahmah-text)] hover:bg-[var(--rahmah-primary-soft)]"
            >
              About Institute
            </a>
            <Link
              href={portalHref}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[var(--rahmah-text)] hover:bg-[var(--rahmah-primary-soft)]"
            >
              Student Portal
            </Link>
            <div className="flex flex-col gap-2.5 pt-3 sm:flex-row sm:justify-center">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-[#1565d8] px-4 py-2.5 text-center text-sm font-semibold text-[#1565d8] hover:bg-[var(--rahmah-primary-soft)]"
              >
                Student/Teacher Login
              </Link>
              <Link
                href={chatHref}
                onClick={() => setMenuOpen(false)}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1565d8] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#078dca]"
              >
                Launch Web Chat
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
