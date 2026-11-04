"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** A narrated interlude: words light up as you scroll, like reading a storybook. */
export function Chapter({ num, title, text, tone = "gold" }: { num: string; title: string; text: string; tone?: "gold" | "lavender" }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".ch-num", { opacity: 0, scale: 0.8, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 75%" } });
      gsap.fromTo(".ch-w", { opacity: 0.14, y: 8 }, { opacity: 1, y: 0, stagger: 0.12, ease: "none", scrollTrigger: { trigger: ".ch-text", start: "top 82%", end: "bottom 42%", scrub: true } });
      gsap.fromTo(".ch-line", { scaleY: 0 }, { scaleY: 1, transformOrigin: "top", ease: "none", scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 50%", scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  const color = tone === "gold" ? "text-gold" : "text-lavender";
  return (
    <section ref={ref} className="relative px-5 py-28 text-center sm:px-8 sm:py-36" aria-label={`Chapter ${num}: ${title}`}>
      <div className="ch-line mx-auto mb-8 h-20 w-px bg-gradient-to-b from-transparent via-gold to-transparent" aria-hidden />
      <p className={`ch-num font-display text-7xl italic ${color} opacity-90 sm:text-8xl`}>{num}</p>
      <p className="eyebrow mt-2">{title}</p>
      <p className="ch-text font-display mx-auto mt-8 max-w-3xl text-[clamp(1.4rem,3.6vw,2.6rem)] leading-snug text-ivory">
        {text.split(" ").map((w, i) => <span key={i} className="ch-w inline-block pr-[.28em]" style={reduce ? undefined : { opacity: 0.14 }}>{w}</span>)}
      </p>
    </section>
  );
}

export const STORY = {
  prologue: { num: "☽", title: "Prologue", text: "Every story begins the same way: with a question you are not quite ready to say aloud. Tonight, you do not have to answer it. You only have to listen." },
  worlds: { num: "I", title: "The Threshold", text: "Four doors stand before you, each one opening onto a different part of your life. Walk through whichever one calls your name." },
  deck: { num: "II", title: "The Deck", text: "Twenty-two figures wait in the dark, each one a chapter of the great human journey, from the Fool's first step to the World's final bow." },
  draw: { num: "III", title: "The Draw", text: "Now the cards are yours to choose. There is no wrong card. Whatever your hand finds is the story asking to be told." },
  reader: { num: "IV", title: "The Reader", text: "Behind every spread sits someone who listens first. She does not decide your fate. She helps you read the story you are already writing." },
  invite: { num: "V", title: "The Invitation", text: "When you are ready for more than symbols, a quiet hour is waiting. Choose a time, send a message, and let the next chapter begin." },
};
