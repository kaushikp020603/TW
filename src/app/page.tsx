"use client";
import { useEffect, useState } from "react";
import Intro from "@/components/Intro";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Worlds from "@/components/Worlds";
import Universe from "@/components/Universe";
import { MeetScene, CardsScene, RevelationScene } from "@/components/Scenes";
import Reading from "@/components/Reading";
import Booking from "@/components/Booking";
import Oracle from "@/components/Oracle";
import Particles from "@/components/Particles";
import { AuthModal } from "@/components/Account";
import { Chapter, STORY } from "@/components/Story";
import Announcements from "@/components/Announcements";
import { syncCards } from "@/lib/cardsync";
import { loadConfig } from "@/lib/clientConfig";
import { configureAmbient } from "@/lib/ambient";
import { INTRO_SPEED } from "@/lib/siteConfig";
import { About, HowItWorks, Testimonials, FinalCTA, Footer } from "@/components/Sections";

export default function Home() {
  const [intro, setIntro] = useState<boolean | null>(null); // null = deciding (avoids flash)
  const [cv, setCv] = useState(0);
  const [introSpeed, setIntroSpeed] = useState(2.5);
  useEffect(() => { syncCards().then((c) => c && setCv((v) => v + 1)); }, []);

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
        <Chapter {...STORY.prologue} tone="lavender" />
        <MeetScene />
        <CardsScene />
        <Universe key={"u" + cv} />
        <Chapter {...STORY.draw} />
        <Reading key={"r" + cv} />
        <RevelationScene />
        <Worlds />
        <About />
        <HowItWorks />
        <Chapter {...STORY.invite} />
        <Booking />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
      <Oracle />
      <AuthModal />
      <Announcements />
    </>
  );
}
