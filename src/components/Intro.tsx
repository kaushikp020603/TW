"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CardBack } from "./TarotCard";
import SoundToggle from "./SoundToggle";

type P = { x: number; y: number; tx: number; ty: number; sx: number; sy: number; r: number; d: number };

export default function Intro({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [skipVisible, setSkipVisible] = useState(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    tlRef.current?.kill();
    try { sessionStorage.setItem("arcana-intro", "1"); } catch {}
    gsap.to(root.current, { opacity: 0, duration: 0.9, ease: "power2.inOut", onComplete: onDone });
  };

  useEffect(() => {
    const cv = canvas.current!;
    const c = cv.getContext("2d")!;
    const mobile = window.innerWidth < 700;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (cv.width = window.innerWidth * dpr);
    const H = (cv.height = window.innerHeight * dpr);

    // background stars
    const stars = Array.from({ length: mobile ? 90 : 180 }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.4 + 0.3) * dpr, t: Math.random() * 6,
    }));

    // text particles sampled from rendered "THE ARCANA"
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const o = off.getContext("2d")!;
    const fs = Math.min(W / (mobile ? 6.2 : 9), 190 * dpr);
    o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "middle";
    o.font = `600 ${fs}px "Cormorant Garamond", Georgia, serif`;
    const lines = mobile ? ["THE", "ARCANA"] : ["THE ARCANA"];
    lines.forEach((t, i) => o.fillText(t, W / 2, H * 0.52 + (i - (lines.length - 1) / 2) * fs * 1.05));
    const img = o.getImageData(0, 0, W, H).data;
    const step = Math.max(3, Math.round((mobile ? 5 : 4) * dpr));
    const parts: P[] = [];
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step)
        if (img[(y * W + x) * 4 + 3] > 140) {
          const a = Math.random() * Math.PI * 2, rad = (0.5 + Math.random()) * Math.max(W, H) * 0.5;
          parts.push({ x: W / 2 + Math.cos(a) * rad, y: H / 2 + Math.sin(a) * rad, sx: W / 2 + Math.cos(a) * rad, sy: H / 2 + Math.sin(a) * rad, tx: x, ty: y, r: (Math.random() * 1.1 + 0.7) * dpr, d: Math.random() * 0.35 });
        }

    const s = { star: 0, galaxy: 0, form: 0, glow: 0 };
    let raf = 0;
    const draw = (t: number) => {
      c.clearRect(0, 0, W, H);
      // lone golden star
      if (s.star > 0) {
        const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 60 * dpr * s.star);
        g.addColorStop(0, "rgba(255,240,200," + s.star + ")"); g.addColorStop(1, "rgba(214,179,109,0)");
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      // starfield
      for (const st of stars) {
        const a = s.galaxy * (0.4 + 0.6 * Math.abs(Math.sin(t / 900 + st.t)));
        c.fillStyle = `rgba(245,236,221,${a})`;
        c.beginPath(); c.arc(st.x, st.y, st.r, 0, 6.283); c.fill();
      }
      // text particles
      for (const p of parts) {
        const k = Math.min(1, Math.max(0, (s.form - p.d) / (1 - p.d)));
        const e = 1 - Math.pow(1 - k, 3);
        p.x = p.sx + (p.tx - p.sx) * e; p.y = p.sy + (p.ty - p.sy) * e;
        c.fillStyle = `rgba(234,213,160,${0.25 + 0.75 * e})`;
        c.fillRect(p.x, p.y, p.r * 1.6, p.r * 1.6);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const el = root.current!;
    const tl = gsap.timeline({ onComplete: () => setTimeout(finish, 900) });
    tlRef.current = tl;
    gsap.set(el.querySelectorAll(".i-moon"), { scale: 0.2, opacity: 0 });
    gsap.set(el.querySelectorAll(".i-card"), { y: 180, opacity: 0, rotate: 0 });
    gsap.set(el.querySelector(".i-tag"), { opacity: 0, y: 14 });
    tl.to(s, { star: 1, duration: 1.2, ease: "power2.out" })
      .to(s, { galaxy: 1, duration: 1.6 }, 1.0)
      .to(el.querySelector(".i-galaxy"), { opacity: 1, scale: 1.15, duration: 3.2, ease: "power1.out" }, 1.0)
      .to(el.querySelectorAll(".i-moon"), { scale: 1, opacity: 1, duration: 2.2, ease: "power3.out" }, 2.2)
      .to(s, { star: 0, duration: 0.8 }, 2.4)
      .to(el.querySelectorAll(".i-card"), { y: 0, opacity: 1, duration: 1.4, stagger: 0.18, ease: "back.out(1.3)" }, 3.4)
      .to(el.querySelectorAll(".i-card"), { rotate: (i) => [-14, 0, 14][i], x: (i) => [-1, 0, 1][i] * (mobile ? 70 : 150), duration: 1.4, ease: "power3.inOut" }, 4.4)
      .to(s, { form: 1, duration: 2.2, ease: "power1.inOut" }, 5.0)
      .to(el.querySelectorAll(".i-card"), { y: mobile ? -150 : -210, opacity: 0.0, duration: 1.4, ease: "power2.in" }, 5.6)
      .to(el.querySelector(".i-tag"), { opacity: 1, y: 0, duration: 1 }, 7.0);
    setTimeout(() => setSkipVisible(true), 500);
    return () => { cancelAnimationFrame(raf); tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className="fixed inset-0 z-[100] overflow-hidden bg-black" role="dialog" aria-label="Introduction">
      <div className="i-galaxy absolute inset-0 opacity-0"
        style={{ background: "radial-gradient(60% 50% at 30% 40%,rgba(90,50,140,.55),transparent 70%),radial-gradient(50% 45% at 72% 62%,rgba(40,80,160,.4),transparent 70%),radial-gradient(40% 40% at 55% 30%,rgba(214,179,109,.18),transparent 70%)" }} />
      <div className="i-moon absolute left-1/2 top-[42%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle at 38% 35%,#fff3cf,#ead5a0 38%,#b98f4a 72%,#6b4a22)", boxShadow: "0 0 140px 30px rgba(214,179,109,.35)", opacity: 0 }} />
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="i-card absolute h-[34vmin] w-[22vmin] overflow-hidden rounded-xl border border-gold/60 shadow-[0_0_40px_rgba(214,179,109,.3)]"><CardBack /></div>
        ))}
      </div>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <p className="i-tag absolute inset-x-0 bottom-[16%] text-center text-[.7rem] uppercase tracking-[.5em] text-champagne/80 sm:text-xs">
        Some answers aren&apos;t found. They&apos;re revealed.
      </p>
      <div className="absolute right-4 top-4 flex items-center gap-3 sm:right-8 sm:top-6">
        <SoundToggle />
        <button onClick={finish} className={`btn !py-2.5 transition-opacity ${skipVisible ? "opacity-100" : "opacity-0"}`}>Skip intro</button>
      </div>
    </div>
  );
}
