"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IMG } from "@/config/site";
import { T, localReply, type Lang } from "@/lib/oracle";

type Msg = { role: "user" | "assistant"; content: string };
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\*/g, "");

export default function Oracle() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const t = T[lang];

  useEffect(() => {
    const h = () => setOpen(true);
    addEventListener("arcana:oracle", h);
    return () => removeEventListener("arcana:oracle", h);
  }, []);
  useEffect(() => { if (open && msgs.length === 0) setMsgs([{ role: "assistant", content: T[lang].hello }]); }, [open]); // eslint-disable-line
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);

  async function ask(q: string) {
    const message = q.trim();
    if (!message || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: message }];
    setMsgs(next); setText(""); setBusy(true);
    let reply = "";
    try {
      const r = await fetch("/api/oracle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, history: msgs.slice(1) }) });
      const d = await r.json();
      if (d.configured && d.reply) reply = d.reply;
    } catch {}
    if (!reply) { await new Promise((r) => setTimeout(r, 600)); reply = localReply(message, lang); }
    setMsgs([...next, { role: "assistant", content: reply }]); setBusy(false);
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} aria-label="Open the Tarot Oracle" aria-expanded={open}
        className="float-btn fixed bottom-5 right-5 z-[65] h-16 w-16 overflow-hidden rounded-full border border-gold shadow-[0_0_30px_rgba(214,179,109,.5)] transition hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.moonReader} alt="" className="h-full w-full object-cover object-[50%_18%] scale-[2.3]" />
        <span className="absolute inset-0 rounded-full" style={{ animation: "pulseGlow 3s infinite", boxShadow: "inset 0 0 18px rgba(214,179,109,.6)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
            className="glass fixed bottom-24 right-3 z-[65] flex h-[min(540px,70svh)] w-[min(380px,calc(100vw-24px))] flex-col sm:right-5" role="dialog" aria-label={t.title}>
            <div className="flex items-center justify-between border-b border-gold/25 p-4">
              <p className="font-display text-xl tracking-[.2em] text-champagne">{t.title}</p>
              <div className="flex items-center gap-3 text-xs">
                <button className="uppercase tracking-[.15em] text-lavender hover:text-gold" onClick={() => { const l = lang === "en" ? "hi" : "en"; setLang(l); setMsgs([{ role: "assistant", content: T[l].hello }]); }}>{t.lang}</button>
                <button aria-label="Close" className="text-ivory/70 hover:text-gold" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm font-light" aria-live="polite">
              {msgs.map((m, i) => (
                <p key={i} className={`max-w-[88%] whitespace-pre-line rounded-lg p-3 leading-relaxed ${m.role === "user" ? "ml-auto bg-gold/20 text-ivory" : "bg-royal/90 text-ivory/90"}`}>{clean(m.content)}</p>
              ))}
              {busy && <p className="w-14 rounded-lg bg-royal/90 p-3 text-gold" style={{ animation: "pulseGlow 1s infinite" }}>···</p>}
              <div ref={end} />
            </div>
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {t.chips.map((c) => <button key={c} onClick={() => ask(c)} className="rounded-full border border-gold/35 px-3 py-1 text-xs text-champagne transition hover:bg-gold hover:text-midnight">{c}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2 border-t border-gold/25 p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={400} placeholder={t.placeholder} aria-label="Message" className="min-w-0 flex-1 border border-gold/30 bg-midnight/95 px-3 py-2 text-sm" />
              <button className="btn !px-4 !py-2">{t.send}</button>
            </form>
            <p className="px-4 pb-3 text-[.65rem] text-ivory/45">{t.note}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
