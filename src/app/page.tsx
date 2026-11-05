"use client";
import { useEffect } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Quiz from "@/components/Quiz";
import ReviewStrip from "@/components/ReviewStrip";
import { MeetScene, CardsScene, RevelationScene, ShopScene, Beat, WelcomeBack } from "@/components/Scenes";
import Booking from "@/components/Booking";
import Oracle from "@/components/Oracle";
import Particles from "@/components/Particles";
import { AuthModal } from "@/components/Account";
import Announcements from "@/components/Announcements";
import { loadConfig } from "@/lib/clientConfig";
import { configureAmbient } from "@/lib/ambient";
import { HowItWorks, Testimonials, FinalCTA, Footer } from "@/components/Sections";

export default function Home() {
  useEffect(() => {
    let live = true;
    loadConfig().then((cfg) => { if (live) configureAmbient(cfg.music); });
    return () => { live = false; };
  }, []);

  return (
    <>
      <Particles />
      <Nav />
      <main>
        <Hero ready />
        <WelcomeBack />
        <Beat>Every story begins with a question you are not quite ready to say aloud.</Beat>
        <MeetScene />
        <Beat>So she lays out the cards, and the cards begin to speak.</Beat>
        <CardsScene />
        <Beat>And sometimes, one card is all it takes to see your path.</Beat>
        <RevelationScene />
        <Quiz />
        <ReviewStrip place="services" />
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
