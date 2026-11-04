"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { openAuth, setUser, useUser } from "@/lib/useUser";
import { goTo } from "@/lib/events";
import { track } from "@/lib/track";
import { waLink } from "@/config/site";

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [sent, setSent] = useState<null | { emailSent: boolean }>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = (e: Event) => { setMode((e as CustomEvent).detail?.mode || "login"); setErr(""); setSent(null); setOpen(true); };
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
    if (mode === "forgot") { setSent({ emailSent: !!j.emailSent }); return; }
    if (mode === "register") track("signup");
    setUser(j.user); setOpen(false); setF({ name: "", email: "", phone: "", password: "" });
  }
  if (typeof document === "undefined") return null;
  const inp = "w-full border border-gold/30 bg-midnight/95 p-3 font-light";
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-midnight/92 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.form onSubmit={submit} onClick={(e) => e.stopPropagation()} initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} role="dialog" aria-modal="true" aria-label={mode === "login" ? "Sign in" : "Create account"} className="glass frame w-full max-w-md space-y-4 p-8">
            <h2 className="h-hero text-3xl">{mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset your password"}</h2>
            {sent ? (
              <div className="space-y-4" role="status">
                {sent.emailSent
                  ? <p className="text-sm font-light text-ivory/85">If an account exists for <b>{f.email}</b>, we&apos;ve emailed a link to choose a new password. It works for one hour.</p>
                  : <><p className="text-sm font-light text-ivory/85">Request noted. For your security the reader will send you a one-time reset link on WhatsApp. You can speed it up by messaging now.</p>
                    <a className="btn btn-solid w-full" target="_blank" rel="noopener noreferrer" href={waLink(`Hi! I forgot my password for THE ARCANA. The email on my account is ${f.email}. Please send me a reset link.`)}>Message the reader on WhatsApp</a></>}
                <button type="button" className="block w-full text-center text-xs uppercase tracking-[.2em] text-lavender hover:text-gold" onClick={() => { setSent(null); setMode("login"); }}>Back to sign in</button>
              </div>
            ) : (<>
              <p className="text-xs font-light text-ivory/60">{mode === "forgot" ? "Enter the email on your account and we'll help you set a new password." : "An account lets you keep your readings and bookings together. You can also book as a guest."}</p>
              {mode === "register" && <>
                <input className={inp} placeholder="Your name" aria-label="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
                <input className={inp} placeholder="WhatsApp number (optional)" aria-label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" />
              </>}
              <input className={inp} type="email" placeholder="Email" aria-label="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
              {mode !== "forgot" && <input className={inp} type="password" placeholder="Password (8+ characters)" aria-label="Password" required minLength={mode === "register" ? 8 : 1} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} />}
              {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
              <button className="btn btn-solid w-full" disabled={busy}>{busy ? "…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset help"}</button>
              {mode === "login" && <button type="button" className="block w-full py-1 text-center text-xs text-lavender hover:text-gold" onClick={() => { setMode("forgot"); setErr(""); }}>Forgot your password?</button>}
              <button type="button" className="block w-full text-center text-xs uppercase tracking-[.2em] text-lavender hover:text-gold" onClick={() => { setMode(mode === "register" ? "login" : mode === "forgot" ? "login" : "register"); setErr(""); }}>
                {mode === "login" ? "New here? Create an account" : mode === "register" ? "Have an account? Sign in" : "Back to sign in"}
              </button>
            </>)}
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
