"use client";
import Film from "./Film";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMG, SITE, waLink } from "@/config/site";
import { startBooking } from "@/lib/events";
import { track } from "@/lib/track";
import InstallButton from "./InstallButton";
import { CardBack } from "./TarotCard";

gsap.registerPlugin(ScrollTrigger);


const STEPS = [
  { n: "01", t: "Ask your question", d: "Think about what you want clarity on.", i: <path d="M32 54V30M32 22v-2M18 32a14 14 0 1 1 28 0c0 8-8 8-8 14" /> },
  { n: "02", t: "Let the cards speak", d: "Choose your cards and explore their symbolism.", i: <><rect x="16" y="14" width="22" height="34" rx="3" /><rect x="26" y="18" width="22" height="34" rx="3" /><circle cx="37" cy="35" r="4" /></> },
  { n: "03", t: "Discover your reading", d: "Receive your interpretation and reflective guidance.", i: <><circle cx="32" cy="32" r="14" /><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6" /></> },
];
export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hw-line", { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", ease: "none", scrollTrigger: { trigger: ref.current, start: "top 75%", end: "bottom 60%", scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section id="how" className="px-5 py-24 sm:px-8" aria-labelledby="how-h">
      <div className="mx-auto max-w-6xl text-center">
        <p className="eyebrow mb-4">How it works</p>
        <h2 id="how-h" className="h-hero text-[clamp(2rem,5vw,3.8rem)]">Three steps to <span className="gold-text italic">clarity</span></h2>
        <div ref={ref} className="relative mt-16 grid gap-10 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gold/15 md:block"><div className="hw-line h-full bg-gold" /></div>
          {STEPS.map((s, k) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.15, duration: 0.9 }} className="relative">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/60 bg-midnight shadow-[0_0_30px_rgba(214,179,109,.2)]">
                <svg viewBox="0 0 64 64" className="h-10 w-10" fill="none" stroke="#d6b36d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{s.i}</svg>
              </div>
              <p className="font-display mt-5 text-5xl text-gold/50">{s.n}</p>
              <h3 className="mt-1 text-sm uppercase tracking-[.25em] text-champagne">{s.t}</h3>
              <p className="mx-auto mt-3 max-w-xs font-light text-ivory/70">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Shown only until genuine, approved reviews exist. Clearly marked as placeholders.
const PLACEHOLDERS = [
  { name: "Placeholder · Anonymous", category: "Love reading", text: "Sample review text. Replace with a genuine client review shared with permission." },
  { name: "Placeholder · Anonymous", category: "Career reading", text: "Sample review text. Replace with a genuine client review shared with permission." },
  { name: "Placeholder · Anonymous", category: "General guidance", text: "Sample review text. Replace with a genuine client review shared with permission." },
];
type Review = { name: string; category: string; text: string; city?: string; rating?: number };
export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [f, setF] = useState({ name: "", category: "General guidance", text: "", permission: false });
  const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/public?q=reviews").then((r) => r.json()).then((j) => setReviews(j.reviews || [])).catch(() => {}); }, []);
  const list: Review[] = reviews.length ? reviews : PLACEHOLDERS;
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json(); setMsg(j.message || j.error || "");
    if (r.ok) setF({ name: "", category: "General guidance", text: "", permission: false });
  }
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-8" aria-labelledby="t-h">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Testimonials</p>
          <h2 id="t-h" className="h-hero mx-auto max-w-3xl text-[clamp(1.9rem,4.8vw,3.4rem)]">Whispers from those who found <span className="gold-text italic">their clarity.</span></h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {list.map((r, i) => (
            <motion.figure key={i} initial={{ opacity: 0, y: 40, rotate: -1.5 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.9 }} whileHover={{ y: -8 }} className="glass frame p-8">
              <span className="font-display text-5xl leading-none text-gold/60">&ldquo;</span>
              <blockquote className="mt-2 font-light italic leading-relaxed text-ivory/85">{r.text}</blockquote>
              {r.rating ? <p className="mt-4 text-sm tracking-widest text-gold" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}</p> : null}
              <figcaption className="mt-3 text-xs uppercase tracking-[.2em]"><span className="text-champagne">{r.name}{r.city ? `, ${r.city}` : ""}</span><span className="mt-1 block text-lavender">{r.category}</span></figcaption>
            </motion.figure>
          ))}
        </div>
        {!reviews.length && <p className="mt-6 text-center text-xs text-ivory/40">Development placeholders. They are replaced automatically once genuine reviews are approved.</p>}
        <form onSubmit={send} className="glass mx-auto mt-14 max-w-xl space-y-3 p-6 text-left">
          <p className="eyebrow">Had a reading? Share your experience</p>
          <input aria-label="Your name (optional)" placeholder="Your name (or leave blank to stay anonymous)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full border border-gold/30 bg-midnight/95 p-3 text-sm font-light" />
          <textarea aria-label="Your review" required minLength={10} rows={3} placeholder="A few honest words…" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} className="w-full border border-gold/30 bg-midnight/95 p-3 text-sm font-light" />
          <label className="flex items-start gap-2 text-xs font-light text-ivory/70"><input type="checkbox" checked={f.permission} onChange={(e) => setF({ ...f, permission: e.target.checked })} className="mt-0.5" required /> I give permission to publish this review on the website.</label>
          <button className="btn">Submit review</button>
          {msg && <p role="status" className="text-xs text-champagne">{msg}</p>}
        </form>
      </div>
    </section>
  );
}

