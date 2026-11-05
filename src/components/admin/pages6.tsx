/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Btn, Card, Empty, Icon, Label, Modal, Segmented, Switch, ago, field, useUi, waNumber } from "./ui";
const KIND_SUGGEST = ["Tarot deck", "Guidance cards", "Poster", "Print", "Digital download", "Custom design"];

const post = (b: object) => fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json());
const inr = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN");
/** Shrinks a chosen picture to a web-friendly WebP (max 1200 px) so it uploads quickly. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file); const s = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not read that picture"))), "image/webp", 0.86));
}
const STATUSES = ["new", "paid", "shipped", "sent", "done", "cancelled"];
const TONE: Record<string, string> = { new: "amber", paid: "green", shipped: "violet", sent: "violet", done: "violet", cancelled: "gray" };

export function ShopPage() {
  const { toast } = useUi();
  const [tab, setTab] = useState("products");
  const [data, setData] = useState<{ products: any[]; orders: any[] } | null>(null);
  const [edit, setEdit] = useState<any | null>(null);
  const load = useCallback(async () => { const r = await post({ action: "listShop" }); if (r.ok) setData({ products: r.products, orders: r.orders }); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  const act = async (body: object, msg: string) => { const r = await post(body); if (r.ok === false || r.error) toast(r.error || "Something went wrong", "err"); else toast(msg); await load(); };
  const blank = { id: "", name: "", kind: "", price: "", blurb: "", details: "", image: 0, active: true, stock: "" };
  const [up, setUp] = useState(false);
  const upload = async (f: File) => { setUp(true); try { const fd = new FormData(); fd.append("file", new File([await shrink(f)], f.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" })); const r = await fetch("/api/admin/media", { method: "POST", body: fd }).then((x) => x.json()); if (r.media?.id) setEdit((e: any) => ({ ...e, image: r.media.id })); else toast(r.error || "Upload failed", "err"); } catch (e) { toast((e as Error).message, "err"); } setUp(false); };
  const open = data?.orders.filter((o) => o.status === "new").length ?? 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl">Card shop</h1><p className="mt-1 text-sm text-ivory/50">Products appear on the public Card Shop page. Buyers send their order on WhatsApp.</p></div>
        <div className="flex flex-wrap gap-2">
          <Segmented label="shop tab" value={tab} onChange={setTab} options={[{ v: "products", label: "Products" }, { v: "orders", label: <span>Orders{open ? ` (${open})` : ""}</span> }]} />
          {tab === "products" && <Btn v="primary" icon="plus" onClick={() => setEdit(blank)}>New product</Btn>}
        </div>
      </div>

      {!data ? <Empty icon="cards" title="Loading…" /> : tab === "products" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.products.map((p, i) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-2xl border border-white/[.07] bg-[#120c20] p-5 ${p.active ? "" : "opacity-55"}`}>
              <div className="flex items-start justify-between"><Badge tone="violet">{p.kind}</Badge><Switch label={`${p.name} visible`} checked={!!p.active} onChange={(v) => act({ action: "saveProduct", ...p, active: v }, v ? "Product shown" : "Product hidden")} /></div>
              <div className="mt-3 aspect-[4/5] overflow-hidden rounded-xl bg-white/[.04]">{p.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/media/${p.image}`} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-ivory/40">No picture yet</div>}</div>
              <h3 className="mt-3 font-display text-xl">{p.name}</h3><p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-ivory/50">{p.blurb}</p>
              <div className="mt-4 flex items-end justify-between"><div><p className="font-display text-3xl text-champagne">{inr(p.price)}</p><p className="text-xs text-ivory/50">{p.stock === null || p.stock === undefined ? "Unlimited stock" : p.stock <= 0 ? "Sold out" : `${p.stock} in stock`}</p></div><Btn size="sm" icon="edit" onClick={() => setEdit({ ...p, image: p.image || 0, price: String(p.price), active: !!p.active, stock: p.stock === null || p.stock === undefined ? "" : String(p.stock) })}>Edit</Btn></div>
            </motion.div>))}
          {!data.products.length && <Empty icon="cards" title="No products yet" hint="Press New product to upload your first design. The shop page stays empty until you do." />}
        </div>
      ) : (
        <Card title="Orders">
          {data.orders.length ? <ul className="space-y-3">{data.orders.map((o) => (
            <li key={o.id} className="rounded-xl bg-white/[.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium">{o.qty} × {o.product_name} <span className="text-ivory/50">· {inr(o.total)}</span></p>
                  <p className="text-sm text-ivory/60">{o.name}{o.phone ? ` · ${o.phone}` : ""} · {o.code} · {ago(o.created)}</p>
                  {o.note && <p className="mt-1 text-sm text-ivory/75">“{o.note}”</p>}</div>
                <Badge tone={TONE[o.status] || "gray"}>{o.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => <Btn key={s} size="sm" v={o.status === s ? "primary" : "ghost"} className="capitalize" onClick={() => act({ action: "setOrderStatus", id: o.id, status: s }, `Marked ${s}`)}>{s}</Btn>)}
                {o.phone && <a target="_blank" rel="noreferrer" href={`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`Hi ${o.name}, thank you for your order ${o.code} (${o.qty} × ${o.product_name}). Please share your delivery address and pincode so we can confirm shipping.`)}`}><Btn size="sm" icon="whatsapp">Message</Btn></a>}
              </div>
            </li>))}</ul> : <Empty icon="cards" title="No orders yet" hint="Orders appear here as soon as someone presses “Continue to WhatsApp” in the shop." />}
        </Card>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit product" : "New product"}>
        {edit && <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await act({ action: "saveProduct", ...edit, id: edit.id || edit.name.toLowerCase().replace(/\W+/g, "-").slice(0, 30), sort: edit.sort ?? 99 }, "Product saved"); setEdit(null); }}>
          <label className="block"><Label>Name</Label><input className={field} required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><Label>Price (₹)</Label><input className={field} inputMode="numeric" required value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></label>
            <label className="block"><Label>Type</Label><input className={field} list="kinds" required maxLength={30} placeholder="e.g. Tarot deck" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })} /><datalist id="kinds">{KIND_SUGGEST.map((k) => <option key={k} value={k} />)}</datalist></label>
          </div>
          <div><Label>Picture of your design</Label>
            <div className="mt-1 flex items-center gap-4">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-white/[.05]">{edit.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/media/${edit.image}`} alt="Product" className="h-full w-full object-cover" /> : null}</div>
              <div className="space-y-2"><label className="inline-block"><span className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5">{up ? "Uploading…" : edit.image ? "Change picture" : "Upload picture"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload product picture" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} /></label>
                <p className="text-xs text-ivory/45">PNG, JPG or WebP. It is resized automatically.</p></div></div></div>
          <label className="block"><Label>Stock (leave empty for unlimited)</Label><input className={field} inputMode="numeric" value={edit.stock ?? ""} onChange={(e) => setEdit({ ...edit, stock: e.target.value.replace(/\D/g, "") })} /></label>
          <label className="block"><Label>Short description</Label><textarea className={field} rows={2} maxLength={200} value={edit.blurb} onChange={(e) => setEdit({ ...edit, blurb: e.target.value })} /></label>
          <label className="block"><Label>Details (shown when ordering)</Label><textarea className={field} rows={3} maxLength={400} value={edit.details} onChange={(e) => setEdit({ ...edit, details: e.target.value })} /></label>
          <div className="flex gap-2"><Btn v="primary" className="flex-1">Save product</Btn>
            {edit.id && <Btn v="danger" type="button" onClick={async () => { if (confirm("Delete this product? Existing orders are kept.")) { await act({ action: "deleteProduct", id: edit.id }, "Product deleted"); setEdit(null); } }}><Icon n="trash" /></Btn>}</div>
        </form>}
      </Modal>
    </div>
  );
}
