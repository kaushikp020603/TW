/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge, Btn, Card, Empty, Icon, Label, Modal, Segmented, Switch, ago, fdate, field, inr, useUi } from "./ui";
import { useAdmin } from "./ctx";
import { GiftCardButton } from "./pages5";
import { MAJOR_ARCANA } from "@/data/tarot";
import { CardFace } from "@/components/TarotCard";

const KINDS = ["reading", "video", "voice", "package"];
const KIND_ICON: Record<string, string> = { reading: "services", video: "video", voice: "chat", package: "coupons" };

// ───────── Services ─────────
export function ServicesPage() {
  const { d, act } = useAdmin(); const [edit, setEdit] = useState<any | null>(null);
  const blank = { id: "", name: "", price: "", mins: "", blurb: "", kind: "reading", sessions: "0", active: true };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl">Services & pricing</h1><Btn v="primary" icon="plus" onClick={() => setEdit(blank)}>New service</Btn></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {d.services.map((s: any, i: number) => (
          <motion.div key={s.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -4 }} className={`rounded-2xl border border-white/[.07] bg-[#120c20] p-5 transition ${s.active ? "" : "opacity-55"}`}>
            <div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><Icon n={KIND_ICON[s.kind] || "services"} /></span><Switch label={`${s.name} active`} checked={!!s.active} onChange={(v) => act({ action: "saveService", ...s, active: v }, v ? "Service shown" : "Service hidden")} /></div>
            <h3 className="mt-3 font-display text-xl">{s.name}</h3><p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-ivory/50">{s.blurb}</p>
            <div className="mt-4 flex items-end justify-between"><p className="font-display text-3xl text-champagne">{inr(s.price)}</p><div className="flex items-center gap-2"><Badge tone="violet">{s.kind}{s.kind === "package" ? ` · ${s.sessions}` : ""}</Badge><Btn size="sm" icon="edit" onClick={() => setEdit({ ...s, price: String(s.price), sessions: String(s.sessions || 0), active: !!s.active })}>Edit</Btn></div></div>
          </motion.div>))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit service" : "New service"}>
        {edit && <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await act({ action: "saveService", ...edit, id: edit.id || edit.name.toLowerCase().replace(/\W+/g, "-").slice(0, 24), sort: edit.sort ?? 99 }, "Service saved"); setEdit(null); }}>
          <label className="block"><Label>Name</Label><input className={field} required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block"><Label>Price (₹)</Label><input className={field} inputMode="numeric" required value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></label>
            <label className="block"><Label>Type</Label><select className={field} value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label></div>
          <div className="grid grid-cols-2 gap-3"><label className="block"><Label>Duration label</Label><input className={field} value={edit.mins} onChange={(e) => setEdit({ ...edit, mins: e.target.value })} placeholder="30 min" /></label>
            {edit.kind === "package" && <label className="block"><Label>Credits included</Label><input className={field} inputMode="numeric" value={edit.sessions} onChange={(e) => setEdit({ ...edit, sessions: e.target.value })} /></label>}</div>
          <label className="block"><Label>Description</Label><textarea className={field} rows={3} value={edit.blurb} onChange={(e) => setEdit({ ...edit, blurb: e.target.value })} /></label>
          <Btn v="primary" className="w-full">Save service</Btn></form>}</Modal>
    </div>
  );
}

