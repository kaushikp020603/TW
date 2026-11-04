"use client";
import { useEffect, useState } from "react";
import Intro from "@/components/Intro";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Worlds from "@/components/Worlds";
import Universe from "@/components/Universe";
import Reading from "@/components/Reading";
import Booking from "@/components/Booking";
import Oracle from "@/components/Oracle";
import Particles from "@/components/Particles";
import { AuthModal } from "@/components/Account";
import { Chapter, STORY } from "@/components/Story";
import Announcements from "@/components/Announcements";
import { syncCards } from "@/lib/cardsync";
import { About, HowItWorks, Testimonials, FinalCTA, Footer } from "@/components/Sections";

export default function Home() {
  const [intro, setIntro] = useState<boolean | null>(null); // null = deciding (avoids flash)
  const [cv, setCv] = useState(0);
  useEffect(() => { syncCards().then((c) => c && setCv((v) => v + 1)); }, []);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("arcana-intro") === "1"; } catch {}
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntro(!(seen || reduced));
  }, []);

  useEffect(() => {
    document.body.style.overflow = intro ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [intro]);

  return (
    <>
      {intro === null && <div className="fixed inset-0 z-[100] bg-black" />}
      {intro && <Intro onDone={() => setIntro(false)} />}
      <Particles />
      <Nav />
      <main>
        <Hero ready={intro === false} />
        <Chapter {...STORY.prologue} tone="lavender" />
        <Chapter {...STORY.worlds} />
        <Worlds />
        <Chapter {...STORY.deck} tone="lavender" />
        <Universe key={"u" + cv} />
        <Chapter {...STORY.draw} />
        <Reading key={"r" + cv} />
        <Chapter {...STORY.reader} tone="lavender" />
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
