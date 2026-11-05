"use client";
import Logo from "@/components/Logo";
import { useEffect, useState } from "react";
import { goTo, startBooking } from "@/lib/events";
import SoundToggle from "./SoundToggle";
import { AccountButton } from "./Account";
import { openAuth } from "@/lib/useUser";
import Link from "next/link";
import { MORE } from "./PageShell";

const LINKS = [
  ["worlds", "Worlds"],
  ["universe", "The Cards"],
  ["reading", "Pick a Card"],
  ["about", "Reader"],
  ["book", "Book"],
] as const;

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const f = () => setSolid(scrollY > 60);
    f(); addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${solid || open ? "glass !border-x-0 !border-t-0 py-3" : "py-5"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        <button onClick={() => { goTo("top"); setOpen(false); }} className="shrink-0 min-h-11" aria-label="Spill the Cards — top"><Logo className="text-xl sm:text-2xl" /></button>
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {LINKS.map(([id, label]) => (
            <button key={id} onClick={() => goTo(id)} className="text-[.7rem] uppercase tracking-[.25em] text-ivory/80 transition hover:text-gold">{label}</button>
          ))}
          <div className="relative">
            <button onClick={() => setMore(!more)} aria-expanded={more} className="text-[.7rem] uppercase tracking-[.25em] text-ivory/80 transition hover:text-gold">More ▾</button>
            {more && <div className="glass absolute right-0 top-8 w-48 space-y-1 p-3">{MORE.map(([h, l]) => <Link key={h} href={h} className="block px-2 py-2 text-xs uppercase tracking-[.2em] text-ivory/80 hover:text-gold">{l}</Link>)}</div>}
          </div>
        </nav>
        <div className="flex items-center gap-3">
          <AccountButton />
          <SoundToggle className="hidden sm:flex" />
          <button className="btn btn-solid !px-5 !py-2.5" onClick={() => startBooking()}>Book</button>
          <button className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className={`h-px w-6 bg-champagne transition ${open ? "translate-y-[6px] rotate-45" : ""}`} />
            <span className={`h-px w-6 bg-champagne transition ${open ? "opacity-0" : ""}`} />
            <span className={`h-px w-6 bg-champagne transition ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex max-h-[calc(100svh-4.5rem)] flex-col items-center gap-1 overflow-y-auto px-5 pb-6 pt-4 lg:hidden" aria-label="Mobile">
          {LINKS.map(([id, label]) => (
            <button key={id} onClick={() => { setOpen(false); setTimeout(() => goTo(id), 50); }} className="min-h-12 w-full text-sm uppercase tracking-[.3em] text-ivory">{label}</button>
          ))}
          {MORE.map(([h, l]) => <Link key={h} href={h} className="inline-flex min-h-12 w-full items-center justify-center text-sm uppercase tracking-[.3em] text-ivory/80">{l}</Link>)}
          <button onClick={() => { setOpen(false); openAuth("login"); }} className="min-h-12 w-full text-sm uppercase tracking-[.3em] text-gold">Sign in / Register</button>
        </nav>
      )}
    </header>
  );
}
