"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/consent";
import { logConsent, track } from "@/lib/track";

/** Cookie and analytics choice. Essential only is the default; "Accept analytics" adds approximate location, language and campaign source. */
export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    const show = () => setOpen(true);
    const t = getConsent() === null ? setTimeout(show, 1800) : undefined;
    window.addEventListener("stc:reconsent", show);
    return () => { if (t) clearTimeout(t); window.removeEventListener("stc:reconsent", show); };
  }, []);
  const choose = (v: "all" | "essential") => { setConsent(v); logConsent(v); setOpen(false); if (v === "all") track("pageview", document.referrer || undefined); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-label="Cookie settings" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="glass fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-3xl rounded-2xl p-5 sm:bottom-5 sm:p-6">
          <p className="font-display text-xl text-champagne">A little about cookies ✦</p>
          <p className="mt-2 text-sm font-light leading-relaxed text-ivory/85">We use no tracking cookies. Choose <b>Accept analytics</b> to let us see your approximate city, language and the link you came from, so we can improve the site. Never your exact location or IP. <Link href="/privacy" className="inline-block min-h-11 py-3 underline decoration-gold/60 underline-offset-4">Privacy policy</Link></p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn btn-solid" onClick={() => choose("all")}>Accept analytics</button>
            <button className="btn" onClick={() => choose("essential")}>Essential only</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
