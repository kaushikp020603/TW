"use client";
import { useId, useState } from "react";
import { motion } from "framer-motion";

function smooth(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  return d;
}
const kfmt = (t: number) => (t >= 1000 ? Math.round(t / 100) / 10 + "k" : String(Math.round(t)));

/** Smooth area line that draws itself in, with hover scrubbing + tooltip. */
export function AreaChart({ data, labels, fmt = (n) => String(n), height = 260 }: { data: number[]; labels: string[]; fmt?: (n: number) => string; height?: number }) {
  const id = useId().replace(/:/g, ""); const [hi, setHi] = useState(Math.max(0, data.length - 1));
  const W = 720, H = height, pl = 44, pr = 16, pt = 28, pb = 34;
  const max = Math.max(1, ...data) * 1.18;
  const xs = (i: number) => pl + (i * (W - pl - pr)) / Math.max(1, data.length - 1);
  const ys = (v: number) => pt + (1 - v / max) * (H - pt - pb);
  const pts = data.map((v, i) => [xs(i), ys(v)] as [number, number]);
  const line = smooth(pts);
  const tipX = pts[hi] ? Math.min(Math.max(pts[hi][0] - 52, pl), W - 118) : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="Area chart" onMouseLeave={() => setHi(data.length - 1)}>
      <defs>
        <linearGradient id={`l${id}`} x1="0" x2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#ec4899" /></linearGradient>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d946ef" stopOpacity=".4" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <g key={i}><line x1={pl} x2={W - pr} y1={ys(t * max)} y2={ys(t * max)} stroke="#fff" strokeOpacity=".06" /><text x={pl - 8} y={ys(t * max) + 4} textAnchor="end" fontSize="10" fill="#c9b6df" opacity=".6">{kfmt(t * max)}</text></g>)}
      {line && <motion.path d={`${line} L${xs(data.length - 1)},${ys(0)} L${xs(0)},${ys(0)} Z`} fill={`url(#a${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} />}
      <motion.path d={line} fill="none" stroke={`url(#l${id})`} strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} />
      {pts[hi] && <g><motion.line animate={{ x1: pts[hi][0], x2: pts[hi][0] }} transition={{ type: "spring", stiffness: 300, damping: 30 }} y1={pt} y2={H - pb} stroke="#fff" strokeOpacity=".35" strokeDasharray="4 4" />
        <motion.circle animate={{ cx: pts[hi][0], cy: pts[hi][1] }} transition={{ type: "spring", stiffness: 300, damping: 30 }} r="6" fill="#120c20" stroke="#fff" strokeWidth="2" />
        <motion.g animate={{ x: tipX, y: Math.max(pts[hi][1] - 58, 2) }} transition={{ type: "spring", stiffness: 300, damping: 30 }}><rect width="106" height="44" rx="10" fill="#241a3d" stroke="#fff" strokeOpacity=".14" /><text x="12" y="19" fontSize="13" fontWeight="600" fill="#fff">{fmt(data[hi])}</text><text x="12" y="35" fontSize="10" fill="#c9b6df">{labels[hi]}</text></motion.g></g>}
      {pts.map((p, i) => <g key={i}><rect x={p[0] - 22} y={0} width="44" height={H} fill="transparent" onMouseEnter={() => setHi(i)} onClick={() => setHi(i)} /><text x={p[0]} y={H - 10} textAnchor="middle" fontSize="10" fill={i === hi ? "#fff" : "#c9b6df"} opacity={i === hi ? 1 : 0.6}>{labels[i]}</text></g>)}
    </svg>
  );
}

export function BarChart({ data, labels, height = 240, color = "violet" }: { data: number[]; labels: string[]; height?: number; color?: "violet" | "pink" | "teal" }) {
  const id = useId().replace(/:/g, ""); const [hi, setHi] = useState<number | null>(null);
  const W = 560, H = height, pl = 34, pb = 32, pt = 20; const max = Math.max(1, ...data) * 1.2, bw = (W - pl) / data.length;
  const stops = { violet: ["#a78bfa", "#5b21b6"], pink: ["#f0abfc", "#a21caf"], teal: ["#5eead4", "#0f766e"] }[color];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="Bar chart">
      <defs><linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={stops[0]} /><stop offset="1" stopColor={stops[1]} stopOpacity=".7" /></linearGradient></defs>
      {[0, 0.5, 1].map((t, i) => { const y = pt + (1 - t) * (H - pt - pb); return <g key={i}><line x1={pl} x2={W} y1={y} y2={y} stroke="#fff" strokeOpacity=".06" /><text x={pl - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#c9b6df" opacity=".6">{kfmt(t * max)}</text></g>; })}
      {data.map((v, i) => { const h = (v / max) * (H - pt - pb); return (
        <g key={i} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>
          <motion.rect x={pl + i * bw + bw * 0.16} width={bw * 0.68} rx="7" fill={`url(#b${id})`} opacity={hi === null || hi === i ? 1 : 0.45}
            initial={{ y: H - pb, height: 0 }} animate={{ y: H - pb - Math.max(h, 2), height: Math.max(h, 2) }} transition={{ duration: 0.8, delay: i * 0.05, type: "spring", damping: 18 }} />
          <text x={pl + i * bw + bw / 2} y={H - pb - h - 7} textAnchor="middle" fontSize="10" fill="#fff" opacity={v ? 1 : 0}>{v}</text>
          <text x={pl + i * bw + bw / 2} y={H - 10} textAnchor="middle" fontSize="10" fill="#c9b6df" opacity=".65">{labels[i]}</text>
        </g>); })}
    </svg>
  );
}

export function Donut({ parts, size = 160 }: { parts: { label: string; value: number; color: string }[]; size?: number }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1; const R = 54, C = 2 * Math.PI * R;
  const live = parts.filter((p) => p.value > 0); const offs = live.map((_, i) => live.slice(0, i).reduce((s, p) => s + (p.value / total) * C, 0));
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label="Donut chart" className="shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#fff" strokeOpacity=".06" strokeWidth="16" />
        {live.map((p, i) => { const len = (p.value / total) * C; return (
          <motion.circle key={p.label} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="16" strokeLinecap="butt" strokeDasharray={`${len} ${C}`} strokeDashoffset={-offs[i]} initial={{ strokeDasharray: `0 ${C}` }} animate={{ strokeDasharray: `${Math.max(0, len - 2)} ${C}` }} transition={{ duration: 0.9, delay: i * 0.12 }} />); })}
      </svg>
      <ul className="space-y-1.5 text-sm">{parts.map((p) => <li key={p.label} className="flex items-center gap-2 text-ivory/80"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.label}<span className="text-ivory/40">{p.value}</span></li>)}</ul>
    </div>
  );
}

/** Horizontal ranked bars (e.g. revenue by service). */
export function HBars({ items, fmt = (n) => String(n) }: { items: { label: string; value: number }[]; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">{items.map((it, i) => (
      <li key={it.label}><div className="mb-1 flex justify-between text-sm"><span className="truncate pr-3 text-ivory/85">{it.label}</span><span className="text-ivory/60">{fmt(it.value)}</span></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/[.06]"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" initial={{ width: 0 }} animate={{ width: `${(it.value / max) * 100}%` }} transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }} /></div></li>))}</ul>
  );
}
