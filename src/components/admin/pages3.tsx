/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Badge, Btn, Card, DataTable, Empty, Icon, Label, Segmented, Stat, ago, fdate, field, inr, useUi, type Col } from "./ui";
import { AreaChart, BarChart, Donut, HBars } from "./charts";
import { useAdmin } from "./ctx";
import { BackupsCard, BusinessCard, TrashCard } from "./pages5";
import { MAJOR_ARCANA } from "@/data/tarot";

// ───────── Chat ─────────
export function ChatPage() {
  const { d, act, openClient } = useAdmin(); const [uid, setUid] = useState<number | null>(null); const [t, setT] = useState("");
  const msgs = useMemo(() => d.allMessages.filter((m: any) => m.user_id === uid), [d.allMessages, uid]); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs.length, uid]);
  const waiting = (id: number) => { const m = d.allMessages.filter((x: any) => x.user_id === id); return m.length > 0 && m[m.length - 1].sender === "user"; };
  const cur = d.chats.find((c: any) => c.id === uid);
  return (
    <div className="space-y-6"><h1 className="font-display text-3xl">Chat</h1>
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <Card className="!p-2 md:max-h-[68vh] md:overflow-y-auto"><ul className="space-y-1">{d.chats.map((c: any) => (
          <li key={c.id}><button onClick={() => setUid(c.id)} className={`relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${uid === c.id ? "bg-white/10" : "hover:bg-white/[.05]"}`}><Avatar name={c.name} />
            <span className="min-w-0 flex-1"><span className="flex items-center justify-between"><span className="truncate text-sm text-ivory">{c.name}</span><span className="text-[.65rem] text-ivory/35">{ago(c.at)}</span></span><span className="block truncate text-xs text-ivory/50">{c.last}</span></span>
            {waiting(c.id) && <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-fuchsia-400" aria-label="Awaiting reply" />}</button></li>))}</ul>
          {!d.chats.length && <Empty icon="chat" title="No conversations" hint="When clients message you, they appear here." />}</Card>
        <Card className="flex min-h-[420px] flex-col md:h-[68vh]">
          {uid == null ? <Empty icon="chat" title="Select a conversation" /> : (<>
            <div className="mb-3 flex items-center justify-between border-b border-white/[.07] pb-3"><div className="flex items-center gap-3"><Avatar name={cur?.name || "?"} /><div><p className="text-ivory">{cur?.name}</p><p className="text-xs text-ivory/45">{cur?.email}</p></div></div><Btn size="sm" icon="clients" onClick={() => openClient(uid)}>Profile</Btn></div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1"><AnimatePresence initial={false}>{msgs.map((m: any, i: number) => (
              <motion.div key={m.created + "-" + i} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${m.sender === "reader" ? "justify-end" : ""}`}><p className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${m.sender === "reader" ? "rounded-br-sm bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white" : "rounded-bl-sm bg-white/[.08]"}`}>{m.text}<span className="mt-1 block text-[.65rem] opacity-55">{ago(m.created)}</span></p></motion.div>))}</AnimatePresence><div ref={end} /></div>
            <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!t.trim()) return; await act({ action: "chatReply", userId: uid, text: t }); setT(""); }}><input className={field} aria-label="Reply" placeholder="Reply as the reader…" value={t} onChange={(e) => setT(e.target.value)} /><Btn v="primary" aria-label="Send">Send</Btn></form></>)}
        </Card></div>
    </div>
  );
}

