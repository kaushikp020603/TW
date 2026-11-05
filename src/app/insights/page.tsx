"use client";
import { useState } from "react";
import PageShell, { field } from "@/components/PageShell";
import { FlipCard } from "@/components/TarotCard";
import { MAJOR_ARCANA, shuffleDeck } from "@/data/tarot";
import { NUMBERS, YEAR_THEME, SIGNS, compatibility, lifePath, personalYear, zodiac } from "@/lib/mystic";
import { waLink } from "@/config/site";

type Tab = "stars" | "match";

export default function Insights() {
  const [tab, setTab] = useState<Tab>("stars");
  return (
    <PageShell eyebrow="Numerology · Zodiac · Compatibility" title={<>Your stars, <span className="gold-text italic">your numbers</span></>}
      intro="Tarot, numerology and astrology are symbolic languages. Use them as prompts for reflection, not as predictions. Nothing you enter here is stored.">
      <div className="mb-8 flex gap-2" role="tablist">
        {([["stars", "My birth chart"], ["match", "Compatibility"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`border px-5 py-3 text-xs uppercase tracking-[.2em] ${tab === k ? "border-gold bg-gold text-midnight" : "border-gold/40"}`}>{l}</button>)}
      </div>
      {tab === "stars" ? <Stars /> : <Match />}
    </PageShell>
  );
}

function Stars() {
  const [dob, setDob] = useState(""); const [name, setName] = useState("");
  const [shown, setShown] = useState(false); const [draw, setDraw] = useState<{ id: number; reversed: boolean } | null>(null); const [flip, setFlip] = useState(false);
  const z = dob ? zodiac(dob) : null; const lp = dob ? lifePath(dob) : 0; const py = dob ? personalYear(dob) : 0;
  const reveal = () => { setShown(true); const d = shuffleDeck()[0]; setDraw({ id: d.card.id, reversed: d.reversed }); setFlip(false); setTimeout(() => setFlip(true), 300); };
  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form className="glass frame space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); if (dob) reveal(); }}>
        <div><label htmlFor="n" className="mb-1 block text-xs text-ivory/60">Your name (optional)</label><input id="n" className={field} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label htmlFor="d" className="mb-1 block text-xs text-ivory/60">Date of birth</label><input id="d" type="date" required className={field} value={dob} onChange={(e) => { setDob(e.target.value); setShown(false); }} /></div>
        <button className="btn btn-solid w-full">Reveal my reading</button>
      </form>
      {shown && z && draw ? (
        <div className="space-y-6">
          <div className="glass frame p-6">
            <p className="eyebrow">Life path {lp}</p><h2 className="font-display mt-1 text-3xl text-champagne">{NUMBERS[lp].title}</h2>
            <p className="mt-3 font-light leading-relaxed text-ivory/85">{NUMBERS[lp].text}</p>
            <p className="mt-3 text-sm font-light text-ivory/70">Personal year {py}: {YEAR_THEME[py]}. In tarot, number {lp} echoes <b className="text-champagne">{MAJOR_ARCANA[NUMBERS[lp].card].name}</b>.</p>
          </div>
          <div className="glass frame p-6">
            <p className="eyebrow">{z.symbol} {z.name} · {z.element} · ruled by {z.ruler}</p>
            <p className="mt-3 font-light leading-relaxed text-ivory/85">{name ? `${name}, ` : ""}{z.name} is often described as {z.text}. Its traditional tarot correspondence is <b className="text-champagne">{MAJOR_ARCANA[z.card].name}</b>: {MAJOR_ARCANA[z.card].keywords}.</p>
          </div>
          <div className="glass frame grid items-center gap-6 p-6 sm:grid-cols-[150px_1fr]">
            <FlipCard card={MAJOR_ARCANA[draw.id]} reversed={draw.reversed} flipped={flip} className="mx-auto aspect-[5/8] w-[130px]" />
            <div>
              <p className="eyebrow">Your card for this chapter</p>
              <h3 className="font-display mt-1 text-2xl text-champagne">{MAJOR_ARCANA[draw.id].name}{draw.reversed ? " (reversed)" : ""}</h3>
              <p className="mt-2 text-sm font-light text-ivory/85">{draw.reversed ? MAJOR_ARCANA[draw.id].reversed : MAJOR_ARCANA[draw.id].upright}</p>
              <p className="mt-2 text-xs text-ivory/55">Combined theme: {z.name} energy ({z.element.toLowerCase()}), life path {lp}, and this card suggest reflecting on {MAJOR_ARCANA[draw.id].keywords.split(" · ")[0]}.</p>
              <a className="mt-3 inline-block text-xs uppercase tracking-[.2em] text-lavender hover:text-gold" target="_blank" rel="noopener noreferrer" href={waLink(`Hi! I explored my birth chart on Spill the Cards (${z.name}, life path ${lp}) and would like a personal reading.`)}>Book a personal reading</a>
            </div>
          </div>
        </div>
      ) : <p className="self-center text-sm font-light text-ivory/50">Enter your date of birth to see your life-path number, zodiac sign and a card for this chapter of your life. All 12 signs: {SIGNS.map((s) => s.symbol).join(" ")}</p>}
    </div>
  );
}

