"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES, MAJOR_ARCANA, shuffleDeck, type Category } from "@/data/tarot";
import { SPREADS, interpret, yesNo, yesNoLine, type Drawn, type SpreadKey } from "@/data/spreads";
import { CardBack, FlipCard } from "./TarotCard";
import { SITE, waLink, IMG } from "@/config/site";
import { startBooking } from "@/lib/events";
import { openAuth, useUser } from "@/lib/useUser";
import { MOODS } from "@/lib/mystic";
import Link from "next/link";

type Step = "setup" | "shuffle" | "pick" | "reveal";
type Saved = { id: string; at: number; spread: SpreadKey; category: Category; question: string; cards: { id: number; reversed: boolean }[] };
const HKEY = "arcana-readings";

const rnd = (n: number) => { const a = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };

function readingText(spread: SpreadKey, category: Category, question: string, drawn: Drawn[]) {
  const pos = SPREADS[spread].positions;
  const lines = drawn.map((d, i) => `${pos[i]}: ${d.card.name}${d.reversed ? " (reversed)" : ""}`);
  const yn = spread === "yesno" ? `\nSymbolic lean: ${yesNo(drawn[0])}` : "";
  return `✦ THE ARCANA · ${SPREADS[spread].label} (${category})\n${question ? `Question: ${question}\n` : ""}${lines.join("\n")}${yn}\n\nFor reflection & entertainment only.`;
}