// ───────── Community ─────────
export function CommunityPage() {
  const { d, act } = useAdmin(); const { confirm } = useUi(); const [tab, setTab] = useState("posts");
  const pending = (a: any[]) => a.filter((x) => !x.approved).length;
  return (
    <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl">Community moderation</h1>
      <Segmented label="community" value={tab} onChange={setTab} options={[{ v: "posts", label: `Posts ${pending(d.threads) || ""}` }, { v: "replies", label: `Replies ${pending(d.replies) || ""}` }]} /></div>
      <div className="grid gap-3 lg:grid-cols-2"><AnimatePresence mode="popLayout">{(tab === "posts" ? d.threads : d.replies).map((x: any) => (
        <motion.div key={tab + x.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`rounded-2xl border bg-[#120c20] p-5 ${x.approved ? "border-white/[.07]" : "border-amber-300/25"}`}>
          <div className="flex items-center justify-between"><Badge tone={x.approved ? "green" : "amber"}>{x.approved ? "live" : "awaiting review"}</Badge><span className="text-xs text-ivory/35">{ago(x.created)}</span></div>
          {x.title && <h3 className="mt-2 font-display text-xl">{x.title}</h3>}{x.thread && <p className="mt-2 text-xs text-violet-300">on “{x.thread}”</p>}<p className="mt-2 whitespace-pre-line text-sm text-ivory/80">{x.body}</p><p className="mt-2 text-xs text-ivory/40">by {x.name}</p>
          <div className="mt-4 flex gap-2"><Btn size="sm" v={x.approved ? "ghost" : "primary"} icon={x.approved ? "close" : "check"} onClick={() => act({ action: tab === "posts" ? "approveThread" : "approveReply", id: x.id, approved: !x.approved }, x.approved ? "Hidden" : "Approved")}>{x.approved ? "Hide" : "Approve"}</Btn>
            <Btn size="sm" v="danger" icon="trash" onClick={async () => (await confirm({ title: "Delete permanently?", danger: true, yes: "Delete" })) && act({ action: tab === "posts" ? "deleteThread" : "deleteReply", id: x.id }, "Deleted")} /></div></motion.div>))}</AnimatePresence></div>
      {!(tab === "posts" ? d.threads : d.replies).length && <Empty icon="community" title="Nothing to moderate" hint="Posts and replies from members appear here for review." />}
    </div>
  );
}