// ───────── Availability ─────────
export function AvailabilityPage() {
  const { d, act } = useAdmin(); const { toast } = useUi();
  const [slots, setSlots] = useState<string[]>(d.slots.filter((s: any) => !s.priority).map((s: any) => s.time));
  const [pri, setPri] = useState<string[]>(d.slots.filter((s: any) => s.priority).map((s: any) => s.time));
  const [ns, setNs] = useState(""); const [np, setNp] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState("");
  const dirty = slots.join() !== d.slots.filter((s: any) => !s.priority).map((s: any) => s.time).join() || pri.join() !== d.slots.filter((s: any) => s.priority).map((s: any) => s.time).join();
  const chips = (list: string[], set: (v: string[]) => void, tone: string) => (
    <div className="flex flex-wrap gap-2"><AnimatePresence>{list.map((t) => (
      <motion.span key={t} layout initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm ring-1 ring-inset ${tone}`}>{t}<button aria-label={`Remove ${t}`} onClick={() => set(list.filter((x) => x !== t))}><Icon n="close" className="h-3.5 w-3.5" /></button></motion.span>))}</AnimatePresence></div>);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl">Availability</h1>
        <AnimatePresence>{dirty && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Btn v="primary" icon="check" onClick={() => act({ action: "saveSlots", times: slots.join(","), priority: pri.join(",") }, "Slots saved")}>Save changes</Btn></motion.div>}</AnimatePresence></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Daily time slots">
          <div className="mb-4">{chips(slots, setSlots, "bg-violet-500/15 text-violet-100 ring-violet-400/25")}{!slots.length && <p className="text-sm text-ivory/40">No slots. Add at least one.</p>}</div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = ns.trim(); if (t && !slots.includes(t)) { setSlots([...slots, t]); setNs(""); } }}><input className={field} placeholder="e.g. 5:30 PM" aria-label="New slot" value={ns} onChange={(e) => setNs(e.target.value)} /><Btn v="soft">Add</Btn></form>
        </Card>
        <Card title={<span className="flex items-center gap-2">Priority slots <span className="text-amber-300">★</span></span>}>
          <p className="mb-3 text-sm text-ivory/50">Only premium members can book these.</p>
          <div className="mb-4">{chips(pri, setPri, "bg-amber-400/15 text-amber-100 ring-amber-300/25")}</div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = np.trim(); if (t && !pri.includes(t)) { setPri([...pri, t]); setNp(""); } }}><input className={field} placeholder="e.g. 8:00 AM" aria-label="New priority slot" value={np} onChange={(e) => setNp(e.target.value)} /><Btn v="soft">Add</Btn></form>
        </Card>
      </div>
      <Card title="Block time off">
        <p className="mb-4 text-sm text-ivory/50">Holidays, travel or breaks. Clients can&apos;t book blocked dates or slots.</p>
        <div className="flex flex-wrap gap-2"><input type="date" aria-label="Date" className={`${field} !w-auto`} value={date} onChange={(e) => setDate(e.target.value)} />
          <select aria-label="Slot" className={`${field} !w-auto`} value={time} onChange={(e) => setTime(e.target.value)}><option value="">Whole day</option>{d.slots.map((s: any) => <option key={s.time}>{s.time}</option>)}</select>
          <Btn v="primary" icon="plus" onClick={() => date ? act({ action: "block", date, time }, "Blocked") : toast("Pick a date first", "err")}>Block</Btn></div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">{d.blocked.map((b: any) => <motion.li layout key={b.id} className="flex items-center justify-between rounded-xl bg-red-500/[.07] px-4 py-3 text-sm"><span>{fdate(b.date)} · <span className="text-ivory/60">{b.time || "whole day"}</span></span><button className="text-xs uppercase tracking-[.15em] text-ivory/50 hover:text-white" onClick={() => act({ action: "unblock", id: b.id }, "Unblocked")}>Remove</button></motion.li>)}</ul>
        {!d.blocked.length && <p className="mt-4 text-sm text-ivory/40">Nothing blocked.</p>}
      </Card>
    </div>
  );
}

// ───────── Coupons ─────────
export function CouponsPage() {
  const { d, act } = useAdmin(); const { confirm } = useUi(); const [c, setC] = useState<any | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl">Coupons</h1><div className="flex gap-2"><GiftCardButton /><Btn v="primary" icon="plus" onClick={() => setC({ code: "", kind: "percent", value: "", max_uses: "" })}>New coupon</Btn></div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {d.coupons.map((x: any, i: number) => (
          <motion.div key={x.code} layout initial={{ opacity: 0, rotate: -1.5, y: 20 }} animate={{ opacity: 1, rotate: 0, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4, rotate: 0.6 }} className={`relative overflow-hidden rounded-2xl border border-dashed border-amber-300/30 bg-gradient-to-br from-[#2a1d12] to-[#120c20] p-5 ${x.active ? "" : "opacity-50"}`}>
            <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0a0714]" /><span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0a0714]" />
            <p className="font-display text-3xl tracking-[.2em] text-amber-200">{x.code}</p><p className="mt-1 text-lg text-ivory">{x.kind === "percent" ? `${x.value}% off` : `${inr(x.value)} off`}</p>
            <p className="mt-1 text-xs text-ivory/50">Used {x.uses}{x.max_uses ? ` of ${x.max_uses}` : ""} times</p>
            <div className="mt-4 flex items-center justify-between"><Switch label={`${x.code} active`} checked={!!x.active} onChange={(v) => act({ action: "saveCoupon", ...x, active: v }, v ? "Coupon enabled" : "Coupon disabled")} />
              <Btn size="sm" v="danger" icon="trash" onClick={async () => (await confirm({ title: `Delete ${x.code}?`, danger: true, yes: "Delete" })) && act({ action: "deleteCoupon", code: x.code }, "Coupon deleted")}>Delete</Btn></div>
          </motion.div>))}
      </div>
      {!d.coupons.length && <Empty icon="coupons" title="No coupons" hint="Create a promo code to offer discounts." />}
      <Modal open={!!c} onClose={() => setC(null)} title="New coupon">{c && <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await act({ action: "saveCoupon", ...c }, "Coupon created"); setC(null); }}>
        <label className="block"><Label>Code</Label><input className={`${field} uppercase tracking-widest`} required value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} placeholder="DIWALI20" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block"><Label>Type</Label><select className={field} value={c.kind} onChange={(e) => setC({ ...c, kind: e.target.value })}><option value="percent">Percent off</option><option value="flat">Flat ₹ off</option></select></label><label className="block"><Label>Value</Label><input className={field} inputMode="numeric" required value={c.value} onChange={(e) => setC({ ...c, value: e.target.value })} /></label></div>
        <label className="block"><Label>Max uses (optional)</Label><input className={field} inputMode="numeric" value={c.max_uses} onChange={(e) => setC({ ...c, max_uses: e.target.value })} /></label><Btn v="primary" className="w-full">Create coupon</Btn></form>}</Modal>
    </div>
  );
}

