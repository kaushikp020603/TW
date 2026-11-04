/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";

// ───────── Icons ─────────
const P: Record<string, string> = {
  dashboard: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z",
  calendar: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  bookings: "M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM14 6v12",
  payments: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M7 15h3",
  clients: "M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  services: "M12 3l1.9 4.6L19 9l-4.1 3.2L16 17l-4-2.7L8 17l1.1-4.8L5 9l5.1-1.4z",
  coupons: "M3 12V5a1 1 0 0 1 1-1h7l9 9a1.5 1.5 0 0 1 0 2l-5 5a1.5 1.5 0 0 1-2 0zM8 8h.01",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  cards: "M8 3h9a2 2 0 0 1 2 2v12M5 7h9a2 2 0 0 1 2 2v11a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1z",
  blog: "M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M8 13h8M8 17h6",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 20a2 2 0 0 1-3.4 0",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  chat: "M21 12a8 8 0 0 1-11.8 7L3 21l2-5.2A8 8 0 1 1 21 12z",
  community: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  readers: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9L7 22l5-3 5 3-1.2-8.1",
  readings: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  reports: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M18 6L6 18M6 6l12 12",
  chevron: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  download: "M12 3v12M7 10l5 5 5-5M4 21h16",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  trash: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6M10 11v6M14 11v6",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  whatsapp: "M3 21l1.7-5A9 9 0 1 1 8 19.3zM9 9c0 3 3 6 6 6l1.5-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z",
  video: "M23 7l-7 5 7 5zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  alert: "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  sparkle: "M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  sound: "M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14",
};
export function Icon({ n, className = "h-5 w-5" }: { n: string; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={P[n] || P.sparkle} /></svg>;
}

// ───────── formatting ─────────
export const inr = (n: number) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
export const fdate = (t: number | string) => new Date(typeof t === "string" ? t + "T12:00:00" : t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const fshort = (t: number | string) => new Date(typeof t === "string" ? t + "T12:00:00" : t).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
export const ago = (t: number) => { const s = (Date.now() - t) / 1000; return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`; };
export const waNumber = (p?: string) => String(p || "").replace(/\D/g, "").replace(/^(\d{10})$/, "91$1");

// ───────── surfaces ─────────
export const panel = "rounded-2xl border border-white/[.07] bg-[#120c20] shadow-[0_10px_40px_rgba(0,0,0,.35)]";
export const field = "w-full rounded-xl border border-white/10 bg-[#0a0615] px-3.5 py-2.5 text-sm text-ivory outline-none transition placeholder:text-ivory/30 focus:border-fuchsia-400/60 focus:shadow-[0_0_0_3px_rgba(217,70,239,.15)]";

export function Card({ title, action, children, className = "", delay = 0 }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] }} className={`${panel} p-4 sm:p-5 ${className}`}>
      {(title || action) && <div className="mb-4 flex flex-wrap items-center justify-between gap-2">{title && <h2 className="font-display text-xl text-ivory">{title}</h2>}{action}</div>}
      {children}
    </motion.section>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { v?: "primary" | "ghost" | "danger" | "soft"; icon?: string; size?: "sm" | "md" };
export function Btn({ v = "ghost", icon, size = "md", className = "", children, ...p }: BtnProps) {
  const base = "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-medium transition-all duration-200 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-40";
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const vv = v === "primary" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_6px_24px_rgba(168,85,247,.35)] hover:shadow-[0_8px_30px_rgba(217,70,239,.5)] hover:brightness-110"
    : v === "danger" ? "border border-red-400/30 text-red-300 hover:bg-red-500/15"
    : v === "soft" ? "bg-white/[.06] text-ivory hover:bg-white/[.11]" : "border border-white/10 text-ivory/90 hover:border-fuchsia-400/50 hover:bg-white/[.04]";
  return <button className={`${base} ${sz} ${vv} ${className}`} {...p}>{icon && <Icon n={icon} className="h-4 w-4" />}{children}</button>;
}

const TONES: Record<string, string> = {
  green: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20", amber: "bg-amber-500/15 text-amber-200 ring-amber-400/20", red: "bg-red-500/15 text-red-300 ring-red-400/20",
  violet: "bg-violet-500/15 text-violet-200 ring-violet-400/20", blue: "bg-sky-500/15 text-sky-200 ring-sky-400/20", gray: "bg-white/[.07] text-ivory/70 ring-white/10",
};
export const STATUS_TONE: Record<string, string> = { pending: "amber", confirmed: "green", completed: "violet", cancelled: "gray", rejected: "red", paid: "green", failed: "red", refunded: "gray" };
export function Badge({ tone = "gray", children }: { tone?: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[.7rem] font-medium capitalize ring-1 ring-inset ${TONES[tone] || TONES.gray}`}>{children}</span>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" : "bg-white/15"}`}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${checked ? "right-0.5" : "left-0.5"}`} />
    </button>
  );
}