function Match() {
  const [a, setA] = useState({ name: "", dob: "" }); const [b, setB] = useState({ name: "", dob: "" });
  const [out, setOut] = useState<ReturnType<typeof compatibility> | null>(null); const [cards, setCards] = useState<{ id: number; reversed: boolean }[]>([]); const [flip, setFlip] = useState(false);
  const go = () => { setOut(compatibility(a, b)); setCards(shuffleDeck().slice(0, 3).map((d) => ({ id: d.card.id, reversed: d.reversed }))); setFlip(false); setTimeout(() => setFlip(true), 400); };
  const labels = [`${a.name || "You"}`, `${b.name || "Them"}`, "The bond"];
  return (
    <div className="space-y-8">
      <form className="glass frame grid gap-6 p-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); go(); }}>
        {[[a, setA, "Person 1"], [b, setB, "Person 2"]].map(([v, set, l], i) => (
          <fieldset key={i} className="space-y-3"><legend className="eyebrow mb-2">{l as string}</legend>
            <input aria-label={`${l} name`} placeholder="Name" className={field} value={(v as typeof a).name} onChange={(e) => (set as typeof setA)({ ...(v as typeof a), name: e.target.value })} />
            <input aria-label={`${l} date of birth`} type="date" required className={field} value={(v as typeof a).dob} onChange={(e) => (set as typeof setA)({ ...(v as typeof a), dob: e.target.value })} /></fieldset>
        ))}
        <div className="sm:col-span-2"><button className="btn btn-solid">Read our compatibility</button></div>
      </form>
      {out && (
        <div className="space-y-6">
          <div className="glass frame p-6">
            <p className="eyebrow">Symbolic harmony</p><p className="font-display mt-1 text-5xl text-gold">{out.score}%</p>
            {out.lines.map((l, i) => <p key={i} className="mt-3 font-light leading-relaxed text-ivory/85">{l}</p>)}
            <p className="mt-3 text-xs text-ivory/50">This is a playful, reflective lens. Real relationships are shaped by choices, not charts.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {cards.map((c, i) => (<div key={i} className="space-y-3 text-center"><p className="eyebrow">{labels[i]}</p><FlipCard card={MAJOR_ARCANA[c.id]} reversed={c.reversed} flipped={flip} className="mx-auto aspect-[5/8] w-[60%] max-w-[170px]" />
              <div className="glass p-4 text-left"><p className="font-display text-xl text-champagne">{MAJOR_ARCANA[c.id].name}{c.reversed ? " (reversed)" : ""}</p><p className="mt-2 text-sm font-light text-ivory/85">{i === 2 ? MAJOR_ARCANA[c.id].love : c.reversed ? MAJOR_ARCANA[c.id].reversed : MAJOR_ARCANA[c.id].upright}</p></div></div>))}
          </div>
          <a className="btn btn-solid" target="_blank" rel="noopener noreferrer" href={waLink(`Hi! We tried the compatibility reading on Spill the Cards (${a.name || "me"} & ${b.name || "my partner"}) and would like a personal relationship reading.`)}>Book a relationship reading</a>
        </div>
      )}
    </div>
  );
}
