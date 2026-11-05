"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReviewStrip from "./ReviewStrip";
import GuidanceCard, { CardFan } from "./GuidanceCard";
import { CardBack } from "./TarotCard";
import { GUIDANCE, KIND_LABEL, SEED_PRODUCTS, type Motif, type Product } from "@/data/shop";
import { waLink } from "@/config/site";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function ShopClient() {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [order, setOrder] = useState<Product | null>(null);
  const [pulled, setPulled] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/public?q=products").then((r) => r.json()).then((d) => { if (Array.isArray(d.products) && d.products.length) setProducts(d.products); }).catch(() => {});
  }, []);
  const pull = () => setPulled((p) => { let n = Math.floor(Math.random() * GUIDANCE.length); if (n === p) n = (n + 1) % GUIDANCE.length; return n; });

  return (
    <div className="space-y-24">
      {/* free pull */}
      <section aria-labelledby="pull-h" className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Try one before you buy</p>
          <h2 id="pull-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.4rem)]">Pull a <span className="gold-text italic">guidance card</span></h2>
          <p className="mt-4 max-w-md text-lg font-light leading-relaxed text-ivory/85">Breathe in, think of what you need today, then pull a card. Each one in the deck carries a short message like this.</p>
          <button className="btn btn-solid mt-7" onClick={pull}>{pulled === null ? "Pull my card" : "Pull another"}</button>
        </div>
        <div className="mx-auto w-52 sm:w-60" style={{ perspective: 1000 }}>
          <AnimatePresence mode="wait">
            <motion.div key={pulled ?? "back"} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.45 }}
              className="aspect-[5/8] overflow-hidden rounded-2xl border border-gold/60 shadow-[0_0_60px_rgba(214,179,109,.3)]">
              {pulled === null ? <CardBack /> : <GuidanceCard card={GUIDANCE[pulled]} uid="pull" className="h-full w-full" />}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* products */}
      <section aria-labelledby="prod-h">
        <h2 id="prod-h" className="h-hero text-[clamp(2rem,4.6vw,3.4rem)]">Cards you can <span className="gold-text italic">hold</span></h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <motion.article key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8%" }} transition={{ delay: (i % 3) * 0.08 }}
              className="glass tilt flex flex-col rounded-2xl p-6" aria-label={p.name}>
              <div className="rounded-xl bg-[radial-gradient(circle_at_50%_30%,rgba(143,112,224,.3),transparent_70%)] px-4 pb-5 pt-9"><CardFan art={p.art} /></div>
              <p className="eyebrow mt-5">{KIND_LABEL[p.kind] || p.kind}</p>
              <h3 className="mt-1 font-display text-2xl text-champagne">{p.name}</h3>
              <p className="mt-2 flex-1 text-sm font-light leading-relaxed text-ivory/80">{p.blurb}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <div><p className="font-display text-3xl text-champagne">{inr(p.price)}</p>{p.stock != null && p.stock > 0 && p.stock <= 5 && <p className="text-xs text-amber-300">Only {p.stock} left</p>}</div>
                {p.stock != null && p.stock <= 0
                  ? <a className="btn !px-4" href={waLink(`Hi! Please let me know when ${p.name} is back in stock.`)} target="_blank" rel="noopener noreferrer">Notify me</a>
                  : <button className="btn btn-solid !px-5" onClick={() => setOrder(p)}>Order</button>}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <Designer />

      <ReviewStrip place="shop" title="Loved by customers" />

      {/* all twelve */}
      <section aria-labelledby="all-h">
        <h2 id="all-h" className="h-hero text-[clamp(1.8rem,4vw,3rem)]">A peek at the <span className="gold-text italic">deck</span></h2>
        <ul className="scrollbar-none mt-8 flex snap-x gap-4 overflow-x-auto pb-4">
          {GUIDANCE.map((g, i) => <li key={g.title} className="w-40 shrink-0 snap-start sm:w-48"><div className="tilt overflow-hidden rounded-xl border border-gold/50 shadow-[0_10px_40px_rgba(10,4,40,.5)]"><GuidanceCard card={g} uid={`all${i}`} className="w-full" /></div></li>)}
        </ul>
      </section>

      {/* how */}
      <section aria-labelledby="how2-h" className="max-w-3xl">
        <h2 id="how2-h" className="h-hero text-[clamp(1.8rem,4vw,3rem)]">How ordering <span className="gold-text italic">works</span></h2>
        <ol className="mt-6 list-decimal space-y-3 pl-5 font-light text-ivory/85"><li>Choose a product and press Order. Tell us how many and your name.</li><li>We open WhatsApp with your order ready to send. Press send.</li><li>We confirm the price with delivery to your city and share a UPI QR.</li><li>Your cards are packed with care and shipped across India.</li></ol>
      </section>

      <AnimatePresence>{order && <OrderModal key={order.id} p={order} onClose={() => setOrder(null)} />}</AnimatePresence>
    </div>
  );
}