export function Empty({ icon = "sparkle", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300"><Icon n={icon} className="h-7 w-7" /></motion.span>
      <p className="font-display text-lg text-ivory">{title}</p>{hint && <p className="max-w-xs text-sm text-ivory/50">{hint}</p>}
    </div>
  );
}
export function Skeleton({ className = "" }: { className?: string }) { return <div className={`relative overflow-hidden rounded-xl bg-white/[.05] ${className}`}><motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[.07] to-transparent" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }} /></div>; }

export function CountUp({ value, format = (n: number) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const mv = useMotionValue(0); const [txt, setTxt] = useState(format(0)); const reduce = useReducedMotion();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reduce) { setTxt(format(value)); return; }
    const c = animate(mv, value, { duration: 1.1, ease: "easeOut", onUpdate: (v) => setTxt(format(v)) });
    return () => c.stop();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{txt}</>;
}

export function Stat({ label, value, format, sub, icon, tone = "violet", delay = 0, spark }: { label: string; value: number; format?: (n: number) => string; sub?: React.ReactNode; icon: string; tone?: string; delay?: number; spark?: number[] }) {
  const grad: Record<string, string> = { violet: "from-violet-500/25 to-violet-500/0 text-violet-300", pink: "from-fuchsia-500/25 to-fuchsia-500/0 text-fuchsia-300", gold: "from-amber-400/25 to-amber-400/0 text-amber-200", teal: "from-teal-400/25 to-teal-400/0 text-teal-200" };
  const max = Math.max(1, ...(spark || [1]));
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} whileHover={{ y: -3 }} className={`${panel} relative overflow-hidden p-4 sm:p-5`}>
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl ${grad[tone]}`} />
      <div className="relative flex items-start justify-between"><p className="text-sm text-ivory/60">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/[.06] ${grad[tone].split(" ").pop()}`}><Icon n={icon} className="h-[18px] w-[18px]" /></span></div>
      <p className="relative mt-2 font-display text-3xl text-ivory sm:text-4xl"><CountUp value={value} format={format} /></p>
      <div className="relative mt-1 flex items-end justify-between gap-3"><p className="text-xs text-ivory/45">{sub}</p>
        {spark && <svg viewBox="0 0 60 20" className="h-6 w-16 shrink-0"><motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: delay + 0.3 }} fill="none" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={spark.map((v, i) => `${(i / Math.max(1, spark.length - 1)) * 60},${19 - (v / max) * 17}`).join(" ")} /><defs><linearGradient id="sg"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#ec4899" /></linearGradient></defs></svg>}</div>
    </motion.div>
  );
}

