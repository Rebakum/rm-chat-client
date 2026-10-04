"use client";

import AboutSection from "@/components/home/AboutSection";
import CommunityRulesSection from "@/components/home/CommunityRulesSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import Footer from "@/components/home/Footer";
import HeroSection from "@/components/home/HeroSection";
import Navbar from "@/components/home/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function Home() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const [menuOpen, setMenuOpen] = useState(false);

  const chatHref = user ? "/chat" : "/login";
  const portalHref =
    user?.role === "ADMIN" || user?.role === "MODERATOR"
      ? "/dashboard"
      : user
        ? "/chat"
        : "/login";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--rahmah-surface)] text-[var(--rahmah-text)]">
      <Navbar
        portalHref={portalHref}
        chatHref={chatHref}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      <HeroSection chatHref={chatHref} />
      <FeaturesSection />
      <CommunityRulesSection />
      <AboutSection portalHref={portalHref} />
      <Footer portalHref={portalHref} />
    </main>
  );
}
