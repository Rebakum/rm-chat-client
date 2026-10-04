import {
  LockKeyhole,
  LucideIcon,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
}

const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Verified connections",
    description:
      "Only authenticated students and teachers from the Rahmah Institute community can join and communicate.",
    tone: "bg-[var(--rahmah-primary-soft)] text-[#1565d8]",
  },
  {
    icon: LockKeyhole,
    title: "Moderated with care",
    description:
      "Thoughtful access controls and clear community standards help keep conversations respectful and secure.",
    tone: "bg-[var(--rahmah-primary-soft)] text-[#1565d8]",
  },
  {
    icon: MessageCircle,
    title: "Learning, in real time",
    description:
      "Share messages and academic resources with a fast, simple chat experience built for your institute.",
    tone: "bg-[var(--rahmah-primary-soft)] text-[#1565d8]",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-[#1565d8]">
            A better way to stay connected
          </p>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--rahmah-text)]">
            Built around trust, learning, and respect.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--rahmah-muted)] sm:text-base">
            A focused communication space designed to support the Rahmah
            Institute community.
          </p>
        </div>
        <div className="mt-10 sm:mt-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-[var(--rahmah-primary-soft)] bg-[var(--rahmah-surface)] p-5 sm:p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tone}`}
              >
                <feature.icon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-base sm:text-lg font-semibold text-[var(--rahmah-text)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--rahmah-muted)]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
