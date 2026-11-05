"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { goTo, startBooking, startReading } from "@/lib/events";
import { CardBack } from "./TarotCard";
import Film from "./Film";
import { IMG } from "@/config/site";

gsap.registerPlugin(ScrollTrigger);

const line = (i: number) => ({ hidden: { opacity: 0, y: 40, filter: "blur(10px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { delay: 0.15 * i, duration: 1.2, ease: [0.2, 0.8, 0.2, 1] as const } } });
const GLYPHS = ["☉", "☽", "♀", "♂", "♃", "♄", "✦", "♈", "♉", "♊", "♋", "♌"];

export default function Hero({ ready }: { ready: boolean }) {
  const sec = useRef<HTMLElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".h-bg", { yPercent: 12, scale: 1.1, ease: "none", scrollTrigger: { trigger: sec.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".h-copy", { yPercent: -14, opacity: 0.1, ease: "none", scrollTrigger: { trigger: sec.current, start: "top top", end: "bottom 30%", scrub: true } });
      gsap.to(".h-portal", { yPercent: -8, scale: 0.94, ease: "none", scrollTrigger: { trigger: sec.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".h-card", { yPercent: (i) => -30 - i * 25, rotate: (i) => (i % 2 ? 18 : -18), ease: "none", scrollTrigger: { trigger: sec.current, start: "top top", end: "bottom top", scrub: 1 } });
    }, sec);
    return () => ctx.revert();
  }, []);

  // pointer parallax: layers read --mx / --my (-1..1)
  const onMove = (e: React.PointerEvent) => {
    const el = sec.current; if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty("--my", String(((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const par = (n: number) => ({ transform: `translate3d(calc(var(--mx,0) * ${n}px), calc(var(--my,0) * ${n}px), 0)`, transition: "transform .35s ease-out" });

  return (
    <section id="top" ref={sec} onPointerMove={onMove} className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* soft artwork backdrop (blurred, so it never looks low-res) */}
      <div className="h-bg absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.moonReader} alt="" aria-hidden className="kenburns h-full w-full object-cover object-[50%_30%] opacity-55 blur-[3px]" />
      </div>
      <div className="fog" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_75%_50%,rgba(143,112,224,.35),transparent_70%),linear-gradient(180deg,rgba(27,18,64,.5),rgba(27,18,64,.75)_80%,#1b1240)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(27,18,64,.85)_0%,rgba(27,18,64,.3)_55%,transparent)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-28">
        {/* copy */}
        <div className="h-copy">
          <motion.p initial="hidden" animate={ready ? "show" : "hidden"} variants={line(0)} className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-10 bg-gold/70" />A little guidance. A little magic.</motion.p>
          <motion.h1 initial="hidden" animate={ready ? "show" : "hidden"} variants={line(1)} className="h-hero text-[clamp(2.6rem,7.4vw,6.2rem)]">
            Your story is written <span className="shimmer-text italic">in the stars.</span>
          </motion.h1>
          <motion.p initial="hidden" animate={ready ? "show" : "hidden"} variants={line(2)} className="mt-6 max-w-lg text-base font-light leading-relaxed text-ivory/90 sm:text-lg">
            Sometimes, all you need is a little guidance from the universe. A whole new perspective is one card away.
          </motion.p>
          <motion.div initial="hidden" animate={ready ? "show" : "hidden"} variants={line(3)} className="mt-9 flex flex-wrap gap-4">
            <button className="btn btn-solid" onClick={() => startBooking()}>Book a reading</button>
            <button className="btn" onClick={() => startReading()}>Explore tarot</button>
          </motion.div>
          <motion.ul initial="hidden" animate={ready ? "show" : "hidden"} variants={line(4)} className="mt-10 flex flex-wrap gap-x-7 gap-y-2 text-xs uppercase tracking-[.22em] text-champagne/80">
            <li>✦ Chat, voice or video</li><li>✦ Private and gentle</li><li>✦ Book on WhatsApp</li>
          </motion.ul>
        </div>

        {/* portal */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={ready ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }} className="h-portal relative mx-auto w-full max-w-[min(88vw,520px)] lg:max-w-none">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[500px]">
            {/* rotating celestial ring */}
            <div className="ring-spin pointer-events-none absolute -inset-[9%]" style={par(-10)} aria-hidden>
              <svg viewBox="0 0 200 200" className="h-full w-full">
                <circle cx="100" cy="100" r="97" fill="none" stroke="rgba(214,179,109,.55)" strokeWidth=".4" />
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,250,240,.35)" strokeWidth=".3" strokeDasharray="1 3" />
                {GLYPHS.map((g, i) => { const a = (i / GLYPHS.length) * Math.PI * 2; return <text key={i} x={100 + Math.cos(a) * 93.5} y={100 + Math.sin(a) * 93.5 + 2} textAnchor="middle" fontSize="6" fill="#ead5a0" opacity=".85">{g}</text>; })}
              </svg>
            </div>
            <div className="ring-spin-rev pointer-events-none absolute -inset-[3%] rounded-[50%_50%_46%_46%/38%_38%_62%_62%] border border-gold/30" aria-hidden />
            {/* arch window with the film */}
            <div className="portal-arch absolute inset-0 overflow-hidden" style={par(6)}>
              <Film src="/videos/1.mp4" poster="/videos/1.jpg" eager label="Spill the Cards' reader welcomes you into her moonlit tarot chamber" className="film-fx h-full w-full object-cover object-[64%_50%]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_75%_at_50%_45%,transparent_55%,rgba(27,18,64,.55))]" />
              <div className="grain pointer-events-none absolute inset-0" />
            </div>
            {/* orbiting cards */}
            {[{ l: "-9%", t: "14%", r: -14, w: 22 }, { l: "86%", t: "8%", r: 12, w: 26 }, { l: "82%", t: "70%", r: -9, w: 20 }].map((c, i) => (
              <div key={i} className="h-card pointer-events-none absolute hidden sm:block" style={{ left: c.l, top: c.t, width: `${c.w}%`, ...par(i % 2 ? 22 : -18) }}>
                <div className="overflow-hidden rounded-xl border border-gold/60 shadow-[0_0_40px_rgba(214,179,109,.4)]" style={{ aspectRatio: "5/8", ["--r" as string]: `${c.r}deg`, animation: `float ${7 + i * 1.5}s ease-in-out infinite` }}><CardBack /></div>
              </div>
            ))}
            <div className="sparkle pointer-events-none absolute -left-4 top-[30%] text-2xl text-champagne" aria-hidden>✦</div>
            <div className="sparkle pointer-events-none absolute -right-2 top-[55%] text-lg text-champagne [animation-delay:1.2s]" aria-hidden>✦</div>
            <div className="sparkle pointer-events-none absolute bottom-[-2%] left-[30%] text-base text-champagne [animation-delay:2.1s]" aria-hidden>✦</div>
          </div>
        </motion.div>
      </div>

      <button onClick={() => goTo("meet")} aria-label="Scroll to explore" className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center text-[.62rem] uppercase tracking-[.4em] text-champagne/70">
        Scroll
        <span className="mx-auto mt-2 block h-10 w-px bg-gradient-to-b from-champagne to-transparent" />
      </button>
    </section>
  );
}
