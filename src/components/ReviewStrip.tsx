"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type R = { name: string; city?: string; category: string; text: string; rating?: number };

/** A calm, rotating quote from real clients, placed next to the thing it is about (readings or the shop). Hidden when there are none. */
export default function ReviewStrip({ place, title = "What clients say" }: { place: "services" | "shop"; title?: string }) {
  const [list, setList] = useState<R[]>([]); const [i, setI] = useState(0);
  useEffect(() => { fetch(`/api/public?q=reviews&place=${place}`).then((r) => r.json()).then((j) => setList(j.reviews || [])).catch(() => {}); }, [place]);
  useEffect(() => { if (list.length < 2) return; const t = setInterval(() => setI((n) => (n + 1) % list.length), 6500); return () => clearInterval(t); }, [list.length]);
  if (!list.length) return null;
  const r = list[i % list.length];
  return (
    <section className="px-5 py-12 sm:px-8" aria-label={title}>
      <div className="glass mx-auto max-w-3xl rounded-2xl p-8 text-center">
        <p className="eyebrow">{title}</p>
        <AnimatePresence mode="wait">
          <motion.figure key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45 }} className="mt-4">
            {r.rating ? <p className="text-gold" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}</p> : null}
            <blockquote className="mt-2 font-display text-xl italic leading-relaxed text-ivory sm:text-2xl">&ldquo;{r.text}&rdquo;</blockquote>
            <figcaption className="mt-3 text-xs uppercase tracking-[.2em] text-champagne">{r.name}{r.city ? `, ${r.city}` : ""}<span className="ml-2 text-lavender">{r.category}</span></figcaption>
          </motion.figure>
        </AnimatePresence>
        {list.length > 1 && <div className="mt-5 flex justify-center gap-2">{list.map((_, n) => <button key={n} aria-label={`Show testimonial ${n + 1}`} onClick={() => setI(n)} className={`h-2 w-2 rounded-full !min-h-0 ${n === i ? "bg-gold" : "bg-gold/30"}`} />)}</div>}
      </div>
    </section>
  );
}
