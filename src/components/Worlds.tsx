"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMG } from "@/config/site";
import { startBooking, startReading, type ReadCategory } from "@/lib/events";

gsap.registerPlugin(ScrollTrigger);

type World = {
  id: string; num: string; title: string; theme: string; service: string; desc: string;
  img: string; pos: string; accent: string; category: ReadCategory; bookId: string; clip?: string;
};

// Optional: drop rendered fly-through clips into /public/video and set `clip` here (scrubbed by scroll).
export const WORLDS: World[] = [
  { id: "hearts", num: "I", title: "The Garden of Hearts", theme: "Romantic purple, pink & gold", service: "Love & relationship readings", accent: "#e7a6d0",
    desc: "Where feelings bloom in moonlit gardens. Explore connection, patterns and what your heart is trying to tell you.", img: IMG.garden, pos: "50% 55%", category: "love", bookId: "love" },
  { id: "path", num: "II", title: "The Golden Path", theme: "A celestial golden palace", service: "Career & professional guidance", accent: "#ead5a0",
    desc: "A luminous road toward purpose. Reflect on decisions, timing and the next step in your work.", img: IMG.palace, pos: "50% 50%", category: "career", bookId: "career" },
  { id: "ocean", num: "III", title: "The Ocean Within", theme: "A deep blue cosmic ocean", service: "Self-discovery & personal growth", accent: "#8fb4ff",
    desc: "Dive beneath the surface. A calm, reflective reading on who you are becoming and what you are ready to release.", img: IMG.ruins, pos: "50% 60%", category: "general", bookId: "growth" },
  { id: "veil", num: "IV", title: "The Veil of Mystery", theme: "A dark temple beneath a glowing moon", service: "General life guidance", accent: "#c9b6df",
    desc: "When everything feels unclear, step through the veil. Open-ended guidance for whatever is on your mind.", img: IMG.hooded, pos: "50% 45%", category: "general", bookId: "three" },
];

function Copy({ w }: { w: World }) {
  return (
    <div className="max-w-xl">
      <p className="eyebrow mb-3" style={{ color: w.accent }}>World {w.num} · {w.theme}</p>
      <h3 className="h-hero text-[clamp(2.2rem,6vw,4.6rem)]">{w.title}</h3>
      <p className="mt-2 font-display text-lg italic" style={{ color: w.accent }}>{w.service}</p>
      <p className="mt-4 text-base font-light leading-relaxed text-ivory/85">{w.desc}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button className="btn btn-solid" onClick={() => startReading(w.category)}>Explore reading</button>
        <button className="btn" onClick={() => startBooking(w.bookId)}>Book consultation</button>
      </div>
    </div>
  );
}

export default function Worlds() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>(".w-scene");
      const copies = gsap.utils.toArray<HTMLElement>(".w-copy");
      const rail = gsap.utils.toArray<HTMLElement>(".w-dot");
      const vids = scenes.map((s) => s.querySelector("video") as HTMLVideoElement | null);
      const n = scenes.length;
      gsap.set(scenes, { opacity: 0, scale: 0.7 });
      gsap.set(copies, { opacity: 0, y: 50 });
      gsap.set(scenes[0], { opacity: 1, scale: 1 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current, start: "top top", end: `+=${n * 110}%`, pin: true, scrub: 0.8, anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(n - 1, Math.floor(self.progress * n));
            rail.forEach((d, i) => d.classList.toggle("is-on", i === idx));
            vids.forEach((v, i) => { if (v && v.duration && i === idx) v.currentTime = ((self.progress * n) % 1) * v.duration; });
          },
        },
      });
      scenes.forEach((s, i) => {
        const t = i; // each scene occupies 1 unit on the timeline
        // dive-in on arrival
        if (i > 0) {
          tl.to(s, { opacity: 1, scale: 1, duration: 0.45 }, t - 0.5);
        }
        tl.fromTo(copies[i], { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.3 }, t - 0.1 + (i === 0 ? 0.1 : 0));
        tl.to(s.querySelector(".w-img"), { scale: 1.18, duration: 1 }, t - 0.5 < 0 ? 0 : t - 0.5);
        if (i < n - 1) {
          tl.to(copies[i], { opacity: 0, y: -50, duration: 0.25 }, t + 0.65);
          // fly through: current scene rushes toward the camera and dissolves
          tl.to(s, { scale: 2.1, opacity: 0, duration: 0.45 }, t + 0.5);
        }
      });
      tl.to({}, { duration: 0.3 });
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id="worlds" aria-labelledby="worlds-h">
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-28 text-center sm:px-8">
        <p className="eyebrow mb-4">Explore the reading worlds</p>
        <h2 id="worlds-h" className="h-hero text-[clamp(2rem,5.5vw,4.2rem)]">Four worlds. <span className="gold-text italic">One journey.</span></h2>
        <p className="mx-auto mt-5 max-w-xl font-light text-ivory/75">Scroll to fly through each world. Each one is a different way to ask, reflect and listen.</p>
      </div>

      {reduce ? (
        <div className="space-y-px">
          {WORLDS.map((w) => (
            <div key={w.id} className="relative flex min-h-[80svh] items-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.img} alt={w.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: w.pos }} />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-transparent" />
              <div className="relative p-6 pb-14 sm:p-12"><Copy w={w} /></div>
            </div>
          ))}
        </div>
      ) : (
        <div ref={root} className="relative h-[100svh] w-full overflow-hidden bg-midnight">
          {WORLDS.map((w) => (
            <div key={w.id} className="w-scene absolute inset-0 will-change-transform">
              <div className="w-img absolute inset-0 will-change-transform">
                {w.clip ? <video src={w.clip} muted playsInline preload="auto" className="h-full w-full object-cover" /> : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.img} alt={`${w.title}: ${w.theme}`} loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: w.pos }} />
                )}
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(27,18,64,.8),rgba(27,18,64,.1)_65%),linear-gradient(0deg,rgba(27,18,64,.85),transparent_55%)]" />
              <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 160px ${w.accent}22` }} />
            </div>
          ))}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-end sm:items-center">
            <div className="relative mx-auto h-[62%] w-full max-w-7xl px-5 sm:h-full sm:px-8">
              {WORLDS.map((w) => (
                <div key={w.id} className="w-copy pointer-events-auto absolute inset-x-5 bottom-10 sm:inset-x-8 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"><Copy w={w} /></div>
              ))}
            </div>
          </div>
          <ol className="absolute right-4 top-1/2 z-20 -translate-y-1/2 space-y-4 sm:right-8" aria-hidden>
            {WORLDS.map((w, i) => (
              <li key={w.id} className={`w-dot flex items-center justify-end gap-3 ${i === 0 ? "is-on" : ""}`}>
                <span className="hidden text-[.6rem] uppercase tracking-[.3em] text-ivory/70 lg:block">{w.num}</span>
                <span className="dot h-2 w-2 rounded-full border border-gold bg-transparent transition" />
              </li>
            ))}
          </ol>
          <style>{`.w-dot.is-on .dot{background:#d6b36d;box-shadow:0 0 14px #d6b36d;transform:scale(1.5)}`}</style>
        </div>
      )}
    </section>
  );
}