// ───────── Tarot cards ─────────
export function CardsPage() {
  const { d, act } = useAdmin(); const [id, setId] = useState(0);
  const ov = d.cardOverrides.find((o: any) => o.id === id); const base = MAJOR_ARCANA[id];
  return (
    <div className="space-y-6"><h1 className="font-display text-3xl">Tarot card meanings</h1>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto !p-2"><ul>{MAJOR_ARCANA.map((c) => (
          <li key={c.id}><button onClick={() => setId(c.id)} className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${id === c.id ? "text-white" : "text-ivory/70 hover:bg-white/[.05]"}`}>
            {id === c.id && <motion.span layoutId="cardsel" className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/60 to-fuchsia-600/50" />}
            <span className="relative w-8 font-display text-gold">{c.numeral}</span><span className="relative flex-1">{c.name}</span>{d.cardOverrides.some((o: any) => o.id === c.id) && <span className="relative h-2 w-2 rounded-full bg-fuchsia-300" title="customised" />}</button></li>))}</ul></Card>
        <CardEditor key={id + (ov ? JSON.stringify(ov) : "b")} id={id} base={base} ov={ov} act={act} />
      </div>
    </div>
  );
}
function CardEditor({ id, base, ov, act }: { id: number; base: any; ov: any; act: (b: object, m?: string) => Promise<any> }) {
  const [v, setV] = useState({ keywords: ov?.keywords ?? base.keywords, upright: ov?.upright ?? base.upright, reversed: ov?.reversed ?? base.reversed, love: ov?.love ?? base.love, career: ov?.career ?? base.career });
  const [rev, setRev] = useState(false);
  const f = (k: keyof typeof v, rows = 3) => <textarea rows={rows} className={field} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />;
  return (
    <Card title={<span>{base.numeral} · {base.name} {ov && <Badge tone="violet">customised</Badge>}</span>} action={<Segmented label="preview" value={rev ? "r" : "u"} onChange={(x) => setRev(x === "r")} options={[{ v: "u", label: "Upright" }, { v: "r", label: "Reversed" }]} />}>
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="mx-auto w-[150px] md:w-full"><motion.div key={String(rev)} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} className="aspect-[5/8] overflow-hidden rounded-[14px] border border-gold/60 shadow-[0_0_40px_rgba(214,179,109,.25)]"><CardFace card={{ ...base, ...v }} reversed={rev} /></motion.div>
          <p className="mt-3 text-center text-xs text-ivory/45">Live preview</p></div>
        <div className="space-y-4">
          <label className="block"><Label>Keywords</Label>{f("keywords", 1)}</label><label className="block"><Label>Upright meaning</Label>{f("upright")}</label><label className="block"><Label>Reversed meaning</Label>{f("reversed")}</label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="block"><Label>In love</Label>{f("love", 2)}</label><label className="block"><Label>In career</Label>{f("career", 2)}</label></div>
          <div className="flex flex-wrap items-center gap-2"><Btn v="primary" icon="check" onClick={() => act({ action: "saveCard", id, ...v }, "Meaning saved. Live on the site")}>Save meaning</Btn>{ov && <Btn onClick={() => act({ action: "resetCard", id }, "Reset to default")}>Reset to default</Btn>}</div>
        </div></div></Card>
  );
}

// ───────── Blog ─────────
export function BlogPage() {
  const { d, act } = useAdmin(); const { confirm } = useUi(); const [p, setP] = useState<any | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl">Blog</h1><Btn v="primary" icon="plus" onClick={() => setP({ title: "", body: "", slug: "", published: true })}>New article</Btn></div>
      <div className="grid gap-4 sm:grid-cols-2">{d.posts.map((x: any, i: number) => (
        <motion.div key={x.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }} className="rounded-2xl border border-white/[.07] bg-[#120c20] p-5">
          <div className="flex items-center justify-between"><Badge tone={x.published ? "green" : "gray"}>{x.published ? "published" : "draft"}</Badge><span className="text-xs text-ivory/40">{fdate(x.created)}</span></div>
          <h3 className="mt-3 font-display text-xl">{x.title}</h3><p className="mt-1 line-clamp-2 text-sm text-ivory/50">{x.body}</p>
          <div className="mt-4 flex flex-wrap gap-2"><Btn size="sm" icon="edit" onClick={() => setP({ ...x, published: !!x.published })}>Edit</Btn><a href={`/blog/${x.slug}`} target="_blank" rel="noreferrer"><Btn size="sm" icon="external">View</Btn></a>
            <Btn size="sm" onClick={() => act({ action: "savePost", slug: x.slug, title: x.title, body: x.body, published: !x.published }, x.published ? "Unpublished" : "Published")}>{x.published ? "Unpublish" : "Publish"}</Btn>
            <Btn size="sm" v="danger" icon="trash" onClick={async () => (await confirm({ title: "Delete this article?", danger: true, yes: "Delete" })) && act({ action: "deletePost", id: x.id }, "Deleted")} /></div>
        </motion.div>))}</div>
      {!d.posts.length && <Empty icon="blog" title="No articles yet" hint="Write guides and stories to help people find the site on Google." />}
      <Modal open={!!p} onClose={() => setP(null)} title={p?.slug ? "Edit article" : "New article"}>
        {p && <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await act({ action: "savePost", slug: p.slug, title: p.title, body: p.body, published: p.published }, "Article saved"); setP(null); }}>
          <label className="block"><Label>Title</Label><input className={field} required value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} /></label>
          <label className="block"><Label>Body (blank line = new paragraph)</Label><textarea className={`${field} min-h-[220px]`} required value={p.body} onChange={(e) => setP({ ...p, body: e.target.value })} /></label>
          <div className="flex items-center justify-between"><span className="text-sm text-ivory/70">Publish immediately</span><Switch label="Published" checked={p.published} onChange={(v) => setP({ ...p, published: v })} /></div>
          <Btn v="primary" className="w-full">Save article</Btn></form>}</Modal>
    </div>
  );
}

// ───────── Notices ─────────
export function NoticesPage() {
  const { d, act } = useAdmin(); const [t, setT] = useState("");
  return (
    <div className="space-y-6"><h1 className="font-display text-3xl">Announcements</h1>
      <Card title="Publish a banner"><p className="mb-3 text-sm text-ivory/50">The newest active announcement appears as a banner across the website.</p>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={async (e) => { e.preventDefault(); if (!t.trim()) return; await act({ action: "addAnnouncement", text: t }, "Announcement published"); setT(""); }}><input className={field} placeholder="e.g. Full-moon special: 20% off all readings this week ✦" aria-label="Announcement" value={t} onChange={(e) => setT(e.target.value)} /><Btn v="primary" icon="bell">Publish</Btn></form>
        {t && <div className="mt-4 overflow-hidden rounded-xl"><p className="mb-1 text-xs text-ivory/40">Preview</p><div className="flex items-center gap-3 bg-gradient-to-r from-gold to-champagne px-4 py-2.5 text-sm font-medium text-midnight"><span>✦</span>{t}</div></div>}</Card>
      <div className="space-y-3"><AnimatePresence>{d.announcements.map((a: any) => (
        <motion.div key={a.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[.07] bg-[#120c20] p-4"><span className="min-w-0 flex-1 text-sm">{a.text}<span className="block text-xs text-ivory/35">{ago(a.created)}</span></span>
          <Badge tone={a.active ? "green" : "gray"}>{a.active ? "live" : "hidden"}</Badge><Switch label="Active" checked={!!a.active} onChange={(v) => act({ action: "toggleAnnouncement", id: a.id, active: v })} /><Btn size="sm" v="danger" icon="trash" onClick={() => act({ action: "deleteAnnouncement", id: a.id }, "Deleted")} /></motion.div>))}</AnimatePresence></div>
      {!d.announcements.length && <Empty icon="bell" title="No announcements" />}
    </div>
  );
}

// ───────── Reviews ─────────
export function ReviewsPage() {
  const { d, act } = useAdmin(); const [tab, setTab] = useState("live"); const [edit, setEdit] = useState<any | null>(null);
  const list = useMemo(() => d.reviews.filter((r: any) => (tab === "pending" ? !r.approved : r.approved)), [d.reviews, tab]);
  const blank = { id: 0, name: "", city: "", category: "General guidance", text: "", rating: 5, place: "all", featured: false, approved: true };
  const TOPICS = ["Love & relationships", "Career & finance", "Self discovery", "General guidance", "Video session", "Card shop"];
  const PLACES: [string, string][] = [["all", "Everywhere"], ["home", "Home page only"], ["services", "Next to the readings"], ["shop", "Card shop only"]];
  return (
    <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl">Testimonials</h1><p className="mt-1 text-sm text-ivory/50">Add your own, edit the text, choose where each one appears, or approve what visitors submit.</p></div>
      <div className="flex flex-wrap gap-2"><Segmented label="reviews" value={tab} onChange={setTab} options={[{ v: "live", label: `Published ${d.reviews.filter((r: any) => r.approved).length}` }, { v: "pending", label: `Pending ${d.reviews.filter((r: any) => !r.approved).length}` }]} />
        <Btn v="primary" icon="plus" onClick={() => setEdit(blank)}>Add testimonial</Btn></div></div>
      <div className="grid gap-4 md:grid-cols-2"><AnimatePresence mode="popLayout">{list.map((r: any) => (
        <motion.figure key={r.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="rounded-2xl border border-white/[.07] bg-[#120c20] p-5">
          <div className="flex items-start justify-between"><span className="font-display text-4xl leading-none text-gold/60">&ldquo;</span><span className="text-sm text-amber-300" aria-label={`${r.rating || 5} stars`}>{"★".repeat(r.rating || 5)}</span></div>
          <blockquote className="font-light italic text-ivory/90">{r.text}</blockquote>
          <figcaption className="mt-3 text-xs text-ivory/50">{r.name}{r.city ? `, ${r.city}` : ""} · {r.category || "General"} · {ago(r.created)}</figcaption>
          <div className="mt-2 flex flex-wrap gap-2">{r.featured ? <Badge tone="amber">Featured</Badge> : null}<Badge tone="violet">{(PLACES.find((p) => p[0] === (r.place || "all")) || PLACES[0])[1]}</Badge></div>
          <div className="mt-4 flex flex-wrap gap-2"><Btn size="sm" icon="edit" onClick={() => setEdit({ ...r, featured: !!r.featured, approved: !!r.approved, city: r.city || "", place: r.place || "all", rating: r.rating || 5 })}>Edit</Btn>
            {r.approved ? <Btn size="sm" onClick={() => act({ action: "reviewApprove", id: r.id, approved: false }, "Unpublished")}>Unpublish</Btn> : <Btn size="sm" v="primary" icon="check" onClick={() => act({ action: "reviewApprove", id: r.id, approved: true }, "Published")}>Publish</Btn>}
            <Btn size="sm" v="danger" icon="trash" onClick={() => act({ action: "reviewDelete", id: r.id }, "Moved to Recently deleted")}>Delete</Btn></div></motion.figure>))}</AnimatePresence></div>
      {!list.length && <Empty icon="star" title={tab === "pending" ? "All caught up" : "Nothing published yet"} hint="Press Add testimonial to write one, or wait for visitors to submit reviews." />}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit testimonial" : "Add testimonial"}>
        {edit && <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await act({ action: "saveReview", ...edit }, "Testimonial saved"); setEdit(null); }}>
          <label className="block"><Label>What they said</Label><textarea className={field} rows={4} required maxLength={600} value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block"><Label>Name or initials</Label><input className={field} maxLength={60} placeholder="Priya S." value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label className="block"><Label>City (optional)</Label><input className={field} maxLength={40} value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></label></div>
          <div className="grid grid-cols-2 gap-3"><label className="block"><Label>Topic</Label><select className={field} value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{TOPICS.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label className="block"><Label>Stars</Label><select className={field} value={edit.rating} onChange={(e) => setEdit({ ...edit, rating: Number(e.target.value) })}>{[5, 4, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select></label></div>
          <label className="block"><Label>Show it</Label><select className={field} value={edit.place} onChange={(e) => setEdit({ ...edit, place: e.target.value })}>{PLACES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <div className="flex flex-wrap items-center gap-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={edit.featured} onChange={(e) => setEdit({ ...edit, featured: e.target.checked })} />Feature first</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={edit.approved} onChange={(e) => setEdit({ ...edit, approved: e.target.checked })} />Published</label></div>
          <p className="text-xs text-ivory/45">Only add testimonials from real clients who agreed to be quoted.</p>
          <Btn v="primary" className="w-full">Save testimonial</Btn></form>}</Modal>
    </div>
  );
}
