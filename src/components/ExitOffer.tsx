"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { startBooking } from "@/lib/events";

/** Desktop only, once per session: a gentle offer when the pointer leaves toward the browser bar. */
export default function ExitOffer() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (location.pathname !== "/" || matchMedia("(pointer: coarse)").matches) return;
    let seen = false; try { seen = sessionStorage.getItem("stc-exit") === "1"; } catch {}
    if (seen) return;
    const t0 = Date.now();
    const out = (e: MouseEvent) => {
      if (e.clientY > 4 || Date.now() - t0 < 25000) return;
      try { sessionStorage.setItem("stc-exit", "1"); } catch {}
      setOpen(true); document.removeEventListener("mouseleave", out);
    };
    document.addEventListener("mouseleave", out);
    return () => document.removeEventListener("mouseleave", out);
  }, []);
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] flex items-center justify-center bg-[#1b1240]/80 px-5" onClick={() => setOpen(false)}>
          <motion.div role="dialog" aria-label="A little gift" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="glass relative max-w-md rounded-2xl p-8 text-center">
            <button aria-label="Close" className="absolute right-3 top-3 h-10 w-10 text-2xl text-ivory/60 hover:text-gold" onClick={() => setOpen(false)}>×</button>
            <p className="eyebrow">Before you go</p>
            <h2 className="h-hero mt-3 text-3xl">A little clarity, <span className="gold-text italic">on us.</span></h2>
            <p className="mt-4 font-light text-ivory/85">Draw a free card of the day, or take 10% off your first reading with code <b className="text-champagne">WELCOME10</b>.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button className="btn btn-solid" onClick={() => { setOpen(false); location.href = "/reading"; }}>Draw my card</button>
              <button className="btn" onClick={() => { setOpen(false); startBooking(); }}>Book with 10% off</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
