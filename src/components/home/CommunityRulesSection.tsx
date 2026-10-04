import { ArrowRight, BookOpen } from "lucide-react";

export default function CommunityRulesSection() {
  return (
    <section
      id="community-rules"
      className="scroll-mt-24 px-4 py-12 sm:py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 rounded-3xl border border-[var(--rahmah-primary-soft)] bg-white p-6 sm:p-10 md:grid-cols-[auto_1fr_auto] md:items-center shadow-sm">
        <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[var(--rahmah-primary-soft)] text-[#1565d8]">
          <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
        </span>
        <div>
          <p className="inline-flex items-center text-xs font-bold uppercase tracking-[0.18em] text-[#1565d8]">
            Community guidelines
          </p>
          <h2 className="mt-1.5 text-xl sm:text-2xl font-semibold text-[var(--rahmah-text)]">
            Knowledge shared with adab.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rahmah-muted)]">
            Keep conversations purposeful, kind, and connected to learning.
            Respect privacy, protect personal information, and follow institute
            guidance.
          </p>
        </div>
        <a
          href="#about"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1565d8] hover:text-[#078dca]"
        >
          About Rahmah <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
