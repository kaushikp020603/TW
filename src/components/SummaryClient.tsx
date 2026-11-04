"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { CardFace } from "@/components/TarotCard";
import { MAJOR_ARCANA } from "@/data/tarot";

type Summary = { name: string; service_name: string; date: string; text: string; cards: { id: number; reversed: boolean; label?: string }[] };

export default function SummaryClient({ code }: { code: string }) {
  const [s, setS] = useState<Summary | null | undefined>(undefined);
  useEffect(() => { fetch(`/api/bookings?summary=${encodeURIComponent(code)}`).then((r) => r.json()).then((j) => setS(j.summary ?? null)).catch(() => setS(null)); }, [code]);
  return (
    <PageShell eyebrow="Your personal reading" title={<>Reading <span className="gold-text italic">summary</span></>} intro={s ? `${s.service_name} · ${new Date(s.date + "T12:00:00").toLocaleDateString("en-IN", { dateStyle: "long" })}` : undefined}>
      {s === undefined && <p className="font-light text-ivory/60">Opening your summary…</p>}
      {s === null && <div className="glass frame max-w-md space-y-3 p-8"><p className="font-display text-2xl text-champagne">Summary not found</p><p className="font-light text-ivory/70">This link may be mistyped, or your reader hasn&apos;t shared a summary for this session yet.</p><Link href="/" className="btn btn-solid inline-flex">Back home</Link></div>}
      {s && (
        <div className="space-y-10">
          <p className="max-w-2xl font-light text-ivory/80">Prepared for <b className="text-champagne">{s.name}</b>. This page is private to you: only people with this link can open it.</p>
          {s.cards.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {s.cards.map((c, i) => { const card = MAJOR_ARCANA[c.id]; if (!card) return null; return (
                <div key={i} className="space-y-3">
                  {c.label && <p className="eyebrow text-center">{c.label}</p>}
                  <div className="mx-auto aspect-[5/8] w-[60%] max-w-[200px] overflow-hidden rounded-[14px] border border-gold/60 shadow-[0_0_40px_rgba(214,179,109,.25)]"><CardFace card={card} reversed={c.reversed} /></div>
                  <div className="glass p-4"><h2 className="font-display text-xl text-champagne">{card.name}{c.reversed && <span className="ml-2 text-sm italic text-lavender">reversed</span>}</h2><p className="mt-2 text-sm font-light leading-relaxed text-ivory/85">{c.reversed ? card.reversed : card.upright}</p></div>
                </div>); })}
            </div>)}
          <section className="glass frame max-w-3xl p-6 sm:p-8"><p className="eyebrow">Notes from your reader</p><p className="mt-3 whitespace-pre-line font-light leading-relaxed text-ivory/90">{s.text}</p></section>
          <div className="flex flex-wrap gap-3"><button className="btn" onClick={() => window.print()}>Save as PDF</button><Link href="/#book" className="btn btn-solid">Book another reading</Link></div>
          <p className="text-xs font-light text-ivory/45">For reflection and entertainment. Not a prediction, and not medical, legal or financial advice.</p>
        </div>)}
    </PageShell>
  );
}