function OrderModal({ p, onClose }: { p: Product; onClose: () => void }) {
  const [qty, setQty] = useState(1); const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [done, setDone] = useState<{ code: string; link: string } | null>(null);
  const total = p.price * qty;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/shop", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product: p.id, qty, name, phone, note }) }).then((x) => x.json()).catch(() => ({ error: "Network problem. Please try again." }));
    setBusy(false);
    if (!r.code) { setErr(r.error || "Something went wrong."); return; }
    const msg = `Hi! I'd like to order ${qty} × ${p.name} (${inr(total)}).\nOrder ${r.code}\nName: ${name}${note ? `\nNote: ${note}` : ""}\nPlease share delivery details and payment.`;
    setDone({ code: r.code, link: waLink(msg) });
  };
  const input = "mt-1 w-full rounded-lg border border-gold/30 bg-[#1b1240] px-3 py-2.5 text-ivory outline-none focus:border-gold";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[96] flex items-end justify-center bg-[#1b1240]/80 p-3 sm:items-center" onClick={onClose}>
      <motion.div role="dialog" aria-label={`Order ${p.name}`} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass max-h-[92svh] w-full max-w-md overflow-y-auto rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Order</p><h3 className="font-display text-2xl text-champagne">{p.name}</h3></div><button aria-label="Close" className="h-10 w-10 text-2xl text-ivory/60 hover:text-gold" onClick={onClose}>×</button></div>
        <p className="mt-2 text-sm font-light text-ivory/75">{p.details}</p>
        {done ? (
          <div className="mt-6 text-center">
            <p className="font-display text-2xl text-champagne">Order {done.code} saved ✦</p>
            <p className="mt-2 text-sm font-light text-ivory/80">One last step: send it on WhatsApp so we can confirm delivery and payment.</p>
            <a className="btn btn-solid mt-5 w-full" href={done.link} target="_blank" rel="noopener noreferrer">Send order on WhatsApp</a>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <label className="block text-sm">Your name<input required minLength={2} maxLength={60} className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
            <label className="block text-sm">Phone (optional)<input inputMode="tel" maxLength={20} className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
            <div className="flex items-end gap-4">
              <label className="block text-sm">Quantity<select className={input} value={qty} onChange={(e) => setQty(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label>
              <p className="pb-2 font-display text-3xl text-champagne">{inr(total)}</p>
            </div>
            <label className="block text-sm">{p.kind === "custom" ? "Name, theme and message for your card" : "City or note (optional)"}<textarea className={input} rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} required={p.kind === "custom"} /></label>
            {err && <p role="alert" className="text-sm text-rose-300">{err}</p>}
            <button className="btn btn-solid w-full" disabled={busy}>{busy ? "Saving…" : "Continue to WhatsApp"}</button>
            <p className="text-center text-xs text-ivory/55">Delivery charges are confirmed on WhatsApp. Nothing is charged here.</p>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

const MOTIFS: Motif[] = ["moon", "sun", "star", "lotus", "heart", "eye", "crown", "key"];
const HUES = [{ n: "Royal violet", h: 262 }, { n: "Midnight blue", h: 225 }, { n: "Rose", h: 330 }, { n: "Amethyst", h: 290 }, { n: "Golden dusk", h: 38 }];

/** Live card designer: pick a motif and colour, write a title and message, then order it on WhatsApp. */
function Designer() {
  const [motif, setMotif] = useState<Motif>("moon"); const [hue, setHue] = useState(262);
  const [title, setTitle] = useState("Trust"); const [message, setMessage] = useState("You are further along than you think.");
  const [name, setName] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState<{ code: string; link: string } | null>(null); const [err, setErr] = useState("");
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const note = `Custom card. Title: ${title}. Message: ${message}. Motif: ${motif}. Colour: ${HUES.find((x) => x.h === hue)?.n}.`;
    const r = await fetch("/api/shop", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product: "custom-card", qty: 1, name, note }) }).then((x) => x.json()).catch(() => ({ error: "Network problem." }));
    setBusy(false);
    if (!r.code) { setErr(r.error || "Something went wrong."); return; }
    setDone({ code: r.code, link: waLink(`Hi! I designed a custom card on the website.\nOrder ${r.code}\nName: ${name}\n${note}\nPlease share a preview and the price.`) });
  };
  const input = "mt-1 w-full rounded-lg border border-gold/30 bg-[#1b1240] px-3 py-2.5 text-ivory outline-none focus:border-gold";
  return (
    <section aria-labelledby="design-h" className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
      <div>
        <p className="eyebrow">Make it yours</p>
        <h2 id="design-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.4rem)]">Design your <span className="gold-text italic">own card</span></h2>
        <form onSubmit={send} className="mt-6 max-w-lg space-y-4">
          <fieldset><legend className="text-sm">Symbol</legend><div className="mt-2 flex flex-wrap gap-2">{MOTIFS.map((m) => <button type="button" key={m} aria-pressed={motif === m} onClick={() => setMotif(m)} className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest ${motif === m ? "border-gold bg-gold text-[#1b1240]" : "border-gold/40 text-champagne"}`}>{m}</button>)}</div></fieldset>
          <fieldset><legend className="text-sm">Colour</legend><div className="mt-2 flex flex-wrap gap-3">{HUES.map((x) => <button type="button" key={x.h} aria-label={x.n} aria-pressed={hue === x.h} onClick={() => setHue(x.h)} className={`h-11 w-11 rounded-full border-2 ${hue === x.h ? "border-gold" : "border-transparent"}`} style={{ background: `hsl(${x.h} 55% 30%)` }} />)}</div></fieldset>
          <label className="block text-sm">Card title<input className={input} maxLength={18} required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="block text-sm">Message<textarea className={input} rows={3} maxLength={110} required value={message} onChange={(e) => setMessage(e.target.value)} /></label>
          <label className="block text-sm">Your name<input className={input} maxLength={60} required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></label>
          {err && <p role="alert" className="text-sm text-rose-300">{err}</p>}
          {done ? <a className="btn btn-solid w-full" href={done.link} target="_blank" rel="noopener noreferrer">Send design on WhatsApp ({done.code})</a> : <button className="btn btn-solid w-full" disabled={busy}>{busy ? "Saving…" : "Order this card · ₹499"}</button>}
        </form>
      </div>
      <div className="mx-auto w-56 sm:w-64 lg:w-72"><div className="overflow-hidden rounded-2xl border border-gold/60 shadow-[0_0_70px_rgba(214,179,109,.3)]"><GuidanceCard card={{ title: title || "…", message: message || "…", motif, hue }} uid="designer" className="w-full" /></div></div>
    </section>
  );
}
