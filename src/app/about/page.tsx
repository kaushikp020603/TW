import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { IMG, SITE, SITE_URL } from "@/config/site";
import { getBusiness } from "@/lib/business";

export const metadata: Metadata = {
  title: "About the Reader: How a Spill the Cards Reading Works",
  description: "Meet your tarot reader, learn how a reading works, what to expect from a session and answers to common questions about tarot readings.",
  alternates: { canonical: "/about" },
};

const FAQ = [
  { q: "What is a tarot reading?", a: "A tarot reading uses a deck of 78 illustrated cards as prompts for reflection. The cards do not predict a fixed future. They give you symbols and questions to think about your situation more clearly." },
  { q: "How does a personal reading work here?", a: "You choose a service and a time, send the request on WhatsApp, and the reader confirms. Sessions can be by chat, voice or video. Payment is arranged directly on WhatsApp, usually by UPI." },
  { q: "Is tarot reading accurate or a guarantee?", a: "Tarot is for reflection and entertainment. It cannot guarantee outcomes, and nothing in a reading is medical, legal or financial advice. Use it to explore your thoughts, then make your own decisions." },
  { q: "What should I ask?", a: "Open questions work best, such as \"What should I understand about this situation?\" rather than questions that need a yes or no about other people's private choices." },
  { q: "Can I book for love, career or general guidance?", a: "Yes. Choose Love, Career, Self-discovery or a general reading, or a longer 30 or 60 minute session." },
  { q: "Are my questions kept private?", a: "Yes. Readings you draw on the site are saved only if you tick the consent box, and you can delete your account and data at any time." },
];

async function Inner() {
  await connection(); // always show the latest details saved in Admin → Settings
  const b = await getBusiness().catch(() => null);
  const name = b?.aboutName || "Your tarot reader";
  const ld = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "AboutPage", name: "About the reader", url: `${SITE_URL}/about`, about: { "@type": "Person", name, ...(b?.aboutSpecialties ? { knowsAbout: b.aboutSpecialties } : {}) } },
  ];
  return (
    <PageShell eyebrow="Meet your reader" title={<>Behind every card, <span className="gold-text italic">a story</span></>}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/spill-the-cards.webp" alt="Spill the Cards: a reader and a guest over a tarot spread" className="mb-12 w-full rounded-sm border border-gold/40 shadow-[0_0_60px_rgba(214,179,109,.18)]" />
      <div className="grid items-start gap-10 lg:grid-cols-[320px_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.moonReader} alt={`Illustrated portrait of ${name}`} className="frame aspect-[4/5] w-full max-w-sm rounded-sm border border-gold/40 object-cover object-[50%_20%]" />
        <div className="max-w-2xl space-y-5 font-light leading-relaxed text-ivory/85">
          <h2 className="font-display text-3xl text-champagne">{name}</h2>
          {b?.aboutBio ? b.aboutBio.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>) : <p>Tarot is a mirror made of symbols. In each reading, the cards give you language for what you may already feel, so you can look at your questions with more calm and clarity. Readings here are conversations, not verdicts: gentle, honest and focused on what you can reflect on and choose for yourself.</p>}
          {b?.aboutSpecialties && <p><b className="text-champagne">Specialties:</b> {b.aboutSpecialties}</p>}
          {b?.aboutExperience && <p><b className="text-champagne">Experience:</b> {b.aboutExperience}</p>}
          <div className="flex flex-wrap gap-3 pt-2"><Link href="/#book" className="btn btn-solid">Book a reading</Link><Link href="/reading" className="btn">Draw a free card</Link></div>
        </div>
      </div>
      <section className="mt-16 max-w-3xl"><h2 className="font-display text-3xl text-champagne">How a reading works</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 font-light text-ivory/85"><li>Choose a service and a time on the booking page.</li><li>Send the request on WhatsApp so the reader can confirm.</li><li>Pay by UPI when asked, then meet at the agreed time by chat, voice or video.</li><li>Receive your reading and reflective guidance. Keep your cards and notes in your account if you like.</li></ol></section>
      <section className="mt-14 max-w-3xl"><h2 className="font-display text-3xl text-champagne">Frequently asked questions</h2>
        <dl className="mt-4 space-y-5">{FAQ.map((f) => <div key={f.q}><dt className="text-lg text-ivory">{f.q}</dt><dd className="mt-1 font-light leading-relaxed text-ivory/75">{f.a}</dd></div>)}</dl></section>
      <p className="mt-10 text-sm text-ivory/55">Contact: WhatsApp {SITE.whatsappDisplay}</p>
      {ld.map((o, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(o) }} />)}
    </PageShell>
  );
}

export default function About() { return <Suspense fallback={null}><Inner /></Suspense>; }
