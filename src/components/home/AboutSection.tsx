import { ArrowRight, UsersRound } from "lucide-react";
import Link from "next/link";

interface AboutSectionProps {
  portalHref: string;
}

export default function AboutSection({ portalHref }: AboutSectionProps) {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-[var(--rahmah-primary-soft)]/40 px-4 py-12 sm:py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[#1565d8]">
            <UsersRound className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-[0.18em]">
              Rahmah Institute
            </p>
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--rahmah-text)]">
            Supporting meaningful connection in Islamic education.
          </h2>
          <p className="mt-2.5 text-sm leading-6 text-[var(--rahmah-muted)]">
            Rahmah Web Chat helps institute students and teachers communicate in
            a dedicated, moderated space for learning and academic support.
          </p>
        </div>
        <Link
          href={portalHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#1565d8] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#078dca]"
        >
          Student Portal <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
