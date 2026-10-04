import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import ChatPreviewCard from "./ChatPreviewCard";

interface HeroSectionProps {
  chatHref: string;
}

export default function HeroSection({ chatHref }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_45%,_rgba(45,182,212,0.12)_0%,_transparent_45%)]"
      />
      <div className="mx-auto grid min-h-[550px] sm:min-h-[650px] max-w-7xl items-center gap-10 sm:gap-12 px-4 py-10 sm:py-16 md:py-20 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#1565d8]">
            A trusted space for the Rahmah community
          </div>
          <h1 className="mt-5 sm:mt-7 text-3xl font-semibold leading-[1.18] tracking-[-0.03em] text-[var(--rahmah-text)] sm:text-4xl md:text-5xl lg:text-[56px]">
            Secure, respectful &amp; Islamic communication for{" "}
            <span className="text-[#1565d8]">Rahmah Institute.</span>
          </h1>
          <p className="mt-4 sm:mt-6 max-w-xl text-base leading-7 text-[var(--rahmah-muted)] sm:text-lg sm:leading-8">
            Connecting students and verified teachers in a safe, moderated, and
            efficient digital environment.
          </p>
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={chatHref}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#1565d8] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(21,101,216,.2)] transition hover:-translate-y-0.5 hover:bg-[#078dca]"
            >
              Start Chatting <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[var(--rahmah-primary-soft)] bg-white/80 px-6 py-3.5 text-sm font-semibold text-[var(--rahmah-text)] transition hover:border-[var(--rahmah-accent)] hover:bg-white"
            >
              Learn More <ArrowDown className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 sm:mt-9 flex items-center gap-3 text-xs text-[var(--rahmah-muted)]">
            <span className="flex -space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--rahmah-primary-soft)] text-[10px] font-bold text-[#1565d8]">
                S
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--rahmah-primary-soft)] text-[10px] font-bold text-[#1565d8]">
                T
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--rahmah-primary-soft)] text-[10px] font-bold text-[#1565d8]">
                R
              </span>
            </span>
            <span>Made for verified students and teachers</span>
          </div>
        </div>

        {/* CHAT PREVIEW CARD COMPONENT */}
        <ChatPreviewCard />
      </div>
    </section>
  );
}
