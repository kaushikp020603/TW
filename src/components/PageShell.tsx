"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import { AccountButton, AuthModal } from "./Account";

export const MORE = [
  ["/about", "About"], ["/cards", "Card Meanings"], ["/insights", "Your Stars"], ["/journey", "My Journey"], ["/community", "Community"], ["/blog", "Blog"], ["/readers", "Readers"], ["/chat", "Ask the Reader"],
] as const;

export default function PageShell({ title, eyebrow, intro, children }: { title: React.ReactNode; eyebrow: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(60%_35%_at_50%_0%,rgba(74,52,150,.7),transparent)]">
      <header className="glass !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 px-4 pt-3 sm:px-5 lg:py-3">
          <Link href="/" className="inline-flex min-h-11 items-center" aria-label="Spill the Cards home"><Logo className="text-xl sm:text-2xl" /></Link>
          <div className="flex items-center gap-2 sm:gap-3 lg:order-3"><AccountButton /><Link href="/#book" className="btn btn-solid !px-5 !py-2.5">Book</Link></div>
          <nav className="scrollbar-none -mx-4 order-3 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-4 text-[.68rem] uppercase tracking-[.2em] sm:mx-0 sm:w-full sm:px-0 lg:order-2 lg:w-auto lg:gap-4" aria-label="More">
            {MORE.map(([h, l]) => <Link key={h} href={h} className="inline-flex min-h-11 shrink-0 items-center px-3 text-ivory/70 hover:text-gold">{l}</Link>)}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-16">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="h-hero text-[clamp(2.2rem,6vw,4.4rem)]">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl font-light text-ivory/75">{intro}</p>}
        <div className="mt-10">{children}</div>
        <p className="mt-16 text-xs font-light text-ivory/45">For reflection and entertainment only. Not predictions, and not medical, legal or financial advice.</p>
      </main>
      <AuthModal />
    </div>
  );
}
export const field = "w-full border border-gold/30 bg-midnight/95 p-3 font-light text-ivory placeholder:text-ivory/35";
