"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MAJOR_ARCANA, type Card } from "@/data/tarot";
import { CardFace } from "./TarotCard";
import { startBooking, startReading } from "@/lib/events";

gsap.registerPlugin(ScrollTrigger);

function TiltCard({ card, i, onOpen }: { card: Card; i: number; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const move = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ref.current!.style.transform = `perspective(800px) rotateY(${x * 22}deg) rotateX(${-y * 22}deg) scale(1.08)`;
  };
  const leave = () => { ref.current!.style.transform = ""; };
  return (
    <div className="u-card" style={{ animation: `float ${6 + (i % 5)}s ease-in-out ${(i % 7) * -0.9}s infinite`, ["--r" as string]: `${((i % 5) - 2) * 1.4}deg` }}>
      <button ref={ref} onClick={onOpen} onMouseMove={move} onMouseLeave={leave} aria-label={`Open ${card.name}`}
        className="relative block aspect-[5/8] w-full overflow-hidden rounded-[14px] border border-gold/60 shadow-[0_0_28px_rgba(214,179,109,.22)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_0_50px_rgba(214,179,109,.5)]">
        <CardFace card={card} />
      </button>
    </div>
  );
}

export default function Universe() {
  const [open, setOpen] = useState<Card | null>(null);
  const [rev, setRev] = useState(false);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".u-card", { opacity: 0, y: 90, rotateX: 40, stagger: { each: 0.05, from: "random" }, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".u-grid", start: "top 80%" } });
    }, root);
    return () => ctx.revert();
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <section id="universe" ref={root} className="relative isolate overflow-hidden px-5 py-28 sm:px-8" aria-labelledby="uni-h">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(74,52,150,.7),transparent),radial-gradient(50%_40%_at_50%_100%,rgba(74,52,150,.5),transparent)]" />
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow mb-4">The Major Arcana</p>
        <h2 id="uni-h" className="h-hero text-[clamp(2rem,5.5vw,4.2rem)]">The floating <span className="gold-text italic">tarot universe</span></h2>
        <p className="mx-auto mt-5 max-w-xl font-light text-ivory/75">Twenty-two symbols for the stages of a life. Touch a card to read its upright and reversed meaning.</p>
      </div>
      <div className="u-grid scene3d mx-auto mt-16 grid max-w-6xl grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-6 md:grid-cols-6 lg:grid-cols-8">
        {MAJOR_ARCANA.map((c, i) => <TiltCard key={c.id} card={c} i={i} onOpen={() => { setRev(false); setOpen(c); }} />)}
      </div>

      {typeof document !== "undefined" && createPortal(<AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center bg-midnight/92 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={open.name}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.85, y: 40, rotateY: -25 }} animate={{ scale: 1, y: 0, rotateY: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              className="glass frame grid max-h-[92svh] w-full max-w-4xl gap-8 overflow-y-auto p-6 sm:grid-cols-[260px_1fr] sm:p-10">
              <div className="mx-auto w-[56%] max-w-[260px] sm:w-full">
                <div className="aspect-[5/8] overflow-hidden rounded-[14px] border border-gold/70 shadow-[0_0_60px_rgba(214,179,109,.35)]"><CardFace card={open} reversed={rev} /></div>
              </div>
              <div>
                <p className="eyebrow">{open.numeral} · {open.keywords}</p>
                <h3 className="h-hero mt-2 text-4xl sm:text-5xl">{open.name}</h3>
                <div className="mt-5 inline-flex rounded-full border border-gold/40 p-1 text-[.68rem] uppercase tracking-[.2em]" role="tablist">
                  {[false, true].map((r) => (
                    <button key={String(r)} role="tab" aria-selected={rev === r} onClick={() => setRev(r)} className={`rounded-full px-4 py-2 transition ${rev === r ? "bg-gold text-midnight" : "text-champagne"}`}>{r ? "Reversed" : "Upright"}</button>
                  ))}
                </div>
                <p className="mt-5 font-light leading-relaxed text-ivory/90">{rev ? open.reversed : open.upright}</p>
                <dl className="mt-5 space-y-3 text-sm font-light text-ivory/75">
                  <div><dt className="eyebrow !text-lavender">In love</dt><dd>{open.love}</dd></div>
                  <div><dt className="eyebrow !text-lavender">In career</dt><dd>{open.career}</dd></div>
                </dl>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="btn btn-solid" onClick={() => { setOpen(null); startReading(); }}>Pull my cards</button>
                  <button className="btn" onClick={() => { setOpen(null); startBooking(); }}>Book a reading</button>
                  <button className="btn !border-ivory/30 !text-ivory/70" onClick={() => setOpen(null)}>Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </section>
  );
}
