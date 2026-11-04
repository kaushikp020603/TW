"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { openAuth, setUser, useUser } from "@/lib/useUser";
import { goTo } from "@/lib/events";

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = (e: Event) => { setMode((e as CustomEvent).detail?.mode || "login"); setErr(""); setOpen(true); };
    addEventListener("arcana:auth", h); return () => removeEventListener("arcana:auth", h);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: mode, ...f }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.error || "Something went wrong.");
    setUser(j.user); setOpen(false); setF({ name: "", email: "", phone: "", password: "" });
  }
  if (typeof document === "undefined") return null;
  const inp = "w-full border border-gold/30 bg-midnight/95 p-3 font-light";
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-midnight/92 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.form onSubmit={submit} onClick={(e) => e.stopPropagation()} initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} role="dialog" aria-modal="true" aria-label={mode === "login" ? "Sign in" : "Create account"} className="glass frame w-full max-w-md space-y-4 p-8">
            <h2 className="h-hero text-3xl">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="text-xs font-light text-ivory/60">An account lets you keep your readings and bookings together. You can also book as a guest.</p>
            {mode === "register" && <>
              <input className={inp} placeholder="Your name" aria-label="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
              <input className={inp} placeholder="WhatsApp number (optional)" aria-label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" />
            </>}
            <input className={inp} type="email" placeholder="Email" aria-label="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
            <input className={inp} type="password" placeholder="Password (8+ characters)" aria-label="Password" required minLength={mode === "register" ? 8 : 1} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
            <button className="btn btn-solid w-full" disabled={busy}>{busy ? "…" : mode === "login" ? "Sign in" : "Create account"}</button>
            <button type="button" className="block w-full text-center text-xs uppercase tracking-[.2em] text-lavender hover:text-gold" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
              {mode === "login" ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>, document.body);
}

export function AccountButton() {
  const { user, ready } = useUser();
  const [menu, setMenu] = useState(false);
  if (!ready) return <span className="h-10 w-16" />;
  if (!user) return <button className="hidden min-h-10 px-2 text-[.7rem] uppercase tracking-[.25em] text-ivory/80 hover:text-gold sm:block" onClick={() => openAuth("login")}>Sign in</button>;
  const out = async () => { await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); setUser(null); setMenu(false); };
  const del = async () => {
    if (!confirm("Delete your account and saved readings? This cannot be undone.")) return;
    await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete" }) }); setUser(null); setMenu(false);
  };
  return (
    <div className="relative">
      <button onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Account menu" className="flex h-10 items-center gap-2 border border-gold/40 px-3 text-[.7rem] uppercase tracking-[.2em] text-champagne">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-midnight">{user.name[0]?.toUpperCase()}</span><span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
      </button>
      {menu && (
        <div className="glass absolute right-0 top-12 w-56 space-y-1 p-3 text-sm">
          <p className="truncate px-2 pb-2 text-xs text-ivory/50">{user.email}</p>
          <button className="block w-full px-2 py-2 text-left hover:text-gold" onClick={() => { setMenu(false); goTo("book"); }}>My bookings</button>
          <button className="block w-full px-2 py-2 text-left hover:text-gold" onClick={() => { setMenu(false); goTo("reading"); }}>My readings</button>
          <button className="block w-full px-2 py-2 text-left hover:text-gold" onClick={out}>Sign out</button>
          <button className="block w-full px-2 py-2 text-left text-red-300 hover:text-red-200" onClick={del}>Delete account</button>
        </div>
      )}
    </div>
  );
}