// ───────── toasts + confirm ─────────
type Toast = { id: number; msg: string; tone: "ok" | "err" | "info" };
type Ctx = { toast: (msg: string, tone?: Toast["tone"]) => void; confirm: (o: { title: string; body?: string; yes?: string; danger?: boolean }) => Promise<boolean> };
const UiCtx = createContext<Ctx>({ toast: () => {}, confirm: async () => false });
export const useUi = () => useContext(UiCtx);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dlg, setDlg] = useState<null | { o: Parameters<Ctx["confirm"]>[0]; res: (v: boolean) => void }>(null);
  const idRef = useRef(0);
  const toast = useCallback((msg: string, tone: Toast["tone"] = "ok") => { const id = ++idRef.current; setToasts((t) => [...t, { id, msg, tone }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200); }, []);
  const confirm = useCallback((o: Parameters<Ctx["confirm"]>[0]) => new Promise<boolean>((res) => setDlg({ o, res })), []);
  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);
  const close = (v: boolean) => { dlg?.res(v); setDlg(null); };
  useEffect(() => { if (!dlg) return; const k = (e: KeyboardEvent) => e.key === "Escape" && close(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); });
  return (
    <UiCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        <AnimatePresence>{toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, x: 60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }} className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${t.tone === "err" ? "border-red-400/30 bg-[#2a0f18]" : "border-emerald-400/25 bg-[#0f2420]"}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${t.tone === "err" ? "bg-red-500/25 text-red-300" : "bg-emerald-500/25 text-emerald-300"}`}><Icon n={t.tone === "err" ? "alert" : "check"} className="h-3.5 w-3.5" /></span>{t.msg}
          </motion.div>))}</AnimatePresence>
      </div>
      <AnimatePresence>{dlg && (
        <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(false)}>
          <motion.div role="alertdialog" aria-modal="true" aria-label={dlg.o.title} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 24, stiffness: 300 }} className={`${panel} w-full max-w-sm p-6`}>
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${dlg.o.danger ? "bg-red-500/15 text-red-300" : "bg-violet-500/15 text-violet-300"}`}><Icon n={dlg.o.danger ? "alert" : "check"} /></span>
            <h3 className="mt-4 font-display text-2xl">{dlg.o.title}</h3>{dlg.o.body && <p className="mt-1 text-sm text-ivory/60">{dlg.o.body}</p>}
            <div className="mt-6 flex justify-end gap-2"><Btn onClick={() => close(false)}>Cancel</Btn><Btn v={dlg.o.danger ? "danger" : "primary"} autoFocus onClick={() => close(true)}>{dlg.o.yes || "Confirm"}</Btn></div>
          </motion.div>
        </motion.div>)}</AnimatePresence>
    </UiCtx.Provider>
  );
}

// ───────── slide-over drawer ─────────
export function SlideOver({ open, onClose, title, subtitle, children, width = "max-w-xl" }: { open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; width?: string }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [open, onClose]);
  return (
    <AnimatePresence>{open && (<>
      <motion.div key="bd" className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside key="pn" role="dialog" aria-modal="true" aria-label={String(title)} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }} className={`fixed inset-y-0 right-0 z-[91] flex w-full ${width} flex-col border-l border-white/10 bg-[#0e0919] shadow-[-30px_0_80px_rgba(0,0,0,.6)]`}>
        <div className="flex items-start justify-between gap-4 border-b border-white/[.07] p-5"><div><h2 className="font-display text-2xl text-ivory">{title}</h2>{subtitle && <div className="mt-1 text-sm text-ivory/55">{subtitle}</div>}</div><button onClick={onClose} aria-label="Close panel" className="flex h-10 w-10 items-center justify-center rounded-xl text-ivory/70 transition hover:bg-white/10 hover:text-white"><Icon n="close" /></button></div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">{children}</div>
      </motion.aside></>)}</AnimatePresence>
  );
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [open, onClose]);
  return (<AnimatePresence>{open && (
    <motion.div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 300 }} className={`${panel} max-h-[90vh] w-full max-w-lg overflow-y-auto p-6`}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-2xl">{title}</h3><button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-ivory/60 hover:bg-white/10"><Icon n="close" /></button></div>{children}
      </motion.div></motion.div>)}</AnimatePresence>);
}
export const Label = ({ children }: { children: React.ReactNode }) => <span className="mb-1.5 block text-xs font-medium uppercase tracking-[.14em] text-ivory/45">{children}</span>;

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { v: T; label: React.ReactNode }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white/[.05] p-1 scrollbar-none">
      {options.map((o) => (
        <button key={o.v} role="tab" aria-selected={value === o.v} onClick={() => onChange(o.v)} className={`relative shrink-0 rounded-lg px-3.5 py-1.5 text-sm transition-colors ${value === o.v ? "text-white" : "text-ivory/55 hover:text-ivory"}`}>
          {value === o.v && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 shadow-[0_4px_16px_rgba(168,85,247,.4)]" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
          <span className="relative">{o.label}</span>
        </button>))}
    </div>
  );
}

