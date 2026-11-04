"use client";
import { useEffect, useRef } from "react";

/** Fixed golden-dust layer + cursor sparkle trail (desktop only). Pauses when tab hidden. */
export default function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current!, c = cv.getContext("2d")!;
    const fine = window.matchMedia("(pointer: fine)").matches;
    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
    resize(); addEventListener("resize", resize);
    const N = fine ? 70 : 30;
    const dust = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.3 + 0.3) * dpr, vy: -(Math.random() * 0.25 + 0.05) * dpr, vx: (Math.random() - 0.5) * 0.15 * dpr, p: Math.random() * 6 }));
    const trail: { x: number; y: number; life: number; vx: number; vy: number }[] = [];
    const move = (e: MouseEvent) => {
      for (let i = 0; i < 2; i++) trail.push({ x: e.clientX * dpr, y: e.clientY * dpr, life: 1, vx: (Math.random() - 0.5) * 0.8, vy: Math.random() * 0.8 + 0.2 });
      if (trail.length > 90) trail.splice(0, trail.length - 90);
    };
    if (fine) addEventListener("mousemove", move);
    let raf = 0, t = 0;
    const loop = () => {
      t += 0.016; c.clearRect(0, 0, W, H);
      for (const d of dust) {
        d.x += d.vx + Math.sin(t + d.p) * 0.15; d.y += d.vy;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        c.fillStyle = `rgba(234,213,160,${0.25 + 0.35 * Math.sin(t * 1.5 + d.p) ** 2})`;
        c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.283); c.fill();
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i]; p.life -= 0.028; p.x += p.vx * dpr; p.y += p.vy * dpr;
        if (p.life <= 0) { trail.splice(i, 1); continue; }
        c.fillStyle = `rgba(234,213,160,${p.life * 0.8})`;
        c.beginPath(); c.arc(p.x, p.y, 2.2 * dpr * p.life, 0, 6.283); c.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(loop); };
    document.addEventListener("visibilitychange", vis); vis();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); removeEventListener("mousemove", move); document.removeEventListener("visibilitychange", vis); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
