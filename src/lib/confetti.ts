"use client";

/** A short burst of gold and violet sparkles. Skipped for reduced-motion visitors. */
export function confetti(x = 0.5, y = 0.35) {
  if (typeof window === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas"); const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200";
  document.body.appendChild(cv); const c = cv.getContext("2d")!;
  const colors = ["#d6b36d", "#ead5a0", "#c9b6df", "#8b5cf6", "#ec4899", "#fffaf0"];
  const ps = Array.from({ length: 90 }, () => { const a = Math.random() * Math.PI * 2, v = (4 + Math.random() * 9) * dpr; return { x: x * cv.width, y: y * cv.height, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5 * dpr, r: (2 + Math.random() * 4) * dpr, c: colors[Math.floor(Math.random() * colors.length)], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 }; });
  const t0 = performance.now();
  const frame = (t: number) => {
    const k = (t - t0) / 1400; c.clearRect(0, 0, cv.width, cv.height);
    for (const p of ps) { p.vy += 0.35 * dpr; p.x += p.vx; p.y += p.vy; p.vx *= 0.985; p.rot += p.vr; c.save(); c.globalAlpha = Math.max(0, 1 - k); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.c; c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); c.restore(); }
    if (k < 1) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
}
