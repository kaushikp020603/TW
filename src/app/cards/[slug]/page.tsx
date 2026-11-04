import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { CardFace } from "@/components/TarotCard";
import { MAJOR_ARCANA, type Card } from "@/data/tarot";
import { buildCardPage, cardBySlug, cardSlug, kw } from "@/data/cardSeo";
import { rows } from "@/lib/db";
import { SITE, SITE_URL } from "@/config/site";

type Params = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return MAJOR_ARCANA.map((c) => ({ slug: cardSlug(c.name) })); }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params; const c = cardBySlug(slug); if (!c) return { title: "Card not found" };
  const p = buildCardPage(c);
  return { title: p.title, description: p.description, alternates: { canonical: `/cards/${slug}` }, openGraph: { type: "article", title: p.title, description: p.description, images: [{ url: "/img/19.webp" }] } };
}

// Admin edits to a card's meanings (Admin → Tarot cards) are merged in, so this page never goes stale.
async function withOverrides(base: Card): Promise<Card> {
  try {
    const o = (await rows<Partial<Card>>("SELECT keywords,upright,reversed,love,career FROM card_overrides WHERE id=?", base.id))[0];
    if (!o) return base; const merged = { ...base }; for (const k of ["keywords", "upright", "reversed", "love", "career"] as const) if (o[k]) merged[k] = o[k] as string; return merged;
  } catch { return base; }
}

async function Inner({ params }: Params) {
  await connection(); // read admin edits at request time, never frozen at build time
  const { slug } = await params; const base = cardBySlug(slug); if (!base) notFound();
  const c = await withOverrides(base); const p = buildCardPage(c);
  const url = `${SITE_URL}/cards/${slug}`;
  const ld = [
    { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.description, mainEntityOfPage: url, author: { "@type": "Organization", name: SITE.name }, publisher: { "@type": "Organization", name: SITE.name }, inLanguage: "en-IN", about: `${c.name} tarot card` },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Tarot cards", item: `${SITE_URL}/cards` }, { "@type": "ListItem", position: 3, name: c.name, item: url }] },
  ];
  return (
    <PageShell eyebrow={`${c.numeral} · ${kw(c).join(" · ")}`} title={<>{c.name} <span className="gold-text italic">tarot meaning</span></>} intro={`${c.name}: upright and reversed meaning, love, career and yes/no guidance.`}>
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="mx-auto w-[220px] lg:sticky lg:top-6 lg:h-fit lg:w-full">
          <div className="aspect-[5/8] overflow-hidden rounded-[14px] border border-gold/60 shadow-[0_0_50px_rgba(214,179,109,.3)]"><CardFace card={c} /></div>
          <div className="mt-5 space-y-3"><Link href="/#reading" className="btn btn-solid w-full">Pull your own cards</Link><Link href="/#book" className="btn w-full">Book a personal reading</Link></div>
        </aside>
        <article className="max-w-2xl space-y-9">
          {p.sections.map((s) => (
            <section key={s.h}><h2 className="font-display text-3xl text-champagne">{s.h}</h2>
              {s.h === "Questions to reflect on" ? <ul className="mt-3 list-disc space-y-2 pl-5 font-light text-ivory/85">{s.p.map((q) => <li key={q}>{q}</li>)}</ul>
                : s.p.map((t, i) => <p key={i} className="mt-3 font-light leading-relaxed text-ivory/85">{t}</p>)}</section>
          ))}
          <section><h2 className="font-display text-3xl text-champagne">Frequently asked questions</h2>
            <dl className="mt-4 space-y-5">{p.faq.map((f) => <div key={f.q}><dt className="text-lg text-ivory">{f.q}</dt><dd className="mt-1 font-light leading-relaxed text-ivory/75">{f.a}</dd></div>)}</dl></section>
          <nav aria-label="More cards" className="grid gap-4 border-t border-gold/20 pt-8 sm:grid-cols-2">
            <Link href={`/cards/${cardSlug(p.prev.name)}`} className="glass p-4 transition hover:-translate-y-0.5"><span className="eyebrow">Previous</span><span className="font-display mt-1 block text-xl text-champagne">← {p.prev.name}</span></Link>
            <Link href={`/cards/${cardSlug(p.next.name)}`} className="glass p-4 text-right transition hover:-translate-y-0.5"><span className="eyebrow">Next</span><span className="font-display mt-1 block text-xl text-champagne">{p.next.name} →</span></Link>
          </nav>
          <section><h2 className="font-display text-2xl text-champagne">Related cards</h2><ul className="mt-3 flex flex-wrap gap-3">{p.related.map((r) => <li key={r.id}><Link href={`/cards/${cardSlug(r.name)}`} className="btn !py-2">{r.name}</Link></li>)}</ul></section>
          <p className="text-xs font-light text-ivory/45">Tarot is a tool for reflection and entertainment. Interpretations are symbolic, not predictions, and not medical, legal or financial advice.</p>
        </article>
      </div>
      {ld.map((o, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(o) }} />)}
    </PageShell>
  );
}

export default async function CardPage({ params }: Params) {
  const { slug } = await params;
  if (!cardBySlug(slug)) notFound(); // a real 404 status for unknown cards (decided before streaming starts)
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
