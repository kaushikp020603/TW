import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { CardFace } from "@/components/TarotCard";
import { MAJOR_ARCANA } from "@/data/tarot";
import { cardSlug, kw } from "@/data/cardSeo";

export const metadata: Metadata = {
  title: "Tarot Card Meanings: All 22 Major Arcana",
  description: "Explore the meaning of all 22 Major Arcana tarot cards, from The Fool to The World: upright and reversed meanings, love, career and yes/no guidance.",
  alternates: { canonical: "/cards" },
};

export default function CardsIndex() {
  return (
    <PageShell eyebrow="The Major Arcana" title={<>Tarot card <span className="gold-text italic">meanings</span></>} intro="Twenty-two cards that map the great chapters of a life. Choose a card to read its upright and reversed meaning, what it says about love and career, and how it answers a yes-or-no question.">
      <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {MAJOR_ARCANA.map((c) => (
          <li key={c.id}>
            <Link href={`/cards/${cardSlug(c.name)}`} className="group block">
              <div className="aspect-[5/8] overflow-hidden rounded-[14px] border border-gold/50 shadow-[0_0_24px_rgba(214,179,109,.15)] transition group-hover:-translate-y-1 group-hover:shadow-[0_0_40px_rgba(214,179,109,.4)]"><CardFace card={c} /></div>
              <p className="font-display mt-3 text-lg text-champagne">{c.name}</p>
              <p className="text-xs font-light text-ivory/55">{kw(c).join(" · ")}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
