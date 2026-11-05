"use client";
import { useEffect, useState } from "react";
import PageShell, { field } from "@/components/PageShell";

type R = { id: number; name: string; bio: string; specialties: string; whatsapp: string; main: number };
export default function Readers() {
  const [readers, setReaders] = useState<R[]>([]); const [f, setF] = useState({ name: "", whatsapp: "", email: "", specialties: "", bio: "" }); const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/site?q=readers").then((r) => r.json()).then((j) => setReaders(j.readers || [])); }, []);
  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "apply_reader", ...f }) }); const j = await r.json();
    setMsg(j.message || j.error); if (r.ok) setF({ name: "", whatsapp: "", email: "", specialties: "", bio: "" });
  }
  return (
    <PageShell eyebrow="The reader marketplace" title={<>Our <span className="gold-text italic">readers</span></>} intro="Every reader listed here has been reviewed and verified. Message a reader on WhatsApp to arrange a session directly.">
      <div className="grid gap-6 md:grid-cols-2">
        {readers.map((r) => (
          <article key={r.id} className="glass frame p-6">
            <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold font-display text-xl text-midnight">{r.name[0]}</span><div><h2 className="font-display text-2xl text-champagne">{r.name}</h2><p className="text-xs text-lavender">Verified{r.main ? " · host reader" : ""}</p></div></div>
            <p className="eyebrow mt-4">{r.specialties}</p><p className="mt-2 text-sm font-light text-ivory/80">{r.bio}</p>
            <a className="btn btn-solid mt-5" target="_blank" rel="noopener noreferrer" href={r.main ? "/#book" : `https://wa.me/${r.whatsapp}?text=${encodeURIComponent("Hi! I found you on Spill the Cards and would like to book a reading.")}`}>{r.main ? "Book online" : "Message on WhatsApp"}</a>
          </article>))}
      </div>
      <form onSubmit={apply} className="glass frame mt-14 max-w-xl space-y-3 p-6">
        <p className="eyebrow">Are you a tarot reader? Apply to join</p>
        <input className={field} placeholder="Your name" aria-label="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={field} placeholder="WhatsApp number with country code" aria-label="WhatsApp" required value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
        <input className={field} placeholder="Email (optional)" aria-label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={field} placeholder="Specialties (e.g. Love · Career)" aria-label="Specialties" value={f.specialties} onChange={(e) => setF({ ...f, specialties: e.target.value })} />
        <textarea className={field} rows={3} placeholder="A short bio: your approach and experience (be honest)" aria-label="Bio" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        <button className="btn btn-solid">Apply</button>{msg && <p role="status" className="text-xs text-champagne">{msg}</p>}
      </form>
    </PageShell>
  );
}
