"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import Film from "./Film";
import { CardFan } from "./GuidanceCard";
import { startBooking } from "@/lib/events";
import { useState } from "react";
import { useUser } from "@/lib/useUser";

const rise = { hidden: { opacity: 0, y: 36 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] as const } } };

function Frame({ n, src, label, flip = false }: { n: number; src: string; label: string; flip?: boolean }) {
  return (
    <motion.div variants={rise} className={`relative ${flip ? "lg:order-2" : ""}`}>
      <div className="frame tilt overflow-hidden rounded-sm border border-gold/50 shadow-[0_30px_80px_rgba(27,18,64,.35)]">
        <Film src={src} poster={`/videos/${n}.jpg`} label={label} className="film-fx aspect-video w-full bg-[#1b1240] object-cover" />
      </div>
    </motion.div>
  );
}

/** Video 2: a light, ivory band that breaks up the dark sections. */
export function MeetScene() {
  return (
    <section id="meet" className="pearl relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="meet-h">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12%" }} transition={{ staggerChildren: 0.15 }} className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <Frame n={2} src="/videos/2.mp4" label="The reader listens as a guest shares a question over the tarot table" />
        <div>
          <motion.p variants={rise} className="eyebrow">Chapter II · The Welcome</motion.p>
          <motion.h2 variants={rise} id="meet-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.6rem)]">A space where your <span className="gold-text italic">questions matter.</span></motion.h2>
          <motion.p variants={rise} className="mt-5 max-w-md text-lg font-light leading-relaxed">Every story deserves to be heard. Every question deserves a moment of clarity. Your reader listens first, then lets the cards help you see your situation more calmly.</motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="btn btn-solid">Meet your reader</Link>
            <button className="btn" onClick={() => startBooking()}>Book a reading</button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/** Video 3: introduces the interactive pick-a-card experience that follows. */
export function CardsScene() {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="cards-h">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12%" }} transition={{ staggerChildren: 0.15 }} className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div className="lg:order-1">
          <motion.p variants={rise} className="eyebrow">Chapter III · The Cards Speak</motion.p>
          <motion.h2 variants={rise} id="cards-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.6rem)]">Pick a card. <span className="gold-text italic">Discover a story.</span></motion.h2>
          <motion.p variants={rise} className="mt-5 max-w-md text-lg font-light leading-relaxed text-ivory/85">The cards you choose might reveal a perspective you never expected.</motion.p>
          <motion.div variants={rise} className="mt-8"><Link href="/cards" className="btn btn-solid">Explore the cards</Link></motion.div>
        </div>
        <Frame n={3} src="/videos/3.mp4" label="Tarot cards rise from the table and glow with purple and gold light" flip />
      </motion.div>
    </section>
  );
}

/** Video 4: the revelation, in a light band, leading into the reading categories. */
export function RevelationScene() {
  return (
    <section id="revelation" className="pearl relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="rev-h">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12%" }} transition={{ staggerChildren: 0.15 }} className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <Frame n={4} src="/videos/4.mp4" label="A star card is revealed and a hopeful vision rises from it" />
        <div>
          <motion.p variants={rise} className="eyebrow">Chapter V · The Revelation</motion.p>
          <motion.h2 variants={rise} id="rev-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.6rem)]">Sometimes, a little clarity <span className="gold-text italic">changes everything.</span></motion.h2>
          <motion.p variants={rise} className="mt-5 max-w-md text-lg font-light leading-relaxed">Explore the possibilities. Reflect on your journey. Find your own direction.</motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
            <button className="btn btn-solid" onClick={() => startBooking()}>Book a reading</button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/** Teaser for the card shop, between the booking form and the testimonials. */