// ───────── Readers ─────────
export function ReadersPage() {
  const { d, act } = useAdmin(); const { confirm } = useUi();
  return (
    <div className="space-y-6"><h1 className="font-display text-3xl">Reader marketplace</h1><p className="-mt-3 text-sm text-ivory/50">Readers are listed publicly only after you verify them.</p>
      <div className="grid gap-4 md:grid-cols-2">{d.readers.map((r: any, i: number) => (
        <motion.div key={r.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-2xl border bg-[#120c20] p-5 ${r.verified ? "border-white/[.07]" : "border-amber-300/25"}`}>
          <div className="flex items-center gap-3"><Avatar name={r.name} size="h-12 w-12" /><div className="min-w-0 flex-1"><p className="font-display text-xl">{r.name}</p><p className="truncate text-xs text-ivory/45">{r.specialties || "—"}</p></div><Badge tone={r.verified ? "green" : "amber"}>{r.main ? "host" : r.verified ? "verified" : "pending"}</Badge></div>
          <p className="mt-3 text-sm text-ivory/70">{r.bio || "No bio provided."}</p><p className="mt-2 text-xs text-ivory/40">WhatsApp {r.whatsapp}{r.email ? ` · ${r.email}` : ""}</p>
          {!r.main && <div className="mt-4 flex gap-2"><Btn size="sm" v={r.verified ? "ghost" : "primary"} icon={r.verified ? "close" : "shield"} onClick={() => act({ action: "readerVerify", id: r.id, verified: !r.verified }, r.verified ? "Unverified" : "Verified and listed")}>{r.verified ? "Unverify" : "Verify & list"}</Btn><a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer"><Btn size="sm" icon="whatsapp">Contact</Btn></a>
            <Btn size="sm" v="danger" icon="trash" onClick={async () => (await confirm({ title: `Remove ${r.name}?`, danger: true, yes: "Remove" })) && act({ action: "readerDelete", id: r.id }, "Removed")} /></div>}
        </motion.div>))}</div></div>
  );
}

// ───────── Readings ─────────
export function ReadingsPage() {
  const { d, act, openClient } = useAdmin(); const { confirm } = useUi();
  const cols: Col<any>[] = [
    { key: "d", label: "When", sort: (r) => r.created, render: (r) => <span className="text-ivory/70">{fdate(r.created)}</span> },
    { key: "c", label: "Client", sort: (r) => r.name, render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size="h-7 w-7" />{r.name}</span> },
    { key: "s", label: "Spread", render: (r) => <span className="capitalize">{r.spread} · <span className="text-ivory/50">{r.category}</span></span> },
    { key: "q", label: "Question", render: (r) => <span className="text-ivory/70">{r.question || "—"}</span> },
    { key: "k", label: "Cards", render: (r) => <span className="text-xs text-ivory/60">{(JSON.parse(r.cards) as any[]).map((c) => `${MAJOR_ARCANA[c.id]?.name}${c.reversed ? " ↺" : ""}`).join(", ")}</span> },
    { key: "x", label: "", render: (r) => <Btn size="sm" v="danger" icon="trash" aria-label="Delete reading" onClick={async (e) => { e.stopPropagation(); if (await confirm({ title: "Delete this reading?", danger: true, yes: "Delete" })) act({ action: "deleteReading", id: r.id }, "Deleted"); }} /> },
  ];
  return (<div className="space-y-6"><div className="flex items-center justify-between"><h1 className="font-display text-3xl">Saved readings</h1><a href="/api/admin?export=readings"><Btn icon="download">Export CSV</Btn></a></div>
    <Card><DataTable rows={d.readings} cols={cols} rowKey={(r) => r.id} search={(r) => `${r.name} ${r.question} ${r.category}`} searchPlaceholder="Search readings…" onRow={(r) => { const c = d.customers.find((x: any) => x.email === r.email); if (c) openClient(c.id); }} empty={<Empty icon="readings" title="No saved readings" hint="Signed-in clients can save readings (with consent). They appear here." />} /></Card></div>);
}

// ───────── Reports ─────────
export function ReportsPage() {
  const { d } = useAdmin(); const [range, setRange] = useState("90"); const [nowTs] = useState(() => Date.now());
  const since = range === "all" ? 0 : nowTs - Number(range) * 864e5;
  const pays = d.payments.filter((p: any) => p.status === "paid" && p.created >= since);
  const bks = d.bookings.filter((b: any) => new Date(b.created).getTime() >= since);
  const revenue = pays.reduce((a: number, p: any) => a + p.amount, 0);
  const byService = Object.entries(pays.reduce((m: any, p: any) => ((m[p.label] = (m[p.label] || 0) + p.amount), m), {})).map(([label, value]) => ({ label, value: value as number })).sort((a, b) => b.value - a.value).slice(0, 7);
  const kinds = ["reading", "video", "voice"].map((k, i) => ({ label: k, value: bks.filter((b: any) => b.kind === k).length, color: ["#8b5cf6", "#ec4899", "#14b8a6"][i] }));
  const done = bks.filter((b: any) => ["confirmed", "completed"].includes(b.status)).length;
  const spenders = Object.entries(d.payments.filter((p: any) => p.status === "paid" && p.user_id).reduce((m: any, p: any) => ((m[p.user_id] = (m[p.user_id] || 0) + p.amount), m), {})).map(([id, v]) => ({ c: d.customers.find((c: any) => c.id === Number(id)), v: v as number })).filter((x) => x.c).sort((a, b) => b.v - a.v).slice(0, 5);
  const months = d.monthly.map((m: any) => ({ ...m, clients: d.customers.filter((c: any) => new Date(c.created).toISOString().startsWith(m.month)).length }));
  return (
    <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl">Reports</h1><Segmented label="range" value={range} onChange={setRange} options={[{ v: "30", label: "30 days" }, { v: "90", label: "90 days" }, { v: "365", label: "1 year" }, { v: "all", label: "All time" }]} /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue" value={revenue} format={inr} icon="payments" tone="gold" /><Stat label="Bookings" value={bks.length} icon="bookings" delay={0.07} />
        <Stat label="Avg. booking value" value={pays.length ? revenue / pays.length : 0} format={inr} icon="reports" tone="pink" delay={0.14} /><Stat label="Confirmation rate" value={bks.length ? (done / bks.length) * 100 : 0} format={(n) => Math.round(n) + "%"} icon="check" tone="teal" delay={0.21} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Revenue, last 12 months"><AreaChart data={d.monthly.map((m: any) => m.revenue)} labels={d.monthly.map((m: any) => m.month.slice(5))} fmt={inr} /></Card>
        <Card title="Bookings, last 12 months"><BarChart data={d.monthly.map((m: any) => m.bookings)} labels={d.monthly.map((m: any) => m.month.slice(5))} color="pink" /></Card>
        <Card title="Revenue by service">{byService.length ? <HBars items={byService} fmt={inr} /> : <Empty icon="reports" title="No paid revenue in this range" />}</Card>
        <Card title="Session types"><Donut parts={kinds} />{!bks.length && <p className="mt-3 text-sm text-ivory/45">No bookings in this range.</p>}</Card>
        <Card title="New clients per month"><BarChart data={months.map((m: any) => m.clients)} labels={months.map((m: any) => m.month.slice(5))} color="teal" /></Card>
        <Card title="Top clients by spend">{spenders.length ? <ul className="space-y-3">{spenders.map((s, i) => <motion.li key={s.c.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex items-center gap-3"><Avatar name={s.c.name} /><span className="flex-1 text-sm">{s.c.name}</span><b className="font-display text-lg text-champagne">{inr(s.v)}</b></motion.li>)}</ul> : <Empty icon="clients" title="No paying clients yet" />}</Card>
        <Card title="Coupon usage" className="lg:col-span-2">{d.coupons.length ? <div className="grid gap-3 sm:grid-cols-3">{d.coupons.map((c: any) => <div key={c.code} className="rounded-xl bg-white/[.04] p-4"><p className="tracking-widest text-amber-200">{c.code}</p><p className="font-display text-3xl">{c.uses}<span className="text-sm text-ivory/40"> uses</span></p></div>)}</div> : <p className="text-sm text-ivory/40">No coupons created.</p>}</Card>
      </div></div>
  );
}

// ───────── Settings ─────────
export function SettingsPage() {
  const { d, act } = useAdmin(); const { confirm, toast } = useUi();
  const [pw, setPw] = useState({ current: "", next: "", again: "" }); const [wipe, setWipe] = useState("");
  const SC = [["G then D", "Dashboard"], ["G then B", "Bookings"], ["⌘/Ctrl K", "Search & jump anywhere"], ["Esc", "Close any panel"], ["[", "Collapse sidebar"]];
  return (
    <div className="space-y-6"><h1 className="font-display text-3xl">Settings</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Change admin password">
          <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); if (pw.next !== pw.again) return toast("New passwords don't match", "err"); const r = await act({ action: "changePassword", current: pw.current, next: pw.next }, "Password changed"); if (r?.ok) setPw({ current: "", next: "", again: "" }); }}>
            <label className="block"><Label>Current password</Label><input type="password" className={field} required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
            <label className="block"><Label>New password (8+ characters)</Label><input type="password" className={field} required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
            <label className="block"><Label>Repeat new password</Label><input type="password" className={field} required autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} /></label><Btn v="primary" icon="shield">Update password</Btn></form></Card>
        <BusinessCard /><BackupsCard /><TrashCard />
        <Card title="Backup & export"><p className="mb-4 text-sm text-ivory/55">Download everything as a JSON backup (client passwords are never included), or export individual lists to Excel-friendly CSV.</p>
          <div className="flex flex-wrap gap-2"><a href="/api/admin?backup=1"><Btn v="primary" icon="download">Full backup (JSON)</Btn></a>{["bookings", "payments", "customers", "readings"].map((x) => <a key={x} href={`/api/admin?export=${x}`}><Btn icon="download" className="capitalize">{x}</Btn></a>)}</div></Card>
        <Card title="Keyboard shortcuts"><ul className="space-y-2 text-sm">{SC.map(([k, v]) => <li key={k} className="flex items-center justify-between"><span className="text-ivory/70">{v}</span><kbd className="rounded-lg border border-white/15 bg-white/[.06] px-2.5 py-1 text-xs">{k}</kbd></li>)}</ul></Card>
        <Card title="Activity log">{d.activity.length ? <ul className="max-h-64 space-y-2.5 overflow-y-auto pr-1">{d.activity.map((x: any) => <li key={x.id} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400" /><span className="flex-1 text-ivory/80">{x.text}</span><span className="shrink-0 text-xs text-ivory/35">{ago(x.created)}</span></li>)}</ul> : <p className="text-sm text-ivory/40">No admin activity yet.</p>}</Card>
        <Card title={<span className="text-red-300">Danger zone</span>} className="border-red-400/20 lg:col-span-2">
          <p className="mb-3 text-sm text-ivory/55">Clears all bookings, payments, clients, readings, reviews, posts, messages and community content. Services, slots, coupons and the host reader are kept. Use this before launch to remove test data. <b>Download a backup first.</b></p>
          <div className="flex flex-wrap items-center gap-2"><input className={`${field} !w-auto`} placeholder="Type DELETE" aria-label="Type DELETE to confirm" value={wipe} onChange={(e) => setWipe(e.target.value)} />
            <Btn v="danger" icon="trash" disabled={wipe !== "DELETE"} onClick={async () => { if (await confirm({ title: "Erase all customer data?", body: "This cannot be undone.", danger: true, yes: "Erase everything" })) { await act({ action: "resetData", confirm: wipe }, "All data cleared"); setWipe(""); } }}>Erase all data</Btn></div></Card>
      </div></div>
  );
}
void Icon;