// ───────── data table ─────────
export type Col<T> = { key: string; label: string; sort?: (r: T) => string | number; render: (r: T) => React.ReactNode; className?: string };
export function DataTable<T extends { id?: number | string }>({ rows, cols, search, searchPlaceholder = "Search…", pageSize = 10, selectable, selected, onSelect, onRow, toolbar, empty, rowKey }: {
  rows: T[]; cols: Col<T>[]; search?: (r: T) => string; searchPlaceholder?: string; pageSize?: number; selectable?: boolean; selected?: Set<any>; onSelect?: (s: Set<any>) => void;
  onRow?: (r: T) => void; toolbar?: React.ReactNode; empty?: React.ReactNode; rowKey: (r: T) => string | number;
}) {
  const [q, setQ] = useState(""); const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null); const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    let r = rows; if (q && search) { const s = q.toLowerCase(); r = r.filter((x) => search(x).toLowerCase().includes(s)); }
    if (sort) { const c = cols.find((c) => c.key === sort.k); if (c?.sort) r = [...r].sort((a, b) => { const x = c.sort!(a), y = c.sort!(b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; }); }
    return r;
  }, [rows, q, sort, cols, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); const cur = Math.min(page, pages - 1);
  const view = filtered.slice(cur * pageSize, cur * pageSize + pageSize);
  const allOn = !!selected && view.length > 0 && view.every((r) => selected.has(rowKey(r)));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {search && <div className="relative min-w-[200px] flex-1 sm:max-w-xs"><Icon n="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={searchPlaceholder} aria-label="Search" className={`${field} pl-9`} /></div>}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{toolbar}</div>
      </div>
      {!filtered.length ? (empty ?? <Empty title="Nothing here yet" />) : (
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] text-left">
            <thead><tr className="border-b border-white/[.07]">
              {selectable && <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Select all" checked={allOn} onChange={(e) => { const s = new Set(selected); view.forEach((r) => { if (e.target.checked) s.add(rowKey(r)); else s.delete(rowKey(r)); }); onSelect?.(s); }} className="h-4 w-4 accent-fuchsia-500" /></th>}
              {cols.map((c) => <th key={c.key} className={`px-3 py-3 text-[.68rem] font-medium uppercase tracking-[.16em] text-ivory/45 ${c.className || ""}`}>
                {c.sort ? <button onClick={() => setSort(sort?.k === c.key ? { k: c.key, dir: (sort.dir * -1) as 1 | -1 } : { k: c.key, dir: 1 })} className="inline-flex items-center gap-1 hover:text-ivory">{c.label}<span className={`transition ${sort?.k === c.key ? "text-fuchsia-300" : "opacity-30"}`}>{sort?.k === c.key && sort.dir === -1 ? "↓" : "↑"}</span></button> : c.label}</th>)}
            </tr></thead>
            <tbody>
              <AnimatePresence initial={false}>{view.map((r, i) => {
                const k = rowKey(r); const on = selected?.has(k);
                return (
                  <motion.tr key={k} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.3 }} onClick={() => onRow?.(r)}
                    className={`border-b border-white/[.04] transition-colors ${onRow ? "cursor-pointer" : ""} ${on ? "bg-violet-500/10" : "hover:bg-white/[.035]"}`}>
                    {selectable && <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label="Select row" checked={!!on} onChange={(e) => { const s = new Set(selected); if (e.target.checked) s.add(k); else s.delete(k); onSelect?.(s); }} className="h-4 w-4 accent-fuchsia-500" /></td>}
                    {cols.map((c) => <td key={c.key} className={`px-3 py-3 align-middle text-sm ${c.className || ""}`}>{c.render(r)}</td>)}
                  </motion.tr>);
              })}</AnimatePresence>
            </tbody>
          </table>
        </div>)}
      {filtered.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm text-ivory/55"><span>{cur * pageSize + 1}–{Math.min(filtered.length, cur * pageSize + pageSize)} of {filtered.length}</span>
          <div className="flex gap-2"><Btn size="sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Prev</Btn><Btn size="sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</Btn></div></div>)}
    </div>
  );
}

export const Avatar = ({ name, size = "h-9 w-9" }: { name: string; size?: string }) => {
  const hue = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return <span className={`flex ${size} shrink-0 items-center justify-center rounded-full font-display text-base text-white`} style={{ background: `linear-gradient(135deg, hsl(${hue} 60% 45%), hsl(${(hue + 50) % 360} 65% 38%))` }}>{(name || "?")[0]?.toUpperCase()}</span>;
};