export function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".fc-portal", { scale: 0.5, opacity: 0.3 }, { scale: 1.15, opacity: 1, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "center center", scrub: true } });
      gsap.to(".fc-card", { y: (i) => -40 - i * 20, rotate: (i) => (i - 1) * 12, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 1 } });
      gsap.to(".fc-bg", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="relative isolate flex min-h-[110svh] items-center justify-center overflow-hidden px-5 text-center" aria-labelledby="fc-h">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <Film src="/videos/5.mp4" poster={IMG.moonCards} label="Your story is still unwritten: a tarot card turns to golden light" className="fc-bg absolute inset-0 -z-20 h-[115%] w-full object-cover opacity-80" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#1b1240,rgba(42,28,92,.5)_30%,rgba(42,28,92,.5)_70%,#1b1240)]" />
      <div className="fc-portal absolute left-1/2 top-1/2 -z-10 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle,rgba(234,213,160,.45),rgba(214,179,109,.12) 40%,transparent 68%)", boxShadow: "inset 0 0 0 1px rgba(214,179,109,.2)" }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="fc-card absolute hidden w-24 overflow-hidden rounded-xl border border-gold/50 shadow-[0_0_40px_rgba(214,179,109,.3)] sm:block" style={{ aspectRatio: "5/8", left: `${14 + i * 30}%`, top: `${58 + (i % 2) * 8}%` }}><CardBack /></div>
      ))}
      <div className="relative max-w-3xl">
        <h2 id="fc-h" className="h-hero text-[clamp(2rem,6vw,4.6rem)]">Perhaps this is the moment <span className="gold-text italic">you&apos;ve been waiting for.</span></h2>
        <p className="mx-auto mt-6 max-w-lg font-light text-ivory/85">Your next chapter is waiting to unfold. Take a moment, trust your intuition and begin your journey.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button className="btn btn-solid" onClick={() => startBooking()}>Book your reading</button>
          <a className="btn" href={waLink("Hi! I'd like to book a tarot reading on Spill the Cards.")} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
        </div>
      </div>
    </section>
  );
}

const L = ({ h, t, ext }: { h: string; t: string; ext?: boolean }) => <a href={h} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="block py-2 font-light text-ivory/70 transition hover:text-gold">{t}</a>;