export function ShopScene() {
  return (
    <section id="shop" className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="shop-h">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12%" }} transition={{ staggerChildren: 0.15 }} className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <motion.p variants={rise} className="eyebrow">Chapter VI · Keepsakes</motion.p>
          <motion.h2 variants={rise} id="shop-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.6rem)]">Guidance you can <span className="gold-text italic">hold in your hands.</span></motion.h2>
          <motion.p variants={rise} className="mt-5 max-w-md text-lg font-light leading-relaxed text-ivory/85">Our own gold-foil guidance cards, pocket tarot and cards designed just for you or someone you love. Order on WhatsApp, we deliver across India.</motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="btn btn-solid">Visit the card shop</Link></motion.div>
        </div>
        <motion.div variants={rise}><CardFan art="moon" className="max-w-[360px]" /></motion.div>
      </motion.div>
    </section>
  );
}

/** One quiet line of narration between chapters. */
export function Beat({ children }: { children: React.ReactNode }) {
  return <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 1 }} className="beat"><p>{children}</p></motion.div>;
}

const QUIZ = [
  { q: "What is on your mind most?", a: [["Someone special", "love"], ["My work or money", "career"], ["Who I am becoming", "growth"], ["I am not sure yet", "three"]] },
  { q: "What kind of guidance do you want?", a: [["A quick answer", "one"], ["A clear story", "three"], ["A deep look", "growth"], ["To talk it through", "call30"]] },
  { q: "How much time do you have?", a: [["Just a few minutes", "one"], ["Some time today", "three"], ["Half an hour", "call30"], ["An unhurried hour", "call60"]] },
] as const;
const NAMES: Record<string, string> = { one: "One-Card Reading", three: "Three-Card Reading", love: "Love & Relationships", career: "Career & Purpose", growth: "Self-Discovery", call30: "30-Min Personal Session", call60: "60-Min Personal Session" };

/** Three questions, one suggested reading. */
export function Quiz() {
  const [step, setStep] = useState(0); const [picks, setPicks] = useState<string[]>([]);
  const done = step >= QUIZ.length;
  const best = (() => { const c: Record<string, number> = {}; picks.forEach((p, i) => (c[p] = (c[p] || 0) + (i === 0 ? 1.5 : 1))); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || "three"; })();
  return (
    <section id="quiz" className="px-5 py-20 sm:px-8" aria-labelledby="quiz-h">
      <div className="glass mx-auto max-w-2xl rounded-2xl p-7 text-center sm:p-10">
        <p className="eyebrow">Not sure where to begin?</p>
        <h2 id="quiz-h" className="h-hero mt-3 text-[clamp(1.7rem,4vw,2.6rem)]">Which reading is <span className="gold-text italic">for me?</span></h2>
        {!done ? (
          <div className="mt-6">
            <p className="text-sm text-lavender">Question {step + 1} of {QUIZ.length}</p>
            <p className="mt-2 font-display text-2xl text-champagne">{QUIZ[step].q}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{QUIZ[step].a.map(([label, key]) => <button key={label} className="btn" onClick={() => { setPicks([...picks, key]); setStep(step + 1); }}>{label}</button>)}</div>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-lavender">We suggest</p>
            <p className="mt-2 font-display text-3xl text-champagne">{NAMES[best]}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><button className="btn btn-solid" onClick={() => startBooking(best)}>Book this reading</button><button className="btn" onClick={() => { setStep(0); setPicks([]); }}>Start again</button></div>
          </div>
        )}
      </div>
    </section>
  );
}

/** For signed-in clients: a friendly nudge toward their next reading. */
export function WelcomeBack() {
  const { user } = useUser(); const [hide, setHide] = useState(false);
  if (!user || hide) return null;
  return (
    <div role="status" className="relative z-20 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-b-2xl border border-t-0 border-gold/40 bg-[#2a1c5c] px-5 py-3 text-sm sm:px-6">
      <span>Welcome back, <b className="text-champagne">{user.name.split(" ")[0]}</b> ✦ Ready for your next reading?</span>
      <span className="flex items-center gap-2"><button className="btn btn-solid !px-4 !py-2" onClick={() => startBooking()}>Book now</button><button aria-label="Dismiss" className="h-10 w-10 text-xl text-ivory/60" onClick={() => setHide(true)}>×</button></span>
    </div>
  );
}
