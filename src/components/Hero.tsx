"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMG } from "@/config/site";
import { goTo, startBooking, startReading } from "@/lib/events";
import { CardBack } from "./TarotCard";

gsap.registerPlugin(ScrollTrigger);

const line = (i: number) => ({ hidden: { opacity: 0, y: 40, filter: "blur(10px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { delay: 0.15 * i, duration: 1.2, ease: [0.2, 0.8, 0.2, 1] as const } } });

export default function Hero({ ready }: { ready: boolean }) {
  const sec = useRef<HTMLElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".h-bg", { yPercent: 14, scale: 1.12, ease: "none", scrollTrigger: { trigger: sec.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".h-copy", { yPercent: -18, opacity: 0.1, ease: "none", scrollTrigger: { trigger: sec.current, start: "top top", end: "bottom 30%", scrub: true } });
      gsap.to(".h-card", { yPercent: (i) => -30 - i * 25, rotate: (i) => (i % 2 ? 18 : -18), ease: "none", scrollTrigger: { trigger: sec.current, start: "top top", end: "bottom top", scrub: 1 } });
    }, sec);
    return () => ctx.revert();
  }, []);

  return (
    <section id="top" ref={sec} className="relative flex min-h-[100svh] items-end overflow-hidden">
      <div className="h-bg absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.moonReader} alt="The Arcana's illustrated tarot reader raising glowing sigils beneath a giant moon" className="kenburns h-full w-full object-cover object-[50%_28%]" />
      </div>
      <div className="fog" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,8,18,.55)_0%,rgba(11,8,18,.1)_35%,rgba(11,8,18,.75)_75%,#0b0812_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,transparent,rgba(11,8,18,.55))]" />

      {/* floating cards */}
      {[{ l: "3%", t: "13%", r: -12, w: 84 }, { l: "86%", t: "22%", r: 14, w: 96 }, { l: "78%", t: "62%", r: -8, w: 70 }].map((c, i) => (
        <div key={i} className="h-card pointer-events-none absolute hidden md:block" style={{ left: c.l, top: c.t }}>
          <div className="overflow-hidden rounded-xl border border-gold/50 shadow-[0_0_40px_rgba(214,179,109,.3)]"
            style={{ width: c.w, aspectRatio: "5/8", ["--r" as string]: `${c.r}deg`, animation: `float ${7 + i * 1.5}s ease-in-out infinite` }}>
            <CardBack />
          </div>
        </div>
      ))}

      <div className="h-copy relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-40 sm:px-8 sm:pb-28">
        <motion.p initial="hidden" animate={ready ? "show" : "hidden"} variants={line(0)} className="eyebrow mb-5">Some answers aren&apos;t found. They&apos;re revealed.</motion.p>
        <motion.h1 initial="hidden" animate={ready ? "show" : "hidden"} variants={line(1)} className="h-hero max-w-4xl text-[clamp(2.6rem,8.2vw,6.6rem)]">
          Discover what the cards <span className="gold-text italic">have to reveal.</span>
        </motion.h1>
        <motion.p initial="hidden" animate={ready ? "show" : "hidden"} variants={line(2)} className="mt-6 max-w-xl text-base font-light leading-relaxed text-ivory/85 sm:text-lg">
          Step beyond the ordinary. Discover the symbolism, explore your questions and find a moment of clarity through the ancient art of tarot.
        </motion.p>
        <motion.div initial="hidden" animate={ready ? "show" : "hidden"} variants={line(3)} className="mt-9 flex flex-wrap gap-4">
          <button className="btn btn-solid" onClick={() => startReading()}>Enter the unknown</button>
          <button className="btn" onClick={() => startBooking()}>Book a personal reading</button>
        </motion.div>
      </div>

      <button onClick={() => goTo("worlds")} aria-label="Scroll to explore" className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center text-[.62rem] uppercase tracking-[.4em] text-champagne/70">
        Scroll
        <span className="mx-auto mt-2 block h-10 w-px bg-gradient-to-b from-gold to-transparent" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
      </button>
    </section>
  );
}
