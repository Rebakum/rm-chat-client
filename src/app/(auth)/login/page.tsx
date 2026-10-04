"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/services/apiClient";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    setIsLoading(true);
    try {
      const user = await login(formData.email.trim(), formData.password);
      setFeedback({ message: "Login successful", type: "success" });
      const destination =
        user.role === "ADMIN" || user.role === "MODERATOR"
          ? "/dashboard"
          : "/chat";
      router.replace(destination);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sign in. Please try again.";
      setFeedback({ message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative isolate flex flex-1 items-center overflow-hidden bg-[var(--rahmah-surface)] px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_28%,_rgba(45,182,212,.13)_0%,_transparent_38%),radial-gradient(ellipse_at_87%_76%,_rgba(13,106,134,.08)_0%,_transparent_32%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 top-20 -z-10 h-64 w-64 rounded-full border border-[var(--rahmah-border)] opacity-70 sm:left-[8%] sm:top-24"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-20 -z-10 h-96 w-96 rounded-full border border-[var(--rahmah-border)] opacity-70"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
        <section className="hidden max-w-xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-full  text-xs font-semibold text-[#1565d8] shadow-sm">
            A trusted space for the Rahmah community
          </div>
          <h1 className="mt-7 text-5xl font-semibold leading-[1.12] tracking-[-0.04em] text-[var(--rahmah-text)] xl:text-[58px]">
            Learning grows stronger when we stay connected.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--rahmah-muted)]">
            A secure, respectful place for Rahmah Institute students and
            verified teachers to continue meaningful conversations.
          </p>
          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rahmah-primary-soft)] text-[var(--rahmah-primary)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--rahmah-text)]">
                Made for a verified community
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--rahmah-muted)]">
                Private conversations, guided by care and respect.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[440px]">
          <div className="mb-5 flex justify-center lg:hidden">
            <Image
              src="/Rahmah-Institute-Logo.png"
              alt="Rahmah Institute"
              width={190}
              height={40}
              priority
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="overflow-hidden rounded-[26px] border border-white/90 bg-white shadow-[0_24px_70px_rgba(11,77,99,.16)] ring-1 ring-[var(--rahmah-border)]/70">
            <header className="relative overflow-hidden bg-[var(--rahmah-primary-dark)] px-7 py-7 text-white sm:px-9 sm:py-8">
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-20 h-48 w-48 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="absolute -right-2 -top-12 h-32 w-32 rounded-full border border-white/10"
              />
              <div className="relative">
                <Image
                  src="/Rahmah-Institute-Logo.png"
                  alt="Rahmah Institute"
                  width={170}
                  height={36}
                  priority
                  className="h-8 w-auto rounded"
                />
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                  Student &amp; teacher portal
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[27px]">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-white/85">
                  Sign in to continue to your conversations.
                </p>
              </div>
            </header>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-7 sm:px-9 sm:py-8"
            >
              {feedback?.type === "success" && (
                <div
                  className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-900 shadow-lg"
                  role="status"
                  aria-live="polite"
                >
                  {feedback.message}
                </div>
              )}
              {feedback?.type === "error" && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                  aria-live="polite"
                >
                  {feedback.message}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData({ ...formData, email: event.target.value })
                }
                placeholder="you@example.com"
                className="!rounded-xl !border-[var(--rahmah-border)] !px-4 !py-3.5 text-sm placeholder:text-[var(--rahmah-muted)] focus:!border-[var(--rahmah-primary)] focus:!ring-4 focus:!ring-[var(--rahmah-accent)]/10"
                required
              />

              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(event) =>
                      setFormData({ ...formData, password: event.target.value })
                    }
                    placeholder="Your account password"
                    className="!rounded-xl !border-[var(--rahmah-border)] !py-3.5 pr-12 text-sm placeholder:text-[var(--rahmah-muted)] focus:!border-[var(--rahmah-primary)] focus:!ring-4 focus:!ring-[var(--rahmah-accent)]/10"
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--rahmah-muted)] transition hover:bg-[var(--rahmah-primary-soft)] hover:text-[var(--rahmah-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rahmah-accent)]/30"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[var(--rahmah-muted)]">
                  Use the password linked to your registered institute email.
                </p>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="group mt-1 min-h-12 w-full !rounded-xl !bg-[var(--rahmah-primary)] text-sm shadow-[0_8px_18px_rgba(13,106,134,.18)] hover:!-translate-y-0.5 hover:!bg-[var(--rahmah-primary-dark)] hover:shadow-[0_12px_24px_rgba(11,77,99,.24)] focus:!ring-[var(--rahmah-accent)]"
              >
                <span>Sign in securely</span>
                {!isLoading && (
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>

              <div className="flex items-start gap-3 border-t border-[var(--rahmah-border)] pt-5">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rahmah-primary)]" />
                <p className="text-xs leading-5 text-[var(--rahmah-muted)]">
                  Conversations may be reviewed by Rahmah moderators for safety
                  and quality.
                </p>
              </div>
            </form>
          </div>
          <p className="mt-5 text-center text-xs text-[var(--rahmah-muted)]">
            Access is reserved for registered Rahmah Institute students and
            teachers.
          </p>
        </section>
      </div>
    </main>
  );
}
