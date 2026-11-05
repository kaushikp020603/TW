"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GuidanceCard from "./GuidanceCard";
import { SERVICES, waLink } from "@/config/site";
import { startBooking } from "@/lib/events";
import type { Motif } from "@/data/shop";

type Pts = Partial<Record<(typeof SERVICES)[number]["id"], number>>;
type Opt = { glyph: string; label: string; sub: string; pts: Pts; why: string };

const QUESTIONS: { q: string; hint: string; opts: Opt[] }[] = [
  { q: "What is stirring in your heart?", hint: "Pick the one that feels closest.", opts: [
    { glyph: "♡", label: "Love and connection", sub: "Someone, or the lack of someone", pts: { love: 4, three: 1 }, why: "your heart is asking about relationships" },
    { glyph: "☉", label: "Work and purpose", sub: "Direction, money, next steps", pts: { career: 4, three: 1 }, why: "you are weighing a decision about work or direction" },
    { glyph: "☽", label: "Who I am becoming", sub: "Growth, habits, inner themes", pts: { growth: 4, call30: 1 }, why: "you are looking inward at who you are becoming" },
    { glyph: "✦", label: "Something I can't name", sub: "A feeling without a label", pts: { three: 3, one: 1, call30: 1 }, why: "there is something you can't quite put into words yet" },
  ] },
  { q: "How does it feel right now?", hint: "Be honest. There is no wrong answer.", opts: [
    { glyph: "☁", label: "Foggy and unsure", sub: "I need clarity", pts: { three: 3, one: 1 }, why: "you want clarity" },
    { glyph: "⚡", label: "Anxious or overwhelmed", sub: "I need to talk it through", pts: { call30: 3, call60: 1 }, why: "you would feel better talking it through" },
    { glyph: "⌛", label: "Stuck in the same place", sub: "I need a new perspective", pts: { growth: 2, career: 2, three: 1 }, why: "you feel stuck and want a fresh angle" },
    { glyph: "✧", label: "Curious and open", sub: "I would like to explore", pts: { one: 2, three: 2, growth: 1 }, why: "you are curious and open" },
  ] },
  { q: "What would help you most?", hint: "Think about how you like to receive guidance.", opts: [
    { glyph: "①", label: "A quick, focused answer", sub: "One card, one message", pts: { one: 4 }, why: "a short, focused answer suits you" },
    { glyph: "③", label: "A clear story", sub: "Past, present and what's ahead", pts: { three: 4, love: 1, career: 1 }, why: "you like seeing the story behind a situation" },
    { glyph: "∞", label: "A deep, detailed look", sub: "Themes, patterns, reflections", pts: { growth: 3, love: 2, career: 2 }, why: "you want a deeper, more detailed look" },
    { glyph: "☎", label: "A live conversation", sub: "Voice or video with the reader", pts: { call30: 3, call60: 2 }, why: "you would like to speak with the reader live" },
  ] },
  { q: "How much time would you like?", hint: "Last one, then the cards decide.", opts: [
    { glyph: "⏱", label: "A few minutes", sub: "Fast and light", pts: { one: 3 }, why: "you are short on time" },
    { glyph: "☕", label: "Some time today", sub: "A calm written reading", pts: { three: 2, love: 1, career: 1, growth: 1 }, why: "you have some time to sit with it" },
    { glyph: "◐", label: "About half an hour", sub: "A proper conversation", pts: { call30: 4 }, why: "half an hour feels right" },
    { glyph: "☾", label: "An unhurried hour", sub: "Take all the time I need", pts: { call60: 5 }, why: "you want to take your time" },
  ] },
];

const MOTIF: Record<string, { motif: Motif; title: string; msg: string; hue: number }> = {
  one: { motif: "star", title: "Begin", msg: "A perfect moment never arrives. This imperfect one will do.", hue: 270 },
  three: { motif: "moon", title: "Trust", msg: "You are further along than you think. Let the path appear.", hue: 262 },
  love: { motif: "heart", title: "Heal", msg: "Be as gentle with yourself as you would be with a friend.", hue: 330 },
  career: { motif: "crown", title: "Worth", msg: "You do not have to earn your place here. You were already invited.", hue: 40 },
  growth: { motif: "lotus", title: "Release", msg: "Put down what is no longer yours to carry.", hue: 292 },
  call30: { motif: "eye", title: "Clarity", msg: "Be still and the water clears. The answer is already in the room.", hue: 225 },
  call60: { motif: "sun", title: "Glow", msg: "Your light does not need to be loud to be seen.", hue: 44 },
};

