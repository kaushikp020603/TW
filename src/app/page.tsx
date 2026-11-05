"use client";
import { useEffect, useState } from "react";
import Intro from "@/components/Intro";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ReviewStrip from "@/components/ReviewStrip";
import { MeetScene, CardsScene, RevelationScene, ShopScene, Beat, Quiz, WelcomeBack } from "@/components/Scenes";
import Booking from "@/components/Booking";
import Oracle from "@/components/Oracle";
import Particles from "@/components/Particles";
import { AuthModal } from "@/components/Account";
import Announcements from "@/components/Announcements";
import { loadConfig } from "@/lib/clientConfig";
import { configureAmbient } from "@/lib/ambient";
import { INTRO_SPEED } from "@/lib/siteConfig";
import { About, HowItWorks, Testimonials, FinalCTA, Footer } from "@/components/Sections";

export default function Home() {
  const [intro, setIntro] = useState<boolean | null>(null); // null = deciding (avoids flash)
  const [introSpeed, setIntroSpeed] = useState(2.5);

  useEffect(() => {
    let live = true;
    (async () => {
      const cfg = await loadConfig(); if (!live) return;
      configureAmbient(cfg.music);
      const q = new URLSearchParams(location.search);
      const preview = q.get("intro") === "preview";               // admin "Preview intro" link
      const style = (preview && (["quick", "short", "full"] as const).find((x) => x === q.get("style"))) || cfg.intro.style;
      let seen = false; try { seen = sessionStorage.getItem("arcana-intro") === "1"; } catch {}
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setIntroSpeed(style === "off" ? 1 : INTRO_SPEED[style]);
      setIntro(preview ? true : !(style === "off" || seen || reduced));
    })();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    document.body.style.overflow = intro ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [intro]);

  return (
    <>
      {intro === null && <div className="fixed inset-0 z-[100] bg-black" />}
      {intro && <Intro speed={introSpeed} onDone={() => setIntro(false)} />}
      <Particles />
      <Nav />
      <main>
        <Hero ready={intro === false} />
        <WelcomeBack />
        <Beat>Every story begins with a question you are not quite ready to say aloud.</Beat>
        <MeetScene />
        <Beat>So she lays out the cards, and the cards begin to speak.</Beat>
        <CardsScene />
        <Beat>And sometimes, one card is all it takes to see your path.</Beat>
        <RevelationScene />
        <Quiz />
        <ReviewStrip place="services" />
        <About />
        <HowItWorks />
        <Booking />
        <Beat>Keep a little of the magic close, long after the reading ends.</Beat>
        <ShopScene />
        <Testimonials />
        <Beat>Your story is still unwritten. Perhaps this is where the next chapter begins.</Beat>
        <FinalCTA />
      </main>
      <Footer />
      <Oracle />
      <AuthModal />
      <Announcements />
    </>
  );
}