function printReading(spread: SpreadKey, category: Category, question: string, drawn: Drawn[], notes: string[]) {
  const pos = SPREADS[spread].positions;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><title>My THE ARCANA reading</title><style>
  body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#222}
  h1{letter-spacing:.3em;font-weight:500;text-align:center;border-bottom:1px solid #b89a52;padding-bottom:14px}
  h2{font-size:18px;margin:22px 0 2px;color:#5b3a86} .k{color:#8a7440;font-size:12px;letter-spacing:.15em;text-transform:uppercase}
  p{line-height:1.6} .note{margin-top:30px;font-size:12px;color:#777;border-top:1px solid #ddd;padding-top:12px}</style>
  <h1>THE ARCANA</h1><p><b>${esc(SPREADS[spread].label)}</b> · ${esc(category)} · ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
  ${question ? `<p><i>“${esc(question)}”</i></p>` : ""}
  ${drawn.map((d, i) => `<h2>${esc(pos[i])}: ${esc(d.card.name)}${d.reversed ? " (reversed)" : ""}</h2><div class="k">${esc(d.card.keywords)}</div><p>${esc(d.reversed ? d.card.reversed : d.card.upright)}</p>`).join("")}
  <h2>Reflection</h2>${notes.map((n) => `<p>${esc(n)}</p>`).join("")}
  <p class="note">Tarot readings are for personal reflection and entertainment, not predictions, and not a substitute for medical, legal or financial advice.</p>
  <script>setTimeout(()=>window.print(),300)<\/script>`);
  w.document.close();
}

function DailyCard() {
  const [d, setD] = useState<{ day: string; id: number; reversed: boolean } | null>(null);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem("arcana-daily") || "null"); const day = new Date().toLocaleDateString("en-CA");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (s?.day === day) { setD(s); setFlipped(true); } } catch {}
  }, []);
  const draw = () => {
    const day = new Date().toLocaleDateString("en-CA");
    const s = { day, id: rnd(22), reversed: rnd(4) === 0 };
    try { localStorage.setItem("arcana-daily", JSON.stringify(s)); } catch {}
    setD(s); setTimeout(() => setFlipped(true), 100);
  };
  const card = d ? MAJOR_ARCANA[d.id] : null;
  return (
    <div className="glass frame mx-auto mb-14 grid max-w-3xl items-center gap-6 p-6 text-left sm:grid-cols-[150px_1fr] sm:p-8">
      <div className="mx-auto w-[120px] sm:w-full">
        <FlipCard card={card ?? MAJOR_ARCANA[0]} reversed={d?.reversed} flipped={flipped && !!d} className="aspect-[5/8] w-full" />
      </div>
      <div>
        <p className="eyebrow">Free · once a day</p>
        <h3 className="font-display mt-1 text-3xl text-champagne">{card ? `${card.name}${d?.reversed ? " (reversed)" : ""}` : "Your card of the day"}</h3>
        {card && d ? (
          <>
            <p className="mt-3 text-sm font-light leading-relaxed text-ivory/85">{d.reversed ? card.reversed : card.upright}</p>
            <p className="mt-2 text-xs text-ivory/50">Come back tomorrow for a new card.</p>
            <Link className="mr-5 mt-3 inline-block text-xs uppercase tracking-[.2em] text-lavender hover:text-gold" href="/journey">Daily reminder</Link><a className="mt-3 inline-block text-xs uppercase tracking-[.2em] text-lavender hover:text-gold" target="_blank" rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`My card of the day on THE ARCANA: ${card.name}${d.reversed ? " (reversed)" : ""} — ${card.keywords}`)}`}>Share on WhatsApp</a>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-light text-ivory/75">One free card for today&apos;s theme. Take a breath, then draw.</p>
            <button className="btn btn-solid mt-4" onClick={draw}>Draw today&apos;s card</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Reading() {
  const { user } = useUser();
  const [category, setCategory] = useState<Category>("general");
  const [question, setQuestion] = useState("");
  const [spreadKey, setSpreadKey] = useState<SpreadKey>("three");
  const [step, setStep] = useState<Step>("setup");
  const [deck, setDeck] = useState(() => [] as ReturnType<typeof shuffleDeck>);
  const [picked, setPicked] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [consent, setConsent] = useState(false);
  const [mood, setMood] = useState("");
  const [saved, setSaved] = useState("");
  const [history, setHistory] = useState<Saved[]>([]);
  const count = SPREADS[spreadKey].positions.length;

  const loadHistory = useCallback(async () => {
    let list: Saved[] = [];
    try { list = JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch {}
    if (user) {
      const j = await fetch("/api/readings").then((r) => r.json()).catch(() => ({ readings: [] }));
      const remote: Saved[] = (j.readings || []).map((r: { id: number; spread: SpreadKey; category: Category; question: string; cards: string; created: number }) => ({ id: "s" + r.id, at: r.created, spread: r.spread, category: r.category, question: r.question, cards: JSON.parse(r.cards) }));
      const keys = new Set(list.map((x) => x.at)); list = [...list, ...remote.filter((x) => !keys.has(x.at))].sort((a, b) => b.at - a.at);
    }
    setHistory(list.slice(0, 12));
  }, [user]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const reset = useCallback(() => { setStep("setup"); setPicked([]); setFlipped([]); setSaved(""); setConsent(false); }, []);
  useEffect(() => {
    const h = (e: Event) => { const c = (e as CustomEvent).detail?.category as Category | undefined; if (c) setCategory(c); reset(); };
    addEventListener("arcana:read", h); return () => removeEventListener("arcana:read", h);
  }, [reset]);

  function begin() { setDeck(shuffleDeck()); setPicked([]); setFlipped([]); setSaved(""); setStep("shuffle"); setTimeout(() => setStep("pick"), 2600); }
  function pick(i: number) {
    if (picked.includes(i) || picked.length >= count) return;
    const next = [...picked, i]; setPicked(next);
    if (next.length === count) {
      const gap = count > 3 ? 380 : 900;
      setTimeout(() => {
        setStep("reveal"); setFlipped(next.map(() => false));
        next.forEach((_, k) => setTimeout(() => setFlipped((f) => f.map((v, j) => (j === k ? true : v))), 700 + k * gap));
      }, 900);
    }
  }

  const drawn: Drawn[] = useMemo(() => picked.map((i) => deck[i]), [picked, deck]);
  const allFlipped = flipped.length > 0 && flipped.every(Boolean);
  const notes = useMemo(() => (allFlipped ? interpret(spreadKey, category, question, drawn) : []), [allFlipped, spreadKey, category, question, drawn]);
  const pos = SPREADS[spreadKey].positions;

  async function save() {
    const rec: Saved = { id: String(Date.now()), at: Date.now(), spread: spreadKey, category, question, cards: drawn.map((d) => ({ id: d.card.id, reversed: d.reversed })) };
    try { const l = JSON.parse(localStorage.getItem(HKEY) || "[]"); localStorage.setItem(HKEY, JSON.stringify([rec, ...l].slice(0, 30))); } catch {}
    if (user) await fetch("/api/readings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ spread: spreadKey, category, question, cards: rec.cards, consent: true }) });
    setSaved(user ? "Saved to your account and this device." : "Saved on this device."); loadHistory();
  }
  const clearHistory = async () => {
    try { localStorage.removeItem(HKEY); } catch {}
    if (user) for (const h of history) if (h.id.startsWith("s")) await fetch(`/api/readings?id=${h.id.slice(1)}`, { method: "DELETE" });
    setHistory([]);
  };

  return (
    <section id="reading" className="relative isolate overflow-hidden px-5 py-28 sm:px-8" aria-labelledby="read-h">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG.chamber} alt="" aria-hidden loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#0b0812,rgba(11,8,18,.55)_20%,rgba(11,8,18,.7)_80%,#0b0812)]" />
      <div className="mx-auto max-w-5xl text-center">
        <p className="eyebrow mb-4">The tarot chamber</p>
        <h2 id="read-h" className="h-hero text-[clamp(2rem,5.5vw,4.2rem)]">The cards are waiting. <span className="gold-text italic">Are you ready?</span></h2>
        <p className="mx-auto mt-4 max-w-md font-light text-ivory/80">Take a breath. Think of your question. Trust your intuition.</p>

        <div className="mt-12"><DailyCard /></div>

        <div className="min-h-[440px]">
          <AnimatePresence mode="wait">
            {step === "setup" && (
              <motion.div key="setup" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass frame mx-auto max-w-2xl space-y-8 p-6 text-left sm:p-10">
                <fieldset>
                  <legend className="eyebrow mb-3">How are you feeling? (optional)</legend>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => <button type="button" key={m.id} aria-pressed={mood === m.id} onClick={() => { setMood(m.id); setCategory(m.category); setSpreadKey(m.spread); setQuestion(m.prompt); }} className={`rounded-full border px-4 py-2 text-sm transition ${mood === m.id ? "border-gold bg-gold text-midnight" : "border-gold/30 hover:border-gold"}`}>{m.emoji} {m.label}</button>)}
                  </div>
                  {mood && <p className="mt-2 text-xs text-lavender">We suggested a spread and a question to match your mood. Change anything you like.</p>}
                </fieldset>
                <fieldset>
                  <legend className="eyebrow mb-3">1 · Choose your reading</legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {CATEGORIES.map((c) => (
                      <button key={c.id} onClick={() => setCategory(c.id)} aria-pressed={category === c.id} className={`border p-4 text-left transition ${category === c.id ? "border-gold bg-gold/15" : "border-gold/25 hover:border-gold/60"}`}>
                        <span className="font-display text-xl text-champagne">{c.label}</span><span className="mt-1 block text-xs font-light text-ivory/65">{c.hint}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="eyebrow mb-3">2 · Your spread</legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(Object.keys(SPREADS) as SpreadKey[]).map((k) => (
                      <button key={k} onClick={() => setSpreadKey(k)} aria-pressed={spreadKey === k} className={`border p-3 text-left transition ${spreadKey === k ? "border-gold bg-gold/15" : "border-gold/25 hover:border-gold/60"}`}>
                        <span className="font-display text-lg text-champagne">{SPREADS[k].label}</span><span className="mt-1 block text-[.7rem] font-light text-ivory/65">{SPREADS[k].sub}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="q" className="eyebrow mb-3 block">3 · Your question {spreadKey === "yesno" ? "" : "(optional)"}</label>
                  <textarea id="q" value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 240))} rows={2} placeholder={spreadKey === "yesno" ? "Ask a yes-or-no question…" : "What do I most need to understand right now?"} className="w-full border border-gold/30 bg-midnight/95 p-3 font-light text-ivory placeholder:text-ivory/35" />
                </div>
                <button className="btn btn-solid w-full" onClick={begin}>Shuffle the deck</button>
              </motion.div>
            )}

            {step === "shuffle" && (
              <motion.div key="shuffle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative mx-auto mt-10 h-72 w-48" aria-live="polite">
                {Array.from({ length: 9 }).map((_, i) => (
                  <motion.div key={i} className="absolute inset-0 overflow-hidden rounded-xl border border-gold/50" animate={{ x: [0, i % 2 ? 130 : -130, 0], rotate: [0, i % 2 ? 14 : -14, 0], zIndex: [i, 20 - i, i] }} transition={{ duration: 0.9, repeat: 2, delay: i * 0.07, ease: "easeInOut" }}><CardBack /></motion.div>
                ))}
                <p className="eyebrow absolute inset-x-0 -bottom-12">Shuffling…</p>
              </motion.div>
            )}

            {step === "pick" && (
              <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="eyebrow mb-8" aria-live="polite">Choose {count - picked.length} {count - picked.length === 1 ? "card" : "cards"}{count > 3 && picked.length < count ? ` · next: ${pos[picked.length]}` : ""}</p>
                <div className="scrollbar-none -mx-5 flex justify-start overflow-x-auto px-5 pb-6 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-y-6 sm:overflow-visible" style={{ perspective: 1000 }}>
                  {deck.map((_, i) => {
                    const sel = picked.includes(i);
                    return (
                      <motion.button key={i} onClick={() => pick(i)} disabled={sel} aria-label={`Card ${i + 1} of ${deck.length}`} initial={{ opacity: 0, y: 60 }} animate={{ opacity: sel ? 0.25 : 1, y: sel ? -26 : 0 }} transition={{ delay: i * 0.03 }} whileHover={sel ? {} : { y: -22, scale: 1.08, zIndex: 30 }}
                        className="relative -mr-9 aspect-[5/8] w-[88px] shrink-0 overflow-hidden rounded-xl border border-gold/55 shadow-[0_6px_24px_rgba(0,0,0,.6)] sm:mr-[-30px] sm:w-[96px]" style={{ rotate: `${(i - 10.5) * 1.6}deg` }}><CardBack /></motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === "reveal" && (
              <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left">
                <div className={`mx-auto grid gap-8 ${count === 3 ? "sm:grid-cols-3" : count === 10 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "max-w-md"}`}>
                  {drawn.map((s, i) => (
                    <div key={s.card.id} className="space-y-4">
                      <p className="eyebrow text-center">{pos[i]}</p>
                      <FlipCard card={s.card} reversed={s.reversed} flipped={!!flipped[i]} className={`mx-auto aspect-[5/8] ${count === 10 ? "w-[78%]" : "w-[70%] max-w-[220px]"}`} />
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={flipped[i] ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 }} className="glass p-4">
                        <h3 className="font-display text-xl text-champagne">{s.card.name}{s.reversed && <span className="ml-2 text-sm italic text-lavender">reversed</span>}</h3>
                        <p className="eyebrow mt-1 !text-[.6rem] !text-lavender">{s.card.keywords}</p>
                        {spreadKey === "yesno" && <p className="font-display mt-3 text-5xl text-gold">{yesNo(s)}</p>}
                        <p className="mt-2 text-sm font-light leading-relaxed text-ivory/90">{spreadKey === "yesno" ? yesNoLine(yesNo(s)) : s.reversed ? s.card.reversed : s.card.upright}</p>
                      </motion.div>
                    </div>
                  ))}
                </div>

                {allFlipped && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mx-auto mt-12 max-w-2xl">
                    <div className="glass frame space-y-4 p-6 sm:p-8">
                      <p className="eyebrow">Your reading</p>
                      {notes.map((n, i) => <p key={i} className="font-light leading-relaxed text-ivory/90">{n}</p>)}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <a className="btn btn-solid" href={waLink(`Hi! I pulled cards on THE ARCANA and would like to book a personal reading.\n\n${readingText(spreadKey, category, question, drawn)}`)} target="_blank" rel="noopener noreferrer">Book a personal reading</a>
                      <button className="btn" onClick={() => startBooking()}>Choose a time slot</button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-[.18em]">
                      <a className="text-lavender hover:text-gold" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(readingText(spreadKey, category, question, drawn))}`}>Share on WhatsApp</a>
                      <button className="text-lavender hover:text-gold" onClick={() => printReading(spreadKey, category, question, drawn, notes)}>Download PDF</button>
                      <button className="text-lavender hover:text-gold" onClick={reset}>Draw again</button>
                    </div>
                    <div className="mx-auto mt-6 max-w-md text-center text-xs font-light text-ivory/70">
                      {saved ? <p role="status" className="text-emerald-300">{saved}</p> : (
                        <>
                          <label className="flex items-start justify-center gap-2 text-left"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /><span>Save this reading (including my question) {user ? "to my account and this device" : "on this device"}.</span></label>
                          <button className="btn mt-3 !py-2 disabled:opacity-40" disabled={!consent} onClick={save}>Save reading</button>
                          {!user && <p className="mt-2">Want it on every device? <button className="text-gold underline" onClick={() => openAuth("register")}>Create a free account</button></p>}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {history.length > 0 && (
          <div className="glass mx-auto mt-16 max-w-2xl p-6 text-left" aria-labelledby="hist-h">
            <div className="flex items-center justify-between"><p id="hist-h" className="eyebrow">My readings</p><button className="text-xs uppercase tracking-[.15em] text-lavender hover:text-gold" onClick={clearHistory}>Clear all</button></div>
            <ul className="mt-4 space-y-3 text-sm font-light">
              {history.map((h) => (
                <li key={h.id} className="border-b border-gold/15 pb-3">
                  <p className="text-champagne">{SPREADS[h.spread]?.label} · {h.category} <span className="text-ivory/50">· {new Date(h.at).toLocaleDateString("en-IN")}</span></p>
                  {h.question && <p className="italic text-ivory/60">“{h.question}”</p>}
                  <p className="text-ivory/75">{h.cards.map((c) => `${MAJOR_ARCANA[c.id].name}${c.reversed ? " (r)" : ""}`).join(" · ")}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mx-auto mt-10 max-w-xl text-xs font-light leading-relaxed text-ivory/55">
          Automated readings are for reflection and entertainment. They are not predictions or guarantees, and not a substitute for medical, legal or financial advice. Cards are drawn at random from a freshly shuffled deck with no repeats.
          Readings are saved only if you tick the box above. {SITE.name} does not read your questions otherwise.
        </p>
      </div>
    </section>
  );
}