const slide = { enter: (d: number) => ({ opacity: 0, x: d * 60, filter: "blur(6px)" }), center: { opacity: 1, x: 0, filter: "blur(0px)" }, exit: (d: number) => ({ opacity: 0, x: d * -60, filter: "blur(6px)" }) };

/** "Not sure where to begin?": four gentle questions, a moment of shuffling, then a revealed card with a suggested reading. */
export default function Quiz() {
  const [step, setStep] = useState(0); const [dir, setDir] = useState(1);
  const [picks, setPicks] = useState<number[]>([]);
  const [phase, setPhase] = useState<"ask" | "think" | "result">("ask");
  const [flip, setFlip] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const ranked = useMemo(() => {
    const score: Record<string, number> = {};
    picks.forEach((o, qi) => { const pts = QUESTIONS[qi].opts[o].pts; for (const [k, v] of Object.entries(pts)) score[k] = (score[k] || 0) + (v || 0) * (qi === 0 ? 1.4 : 1); });
    return Object.entries(score).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [picks]);
  const best = SERVICES.find((s) => s.id === ranked[0]) ?? SERVICES[1];
  const alt = SERVICES.find((s) => s.id === ranked[1] && s.id !== best.id);
  const why = picks.length === QUESTIONS.length ? picks.map((o, i) => QUESTIONS[i].opts[o].why).slice(0, 3) : [];

  useEffect(() => {
    if (phase !== "think") return;
    const t = setTimeout(() => { setPhase("result"); setTimeout(() => setFlip(true), 350); }, 2300);
    return () => clearTimeout(t);
  }, [phase]);

  const choose = (o: number) => {
    const next = [...picks.slice(0, step), o]; setPicks(next); setDir(1);
    if (step + 1 >= QUESTIONS.length) setPhase("think"); else setStep(step + 1);
  };
  const back = () => { if (step > 0) { setDir(-1); setStep(step - 1); } };
  const restart = () => { setPicks([]); setStep(0); setDir(1); setFlip(false); setPhase("ask"); top.current?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const card = MOTIF[best.id];

  return (
    <section id="quiz" className="relative overflow-hidden px-4 py-20 sm:px-8 sm:py-28" aria-labelledby="quiz-h">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_55%_at_50%_45%,rgba(143,112,224,.28),transparent_70%)]" />
      <div ref={top} className="glass relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-gold/20" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full border border-gold/10" aria-hidden />
        <div className="relative text-center">
          <p className="eyebrow">Not sure where to begin?</p>
          <h2 id="quiz-h" className="h-hero mt-3 text-[clamp(1.8rem,4.4vw,3rem)]">Let the cards <span className="shimmer-text italic">choose for you</span></h2>

          {/* constellation progress */}
          <ol className="mx-auto mt-6 flex max-w-xs items-center" aria-label={`Question ${Math.min(step + 1, 4)} of 4`}>
            {QUESTIONS.map((_, i) => {
              const done = phase !== "ask" || i < step, now = phase === "ask" && i === step;
              return (
                <li key={i} className="flex flex-1 items-center last:flex-none" aria-current={now ? "step" : undefined}>
                  <motion.span animate={{ scale: now ? 1.25 : 1, backgroundColor: done || now ? "#d6b36d" : "rgba(214,179,109,.25)" }} className="relative block h-3 w-3 rotate-45 rounded-[2px]">
                    {now && <span className="absolute -inset-1.5 animate-ping rounded-[2px] border border-gold/60" />}
                  </motion.span>
                  {i < QUESTIONS.length - 1 && <span className="mx-1.5 h-px flex-1 overflow-hidden bg-gold/20"><motion.span className="block h-full bg-gold" initial={false} animate={{ width: done ? "100%" : "0%" }} transition={{ duration: 0.6 }} /></span>}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative mt-8 min-h-[22rem]">
          <AnimatePresence mode="wait" custom={dir}>
            {phase === "ask" && (
              <motion.div key={"q" + step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}>
                <p className="text-center font-display text-2xl text-champagne sm:text-3xl">{QUESTIONS[step].q}</p>
                <p className="mt-1 text-center text-sm text-lavender">{QUESTIONS[step].hint}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label={QUESTIONS[step].q}>
                  {QUESTIONS[step].opts.map((o, i) => (
                    <motion.button key={o.label} type="button" onClick={() => choose(i)} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i + 0.1 }} whileTap={{ scale: 0.97 }}
                      className={`tilt group flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors hover:border-gold hover:bg-gold/10 ${picks[step] === i ? "border-gold bg-gold/10" : "border-gold/30 bg-[#1b1240]"}`}>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-[radial-gradient(circle_at_30%_30%,rgba(255,250,240,.2),transparent)] font-display text-2xl text-champagne transition group-hover:scale-110 group-hover:border-gold">{o.glyph}</span>
                      <span><span className="block text-base text-ivory">{o.label}</span><span className="block text-xs font-light text-ivory/60">{o.sub}</span></span>
                    </motion.button>
                  ))}
                </div>
                {step > 0 && <div className="mt-5 text-center"><button type="button" onClick={back} className="text-xs uppercase tracking-[.25em] text-champagne/70 hover:text-gold">← Back</button></div>}
              </motion.div>
            )}

            {phase === "think" && (
              <motion.div key="think" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[22rem] flex-col items-center justify-center" role="status" aria-live="polite">
                <div className="relative h-36 w-44" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="absolute left-1/2 top-1/2 h-28 w-[4.4rem] rounded-lg border border-gold/60 bg-[linear-gradient(160deg,#4a3496,#1b1240)] shadow-[0_0_24px_rgba(214,179,109,.35)]"
                      style={{ marginLeft: "-2.2rem", marginTop: "-3.5rem" }} animate={{ rotate: [0, (i - 1) * 24, 0, (1 - i) * 24, 0], x: [0, (i - 1) * 34, 0, (i - 1) * -34, 0], y: [0, -8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}>
                      <span className="flex h-full items-center justify-center text-xl text-champagne">✦</span>
                    </motion.div>
                  ))}
                </div>
                <p className="mt-6 font-display text-2xl italic text-champagne">Consulting the cards…</p>
                <p className="mt-1 text-sm text-ivory/60">Matching your answers to the right reading</p>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid items-center gap-8 md:grid-cols-[13rem_1fr]" aria-live="polite">
                <div className="mx-auto w-44 md:w-52" style={{ perspective: 1000 }}>
                  <motion.div animate={{ rotateY: flip ? 0 : 180 }} initial={{ rotateY: 180 }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} style={{ transformStyle: "preserve-3d" }} className="relative aspect-[5/8]">
                    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-gold/70 shadow-[0_0_60px_rgba(214,179,109,.4)]" style={{ backfaceVisibility: "hidden" }}>
                      <GuidanceCard card={{ title: card.title, message: card.msg, motif: card.motif, hue: card.hue }} uid="quiz" className="h-full w-full" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-gold/60 bg-[linear-gradient(160deg,#4a3496,#1b1240)] text-3xl text-champagne" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>✦</div>
                  </motion.div>
                </div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: flip ? 1 : 0, y: flip ? 0 : 16 }} transition={{ delay: 0.5, duration: 0.7 }} className="text-center md:text-left">
                  <p className="eyebrow">The cards suggest</p>
                  <h3 className="mt-2 font-display text-3xl text-champagne sm:text-4xl">{best.name}</h3>
                  <p className="mt-1 text-sm text-lavender">{best.mins} · <span className="text-champagne">₹{best.price}</span></p>
                  <p className="mt-4 font-light leading-relaxed text-ivory/85">{best.blurb}</p>
                  {why.length > 0 && <ul className="mt-4 space-y-1.5 text-sm font-light text-ivory/75">{why.map((w) => <li key={w} className="flex gap-2"><span className="text-gold">✦</span>It fits because {w}.</li>)}</ul>}
                  <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                    <button className="btn btn-solid" onClick={() => startBooking(best.id)}>Book this reading</button>
                    <a className="btn" href={waLink(`Hi! The quiz suggested a ${best.name} for me. Could you tell me more?`)} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs md:justify-start">
                    {alt && <button className="py-2 uppercase tracking-[.2em] text-champagne/80 hover:text-gold" onClick={() => startBooking(alt.id)}>Or try {alt.name} · ₹{alt.price}</button>}
                    <button className="py-2 uppercase tracking-[.2em] text-champagne/80 hover:text-gold" onClick={restart}>Start again</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
