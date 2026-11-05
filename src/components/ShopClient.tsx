"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReviewStrip from "./ReviewStrip";
import { waLink } from "@/config/site";
import type { Product } from "@/data/shop";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function ShopClient() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [order, setOrder] = useState<Product | null>(null);
  useEffect(() => {
    fetch("/api/public?q=products").then((r) => r.json()).then((d) => setProducts(Array.isArray(d.products) ? d.products : [])).catch(() => setProducts([]));
  }, []);

  return (
    <div className="space-y-20">
      <section aria-labelledby="prod-h">
        <h2 id="prod-h" className="sr-only">Products</h2>
        {products === null ? <p className="text-center text-ivory/60" role="status">Loading…</p> : products.length === 0 ? (
          <div className="glass mx-auto max-w-xl rounded-2xl p-10 text-center">
            <p className="font-display text-3xl text-champagne">Our collection is on its way</p>
            <p className="mt-3 font-light text-ivory/80">New card designs are being prepared. Message us on WhatsApp to hear first, or to ask about a custom design.</p>
            <a className="btn btn-solid mt-6" href={waLink("Hi! I'd like to know when your cards are available.")} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <motion.article key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8%" }} transition={{ delay: (i % 3) * 0.08 }} className="glass tilt flex flex-col overflow-hidden rounded-2xl" aria-label={p.name}>
                <div className="aspect-[4/5] overflow-hidden bg-[#2a1c5c]">
                  {p.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/media/${p.image}`} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                    : <div className="flex h-full items-center justify-center text-5xl text-gold/50">✦</div>}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow">{p.kind}</p>
                  <h3 className="mt-1 font-display text-2xl text-champagne">{p.name}</h3>
                  <p className="mt-2 flex-1 text-sm font-light leading-relaxed text-ivory/80">{p.blurb}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div><p className="font-display text-3xl text-champagne">{inr(p.price)}</p>{p.stock != null && p.stock > 0 && p.stock <= 5 && <p className="text-xs text-amber-300">Only {p.stock} left</p>}</div>
                    {p.stock != null && p.stock <= 0
                      ? <a className="btn !px-4" href={waLink(`Hi! Please let me know when ${p.name} is back in stock.`)} target="_blank" rel="noopener noreferrer">Notify me</a>
                      : <button className="btn btn-solid !px-5" onClick={() => setOrder(p)}>Order</button>}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <ReviewStrip place="shop" title="Loved by customers" />

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
  const total = p.price * qty; const custom = /custom/i.test(p.kind);
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
        {p.details && <p className="mt-2 text-sm font-light text-ivory/75">{p.details}</p>}
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
            <label className="block text-sm">{custom ? "Describe the design you would like" : "City or note (optional)"}<textarea className={input} rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} required={custom} /></label>
            {err && <p role="alert" className="text-sm text-rose-300">{err}</p>}
            <button className="btn btn-solid w-full" disabled={busy}>{busy ? "Saving…" : "Continue to WhatsApp"}</button>
            <p className="text-center text-xs text-ivory/55">Delivery charges are confirmed on WhatsApp. Nothing is charged here.</p>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