function WeeklyCard() {
  const [contact, setContact] = useState(""); const [ok, setOk] = useState(false); const [consent, setConsent] = useState(false); const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const r = await fetch("/api/site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "subscribe", contact, consent }) }); const j = await r.json();
    if (r.ok) { setOk(true); track("subscribe"); } else setMsg(j.error || "Something went wrong.");
  }
  return (
    <form onSubmit={submit} className="glass frame mx-auto mb-14 flex max-w-6xl flex-col gap-4 p-6 sm:flex-row sm:items-center sm:p-8" aria-label="Weekly card signup">
      <div className="sm:flex-1"><p className="font-display text-2xl text-champagne">Your weekly card, free</p><p className="text-sm font-light text-ivory/70">One tarot card and a reflection each week by email or WhatsApp. Unsubscribe any time.</p></div>
      {ok ? <p role="status" className="text-emerald-300">You&apos;re in! Your first card arrives soon ✦</p> : (
        <div className="sm:w-[460px]">
          <div className="flex gap-2"><input aria-label="Email or WhatsApp number" required placeholder="Email or WhatsApp number" value={contact} onChange={(e) => setContact(e.target.value)} className="min-w-0 flex-1 border border-gold/30 bg-midnight/95 p-3 font-light text-ivory placeholder:text-ivory/35" /><button className="btn btn-solid !px-5">Join</button></div>
          <label className="mt-2 flex items-start gap-2 text-xs font-light text-ivory/60"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /> I agree to receive the weekly card and understand I can opt out any time.</label>
          {msg && <p role="alert" className="mt-1 text-xs text-red-300">{msg}</p>}
        </div>)}
    </form>
  );
}

export function Footer() {
  const [biz, setBiz] = useState<{ instagram?: string; channel?: string }>({}); const [large, setLarge] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch("/api/site?q=business").then((r) => r.json()).then(setBiz).catch(() => {}); try { setLarge(localStorage.getItem("arcana-text") === "large"); } catch {} }, []);
  const toggleText = () => { const next = !large; setLarge(next); document.documentElement.dataset.text = next ? "large" : ""; try { localStorage.setItem("arcana-text", next ? "large" : "normal"); } catch {} };
  return (
    <footer className="border-t border-gold/20 bg-midnight px-5 pb-10 pt-16 sm:px-8">
      <WeeklyCard />
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-5">
        <div className="md:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.webp" alt="Spill the Cards" width={160} height={160} className="h-32 w-32 rounded-full border border-gold/40 object-cover shadow-[0_0_40px_rgba(214,179,109,.25)]" />
          <p className="mt-3 text-sm font-light text-ivory/60">{SITE.tagline}</p>
        </div>
        <div><p className="eyebrow mb-3">Explore</p><L h="/shop" t="Card shop" /><L h="/about" t="About the reader" /><L h="#book" t="Book a session" /><L h="#reading" t="Pick a card" /><L h="/cards" t="Card meanings" /><L h="/gift" t="Gift a reading" /></div>
        <div><p className="eyebrow mb-3">Contact</p>
          <L h={waLink("Hi! I have a question about a tarot reading.")} t={`WhatsApp ${SITE.whatsappDisplay}`} ext />
          {biz.channel && <L h={biz.channel} t="WhatsApp Channel" ext />}
          {biz.instagram && <L h={biz.instagram} t="Instagram" ext />}
        </div>
        <div><p className="eyebrow mb-3">More</p><L h="/insights" t="Your Stars & Compatibility" /><L h="/journey" t="My Journey" /><L h="/community" t="Community" /><L h="/blog" t="Blog" /><L h="/readers" t="Readers" /><L h="/chat" t="Ask the Reader" /></div>
        <div><p className="eyebrow mb-3">Legal & settings</p><button className="block py-1 text-left text-sm font-light text-ivory/70 hover:text-gold" onClick={() => window.dispatchEvent(new Event("stc:reconsent"))}>Cookie settings</button><L h="/privacy" t="Privacy policy" /><L h="/terms" t="Terms & conditions" /><L h="/disclaimer" t="Tarot disclaimer" />
          <button onClick={toggleText} aria-pressed={large} className="block py-2 text-left font-light text-ivory/70 transition hover:text-gold">{large ? "Normal text size" : "Larger text"}</button>
          <InstallButton className="block py-2 text-left font-light text-gold transition hover:text-champagne" /></div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-gold/10 pt-6 text-xs font-light leading-relaxed text-ivory/45">
        Tarot readings are for personal reflection and entertainment only. They are not predictions or guarantees and are not a substitute for professional medical, legal or financial advice.
        © Spill the Cards.
      </p>
    </footer>
  );
}
