/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Badge, Btn, Card, DataTable, Empty, Icon, Label, Modal, Segmented, SlideOver, Stat, STATUS_TONE, Switch, ago, fdate, field, fshort, inr, panel, useUi, waNumber, type Col } from "./ui";
import { AreaChart, Donut } from "./charts";
import { useAdmin } from "./ctx";
import { ImportClientsButton, RemindersButton, ResetLinkModal, ResetRequests, SummaryEditor, WaitlistCard, printDaySheet } from "./pages5";

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "rejected"];

// ───────── Dashboard ─────────
export function Dashboard() {
  const { d, go, openBooking } = useAdmin();
  const [range, setRange] = useState<"week" | "year">("week");
  const hour = new Date().getHours(); const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todays = d.bookings.filter((b: any) => b.date === d.today && ["pending", "confirmed"].includes(b.status));
  const upcoming = d.bookings.filter((b: any) => b.date > d.today && ["pending", "confirmed"].includes(b.status)).sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
  const a = d.alerts; const needs = [
    { n: a.bookings, label: "bookings awaiting confirmation", to: "bookings", icon: "bookings" }, { n: a.payments, label: "pending payments", to: "payments", icon: "payments" },
    { n: a.chat, label: "chats waiting for a reply", to: "chat", icon: "chat" }, { n: a.reviews, label: "reviews to approve", to: "reviews", icon: "star" },
    { n: a.community, label: "community posts to review", to: "community", icon: "community" }, { n: a.readers, label: "reader applications", to: "readers", icon: "readers" },
    { n: a.resets, label: "password reset requests", to: "clients", icon: "shield" }, { n: a.waitlist, label: "people on the waitlist", to: "calendar", icon: "calendar" }, { n: a.errors, label: "site errors in the last 24h", to: "analytics", icon: "alert" },
  ].filter((x) => x.n > 0);
  const status = STATUSES.map((s, i) => ({ label: s, value: d.bookings.filter((b: any) => b.status === s).length, color: ["#f59e0b", "#10b981", "#8b5cf6", "#64748b", "#ef4444"][i] }));
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}><h1 className="font-display text-3xl sm:text-4xl">{greet} <span className="gold-text italic">✦</span></h1><p className="mt-1 text-sm text-ivory/55">Here&apos;s what&apos;s happening with Spill the Cards today.</p></motion.div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total bookings" value={d.stats.bookings} icon="bookings" sub={`${d.stats.pending} pending`} delay={0} spark={d.weekly.map((w: any) => w.bookings)} />
        <Stat label="Upcoming" value={d.stats.upcoming} icon="calendar" tone="pink" sub="confirmed or pending" delay={0.07} />
        <Stat label="Revenue this month" value={d.stats.revenueMonth} format={inr} icon="payments" tone="gold" sub={`${inr(d.stats.revenueYear)} this year`} delay={0.14} spark={d.weekly.map((w: any) => w.revenue)} />
        <Stat label="Clients" value={d.stats.customers} icon="clients" tone="teal" sub="registered accounts" delay={0.21} />
      </div>

      <AnimatePresence>{needs.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
          <Card title={<span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />Needs your attention</span>}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {needs.map((n, i) => (
                <motion.button key={n.to} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ x: 4 }} onClick={() => go(n.to as any)} className="flex items-center gap-3 rounded-xl bg-white/[.04] p-3 text-left transition hover:bg-white/[.08]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300"><Icon n={n.icon} /></span>
                  <span className="text-sm"><b className="font-display text-xl text-ivory">{n.n}</b> <span className="text-ivory/60">{n.label}</span></span><Icon n="chevron" className="ml-auto h-4 w-4 text-ivory/30" />
                </motion.button>))}
            </div></Card></motion.div>)}</AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card title="Revenue" delay={0.1} action={<Segmented label="range" value={range} onChange={setRange} options={[{ v: "week", label: "7 days" }, { v: "year", label: "12 months" }]} />} className="bg-gradient-to-br from-[#1c1038] to-[#120c20]">
          <AreaChart key={range} data={(range === "week" ? d.weekly : d.monthly).map((w: any) => w.revenue)} labels={(range === "week" ? d.weekly.map((w: any) => fshort(w.day).split(",")[0]) : d.monthly.map((m: any) => m.month.slice(5)))} fmt={inr} />
        </Card>
        <Card title="Bookings by status" delay={0.15}><Donut parts={status} />{!d.bookings.length && <p className="mt-3 text-sm text-ivory/45">No bookings yet.</p>}</Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Today" delay={0.1}>{todays.length ? <ul className="space-y-2">{todays.map((b: any) => <Row key={b.id} b={b} open={() => openBooking(b.id)} />)}</ul> : <Empty icon="sun" title="Clear day" hint="Nothing scheduled for today." />}</Card>
        <Card title="Upcoming" delay={0.15}>{upcoming.length ? <ul className="space-y-2">{upcoming.map((b: any) => <Row key={b.id} b={b} open={() => openBooking(b.id)} showDate />)}</ul> : <Empty icon="calendar" title="No upcoming sessions" />}</Card>
        <Card title="Recent activity" delay={0.2}>{d.activity.length ? <ul className="space-y-3">{d.activity.slice(0, 7).map((x: any, i: number) => (
          <motion.li key={x.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400" /><span className="flex-1 text-ivory/80">{x.text}</span><span className="shrink-0 text-xs text-ivory/35">{ago(x.created)}</span></motion.li>))}</ul> : <Empty icon="sparkle" title="No activity yet" hint="Actions you take here are logged." />}</Card>
      </div>
    </div>
  );
}
function Row({ b, open, showDate }: { b: any; open: () => void; showDate?: boolean }) {
  return (
    <motion.li whileHover={{ x: 3 }}><button onClick={open} className="flex w-full items-center gap-3 rounded-xl bg-white/[.04] p-3 text-left transition hover:bg-white/[.08]"><Avatar name={b.name} />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm text-ivory">{b.name}</span><span className="block truncate text-xs text-ivory/50">{b.service_name}</span></span>
      <span className="text-right"><span className="block text-xs text-ivory/70">{showDate ? fshort(b.date) : ""} {b.time}</span><Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge></span></button></motion.li>
  );
}

// ───────── Calendar ─────────
export function CalendarPage() {
  const { d, openBooking } = useAdmin();
  const [m, setM] = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [sel, setSel] = useState(d.today);
  const first = (m.getDay() + 6) % 7; const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const iso = (n: number) => `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
  const byDay = useMemo(() => { const x: Record<string, any[]> = {}; d.bookings.filter((b: any) => !["cancelled", "rejected"].includes(b.status)).forEach((b: any) => (x[b.date] ||= []).push(b)); return x; }, [d.bookings]);
  const blocked = new Set(d.blocked.filter((b: any) => !b.time).map((b: any) => b.date));
  const list = (byDay[sel] || []).sort((a: any, b: any) => a.time.localeCompare(b.time));
  return (
    <div className="space-y-6"><h1 className="font-display text-3xl">Calendar</h1>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between"><Btn size="sm" aria-label="Previous month" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))}><Icon n="chevron" className="h-4 w-4 rotate-180" /></Btn>
            <AnimatePresence mode="wait"><motion.h2 key={m.toISOString()} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="font-display text-2xl">{m.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</motion.h2></AnimatePresence>
            <Btn size="sm" aria-label="Next month" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))}><Icon n="chevron" className="h-4 w-4" /></Btn></div>
          <div className="grid grid-cols-7 gap-1 text-center text-[.65rem] uppercase tracking-[.15em] text-ivory/40">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => <div key={w} className="py-2">{w}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: first }).map((_, i) => <div key={"e" + i} />)}
            {Array.from({ length: days }).map((_, i) => { const k = iso(i + 1), n = byDay[k]?.length || 0; const on = sel === k, today = d.today === k;
              return (<motion.button key={k} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} onClick={() => setSel(k)} aria-label={`${k}, ${n} bookings`} aria-pressed={on}
                className={`relative aspect-square rounded-xl p-1 text-sm transition ${on ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-[0_6px_20px_rgba(168,85,247,.4)]" : blocked.has(k) ? "bg-red-500/10 text-ivory/40" : "bg-white/[.04] text-ivory/80 hover:bg-white/[.09]"} ${today && !on ? "ring-1 ring-fuchsia-400/60" : ""}`}>
                {i + 1}{n > 0 && <span className={`absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5`}>{Array.from({ length: Math.min(n, 3) }).map((_, j) => <span key={j} className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-fuchsia-400"}`} />)}</span>}
                {blocked.has(k) && <span className="absolute right-1 top-1 text-[.55rem] text-red-300">off</span>}</motion.button>); })}
          </div>
        </Card>
        <Card title={fshort(sel)} className="h-fit" action={<Btn size="sm" icon="readings" onClick={() => printDaySheet(`Day sheet · ${fshort(sel)}`, list)}>Print day sheet</Btn>}>
          <AnimatePresence mode="wait"><motion.div key={sel} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            {list.length ? <ul className="space-y-2">{list.map((b: any) => <Row key={b.id} b={b} open={() => openBooking(b.id)} />)}</ul> : <Empty icon="calendar" title="No sessions" hint={blocked.has(sel) ? "This day is blocked." : "Nothing booked for this day."} />}</motion.div></AnimatePresence>
        </Card>
      </div>
      <WaitlistCard />
    </div>
  );
}

// ───────── Bookings ─────────
export function BookingsPage() {
  const { d, act, openBooking } = useAdmin(); const { confirm } = useUi();
  const [tab, setTab] = useState("all"); const [when, setWhen] = useState("all"); const [sel, setSel] = useState<Set<any>>(new Set());
  const counts: Record<string, number> = { all: d.bookings.length }; STATUSES.forEach((s) => (counts[s] = d.bookings.filter((b: any) => b.status === s).length));
  const rows = d.bookings.filter((b: any) => (tab === "all" || b.status === tab) && (when === "all" || (when === "today" ? b.date === d.today : when === "upcoming" ? b.date >= d.today : b.date < d.today)));
  const cols: Col<any>[] = [
    { key: "c", label: "Client", sort: (b) => b.name, render: (b) => <div className="flex items-center gap-3"><Avatar name={b.name} /><div><p className="text-ivory">{b.name}</p><p className="text-xs text-ivory/45">{b.code}</p></div></div> },
    { key: "s", label: "Service", sort: (b) => b.service_name, render: (b) => <div><p className="text-ivory/90">{b.service_name}</p><p className="text-xs text-ivory/45">{inr(b.price - b.discount)}{b.kind !== "reading" && ` · ${b.kind}`}</p></div> },
    { key: "w", label: "When", sort: (b) => b.date + b.time, render: (b) => <div><p>{fshort(b.date)}</p><p className="text-xs text-ivory/45">{b.time}</p></div> },
    { key: "st", label: "Status", sort: (b) => b.status, render: (b) => <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge> },
    { key: "a", label: "", className: "w-12 text-right", render: () => <Icon n="chevron" className="h-4 w-4 text-ivory/30" /> },
  ];
  async function bulk(status: string) {
    if (!(await confirm({ title: `Mark ${sel.size} booking(s) ${status}?`, yes: "Apply", danger: status === "cancelled" || status === "rejected" }))) return;
    await act({ action: "bulkStatus", ids: [...sel], status }, `${sel.size} booking(s) ${status}`); setSel(new Set());
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl">Bookings</h1><div className="flex flex-wrap gap-2"><RemindersButton /><a href="/api/admin?export=bookings"><Btn icon="download">Export CSV</Btn></a></div></div>
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Segmented label="status" value={tab} onChange={setTab} options={[{ v: "all", label: `All ${counts.all}` }, ...STATUSES.map((s) => ({ v: s, label: <span className="capitalize">{s} {counts[s]}</span> }))]} />
          <Segmented label="when" value={when} onChange={setWhen} options={[{ v: "all", label: "Any time" }, { v: "today", label: "Today" }, { v: "upcoming", label: "Upcoming" }, { v: "past", label: "Past" }]} />
        </div>
        <AnimatePresence>{sel.size > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden"><div className="flex flex-wrap items-center gap-2 rounded-xl bg-violet-500/15 p-3 text-sm"><b>{sel.size} selected</b>
            <Btn size="sm" v="primary" onClick={() => bulk("confirmed")}>Confirm</Btn><Btn size="sm" onClick={() => bulk("completed")}>Complete</Btn><Btn size="sm" v="danger" onClick={() => bulk("cancelled")}>Cancel</Btn><Btn size="sm" v="soft" onClick={() => setSel(new Set())}>Clear</Btn></div></motion.div>)}</AnimatePresence>
        <DataTable rows={rows} cols={cols} rowKey={(b) => b.id} search={(b) => `${b.name} ${b.code} ${b.service_name} ${b.phone || ""}`} searchPlaceholder="Search name, code, service…" selectable selected={sel} onSelect={setSel} onRow={(b) => openBooking(b.id)}
          empty={<Empty icon="bookings" title="No bookings match" hint="Try a different filter, or wait for new requests." />} />
      </Card>
    </div>
  );
}

export function BookingDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { d, act, openClient } = useAdmin();
  const b = d.bookings.find((x: any) => x.id === id);
  const [note, setNote] = useState(""); const [rs, setRs] = useState<{ date: string; time: string } | null>(null);
  const notes = d.notes.filter((n: any) => n.entity === "booking" && n.ref === id);
  const pays = d.payments.filter((p: any) => p.booking_id === id);
  const wa = (text: string) => `https://wa.me/${waNumber(b?.phone)}?text=${encodeURIComponent(text)}`;
  const link = b?.meeting_link ? ` Join here: ${b.meeting_link}` : "";
  const T = b ? [
    ["Confirm", `Hi ${b.name}, your ${b.service_name} on ${fshort(b.date)} at ${b.time} is confirmed ✦.${link} Ref ${b.code}.`],
    ["Reminder", `Hi ${b.name}, a gentle reminder of your ${b.service_name} ${b.date === d.today ? "today" : "on " + fshort(b.date)} at ${b.time}.${link}`],
    ["Reschedule", `Hi ${b.name}, could we move your ${b.service_name} (${fshort(b.date)} ${b.time}) to another time? Please share what suits you.`],
    ["Payment", `Hi ${b.name}, the amount for your ${b.service_name} is ${inr(b.price - b.discount)}. You can pay by UPI and share the screenshot here. Thank you!`],
    ["Thank you", `Thank you ${b.name} 🌙 It was lovely reading for you. If you'd like, share a short review on the website.`],
  ] : [];
  return (
    <SlideOver open={!!b} onClose={onClose} title={b?.name || ""} subtitle={b && <span className="flex flex-wrap items-center gap-2"><Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>Ref {b.code}</span>}>
      {b && (<>
        <div className="grid gap-3 sm:grid-cols-2">
          {[["Service", b.service_name], ["Amount", `${inr(b.price - b.discount)}${b.coupon ? ` (${b.coupon})` : ""}${b.used_credit ? " (credit)" : ""}`], ["Date", fdate(b.date)], ["Time", b.time], ["Phone", b.phone || "—"], ["Type", b.kind]].map(([k, v]) => <div key={k} className="rounded-xl bg-white/[.04] p-3"><Label>{k}</Label><p className="text-sm capitalize text-ivory">{v}</p></div>)}
        </div>
        {b.note && <div className="rounded-xl border border-white/10 p-3 text-sm text-ivory/80"><Label>Client note</Label>{b.note}</div>}
        {b.meeting_link && <a href={b.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-sky-500/10 p-3 text-sm text-sky-200 hover:bg-sky-500/20"><Icon n="video" />Open meeting room<Icon n="external" className="ml-auto h-4 w-4" /></a>}

        <div><Label>Status</Label><div className="flex flex-wrap gap-2">{STATUSES.map((s) => <Btn key={s} size="sm" v={b.status === s ? "primary" : "ghost"} className="capitalize" onClick={() => act({ action: "setStatus", id: b.id, status: s }, `Marked ${s}`)}>{s}</Btn>)}</div></div>

        <div><Label>Message on WhatsApp</Label><div className="flex flex-wrap gap-2">{T.map(([k, t]) => <a key={k} href={wa(t)} target="_blank" rel="noreferrer"><Btn size="sm" icon="whatsapp">{k}</Btn></a>)}</div></div>

        <div><Label>Payment</Label>
          {pays.length ? <ul className="space-y-2">{pays.map((p: any) => <li key={p.id} className="flex items-center justify-between rounded-xl bg-white/[.04] p-3 text-sm"><span>{inr(p.amount)} · {p.method}</span><Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge></li>)}</ul>
            : <Btn icon="check" onClick={() => act({ action: "markPaid", id: b.id, method: "UPI" }, "Payment recorded")}>Mark as paid ({inr(b.price - b.discount)})</Btn>}</div>

        <div><Label>Reschedule</Label>
          {rs ? <div className="flex flex-wrap items-center gap-2"><input type="date" aria-label="New date" className={`${field} !w-auto`} value={rs.date} onChange={(e) => setRs({ ...rs, date: e.target.value })} />
            <select aria-label="New time" className={`${field} !w-auto`} value={rs.time} onChange={(e) => setRs({ ...rs, time: e.target.value })}>{d.slots.map((s: any) => <option key={s.time}>{s.time}</option>)}</select>
            <Btn v="primary" size="sm" onClick={async () => { await act({ action: "reschedule", id: b.id, ...rs }, "Rescheduled"); setRs(null); }}>Save</Btn><Btn size="sm" onClick={() => setRs(null)}>Cancel</Btn></div>
            : <Btn icon="calendar" onClick={() => setRs({ date: b.date, time: b.time })}>Change date or time</Btn>}</div>

        <div><Label>Private notes</Label>
          <div className="space-y-2">{notes.map((n: any) => <div key={n.id} className="group flex items-start gap-2 rounded-xl bg-amber-400/[.07] p-3 text-sm"><span className="flex-1 text-ivory/85">{n.text}<span className="mt-1 block text-xs text-ivory/35">{ago(n.created)}</span></span><button aria-label="Delete note" onClick={() => act({ action: "deleteNote", id: n.id })} className="opacity-0 transition group-hover:opacity-100"><Icon n="trash" className="h-4 w-4 text-red-300" /></button></div>)}</div>
          <form className="mt-2 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await act({ action: "addNote", entity: "booking", ref: b.id, text: note }, "Note added"); setNote(""); }}><input className={field} placeholder="Add a private note (only you see this)…" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} /><Btn v="soft">Add</Btn></form></div>
        <SummaryEditor key={b.id} b={b} />
        {b.user_id && <Btn icon="clients" onClick={() => { onClose(); openClient(b.user_id); }}>View client profile</Btn>}
        {!b.phone && <p className="text-xs text-amber-300">No phone number on file, so WhatsApp links won&apos;t reach the client. Ask them to share it.</p>}
      </>)}
    </SlideOver>
  );
}

// ───────── Payments ─────────
export function PaymentsPage() {
  const { d, act } = useAdmin(); const [tab, setTab] = useState("all"); const [open, setOpen] = useState(false);
  const [n, setN] = useState({ label: "", amount: "", method: "UPI", status: "paid" });
  const sum = (s: string) => d.payments.filter((p: any) => p.status === s).reduce((a: number, p: any) => a + p.amount, 0);
  const rows = d.payments.filter((p: any) => tab === "all" || p.status === tab);
  const cols: Col<any>[] = [
    { key: "d", label: "Date", sort: (p) => p.created, render: (p) => <span className="text-ivory/80">{fdate(p.created)}</span> },
    { key: "f", label: "For", sort: (p) => p.label, render: (p) => <div><p className="text-ivory">{p.label}</p>{p.sessions ? <p className="text-xs text-violet-300">+{p.sessions} credits</p> : null}</div> },
    { key: "c", label: "Client", sort: (p) => p.user_name || "", render: (p) => p.user_name || <span className="text-ivory/35">Guest</span> },
    { key: "a", label: "Amount", sort: (p) => p.amount, render: (p) => <b className="font-display text-lg">{inr(p.amount)}</b> },
    { key: "m", label: "Method", render: (p) => <span className="text-ivory/60">{p.method}</span> },
    { key: "s", label: "Status", render: (p) => <select aria-label="Payment status" value={p.status} onChange={(e) => act({ action: "setPayment", id: p.id, status: e.target.value }, `Payment ${e.target.value}`)} className={`${field} !w-auto !py-1.5`}>{["paid", "pending", "failed", "refunded"].map((s) => <option key={s}>{s}</option>)}</select> },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl">Payments</h1><div className="flex gap-2"><a href="/api/admin?export=payments"><Btn icon="download">Export</Btn></a><Btn v="primary" icon="plus" onClick={() => setOpen(true)}>Record payment</Btn></div></div>
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Received" value={sum("paid")} format={inr} icon="check" tone="teal" /><Stat label="Pending" value={sum("pending")} format={inr} icon="clock" tone="gold" delay={0.07} sub={`${d.payments.filter((p: any) => p.status === "pending").length} payment(s)`} /><Stat label="Failed / refunded" value={sum("failed") + sum("refunded")} format={inr} icon="alert" tone="pink" delay={0.14} /></div>
      <Card><DataTable rows={rows} cols={cols} rowKey={(p) => p.id} search={(p) => `${p.label} ${p.user_name || ""} ${p.method}`} searchPlaceholder="Search payments…"
        toolbar={<Segmented label="pstatus" value={tab} onChange={setTab} options={[{ v: "all", label: "All" }, { v: "paid", label: "Paid" }, { v: "pending", label: "Pending" }, { v: "failed", label: "Failed" }, { v: "refunded", label: "Refunded" }]} />}
        empty={<Empty icon="payments" title="No payments yet" hint="Package orders appear as pending. Mark them paid once you receive the money and credits are added automatically." />} /></Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Record a payment">
        <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (!n.amount) return; await act({ action: "addPayment", ...n }, "Payment recorded"); setOpen(false); setN({ label: "", amount: "", method: "UPI", status: "paid" }); }}>
          <label className="block"><Label>Description</Label><input className={field} value={n.label} onChange={(e) => setN({ ...n, label: e.target.value })} placeholder="e.g. Love reading, walk-in" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block"><Label>Amount (₹)</Label><input className={field} inputMode="numeric" required value={n.amount} onChange={(e) => setN({ ...n, amount: e.target.value })} /></label><label className="block"><Label>Method</Label><select className={field} value={n.method} onChange={(e) => setN({ ...n, method: e.target.value })}>{["UPI", "Cash", "Bank", "Other"].map((m) => <option key={m}>{m}</option>)}</select></label></div>
          <label className="block"><Label>Status</Label><select className={field} value={n.status} onChange={(e) => setN({ ...n, status: e.target.value })}>{["paid", "pending", "failed", "refunded"].map((m) => <option key={m}>{m}</option>)}</select></label>
          <Btn v="primary" className="w-full">Save payment</Btn></form></Modal>
    </div>
  );
}

// ───────── Clients ─────────
export function ClientsPage() {
  const { d, openClient } = useAdmin();
  const spent = (id: number) => d.payments.filter((p: any) => p.user_id === id && p.status === "paid").reduce((a: number, p: any) => a + p.amount, 0);
  const cols: Col<any>[] = [
    { key: "n", label: "Client", sort: (c) => c.name, render: (c) => <div className="flex items-center gap-3"><Avatar name={c.name} /><div><p className="text-ivory">{c.name} {c.premium ? <span className="ml-1 text-amber-300">★</span> : null}</p><p className="text-xs text-ivory/45">{c.email}</p></div></div> },
    { key: "p", label: "Phone", render: (c) => <span className="text-ivory/70">{c.phone || "—"}</span> },
    { key: "b", label: "Bookings", sort: (c) => c.bookings, render: (c) => c.bookings },
    { key: "s", label: "Spent", sort: (c) => spent(c.id), render: (c) => inr(spent(c.id)) },
    { key: "cr", label: "Credits", sort: (c) => c.credits, render: (c) => c.credits ? <Badge tone="violet">{c.credits}</Badge> : <span className="text-ivory/30">0</span> },
    { key: "j", label: "Joined", sort: (c) => c.created, render: (c) => <span className="text-ivory/55">{fdate(c.created)}</span> },
  ];
  return (
    <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="font-display text-3xl">Clients</h1><div className="flex flex-wrap gap-2"><ImportClientsButton /><a href="/api/admin?export=customers"><Btn icon="download">Export CSV</Btn></a></div></div>
      <ResetRequests />
      <Card><DataTable rows={d.customers} cols={cols} rowKey={(c) => c.id} search={(c) => `${c.name} ${c.email} ${c.phone || ""}`} searchPlaceholder="Search clients…" onRow={(c) => openClient(c.id)} empty={<Empty icon="clients" title="No clients yet" hint="Guests can book without an account. Registered clients appear here." />} /></Card></div>
  );
}

export function ClientDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { d, act, openBooking, go } = useAdmin(); const [note, setNote] = useState(""); const [reset, setReset] = useState<number | null>(null);
  const c = d.customers.find((x: any) => x.id === id);
  const bks = d.bookings.filter((b: any) => b.user_id === id); const reads = d.readings.filter((r: any) => r.email === c?.email);
  const spent = d.payments.filter((p: any) => p.user_id === id && p.status === "paid").reduce((a: number, p: any) => a + p.amount, 0);
  const notes = d.notes.filter((n: any) => n.entity === "client" && n.ref === id);
  return (
    <>
    <SlideOver open={!!c} onClose={onClose} title={c?.name || ""} subtitle={c && <span>{c.email}{c.phone ? ` · ${c.phone}` : ""}</span>}>
      {c && (<>
        <div className="grid grid-cols-3 gap-3 text-center">{[["Bookings", bks.length], ["Readings", reads.length], ["Spent", inr(spent)]].map(([k, v]) => <div key={String(k)} className="rounded-xl bg-white/[.04] p-3"><p className="font-display text-2xl">{v}</p><Label>{k}</Label></div>)}</div>
        <div className="flex items-center justify-between rounded-xl bg-white/[.04] p-4"><div><p className="text-ivory">Premium member</p><p className="text-xs text-ivory/45">Unlocks priority slots</p></div><Switch label="Premium" checked={!!c.premium} onChange={(v) => act({ action: "userSet", id: c.id, premium: v, credits: c.credits }, v ? "Premium on" : "Premium off")} /></div>
        <div className="flex items-center justify-between rounded-xl bg-white/[.04] p-4"><div><p className="text-ivory">Package credits</p><p className="text-xs text-ivory/45">Free sessions available</p></div>
          <div className="flex items-center gap-3"><Btn size="sm" aria-label="Remove credit" disabled={c.credits < 1} onClick={() => act({ action: "userSet", id: c.id, premium: !!c.premium, credits: c.credits - 1 })}>−</Btn><b className="w-6 text-center font-display text-2xl">{c.credits}</b><Btn size="sm" aria-label="Add credit" onClick={() => act({ action: "userSet", id: c.id, premium: !!c.premium, credits: c.credits + 1 }, "Credit added")}>+</Btn></div></div>
        <div className="flex flex-wrap gap-2">{c.phone && <a href={`https://wa.me/${waNumber(c.phone)}`} target="_blank" rel="noreferrer"><Btn icon="whatsapp">WhatsApp</Btn></a>}<Btn icon="chat" onClick={() => { onClose(); go("chat"); }}>Open chat</Btn><Btn icon="shield" onClick={() => setReset(c.id)}>Password reset link</Btn></div>
        <div><Label>Bookings</Label>{bks.length ? <ul className="space-y-2">{bks.slice(0, 8).map((b: any) => <li key={b.id}><button onClick={() => { onClose(); setTimeout(() => openBooking(b.id), 200); }} className="flex w-full items-center justify-between rounded-xl bg-white/[.04] p-3 text-left text-sm hover:bg-white/[.08]"><span>{b.service_name}<span className="block text-xs text-ivory/45">{fshort(b.date)} · {b.time}</span></span><Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge></button></li>)}</ul> : <p className="text-sm text-ivory/40">No bookings yet.</p>}</div>
        <div><Label>Private notes</Label><div className="space-y-2">{notes.map((n: any) => <div key={n.id} className="flex items-start gap-2 rounded-xl bg-amber-400/[.07] p-3 text-sm"><span className="flex-1">{n.text}</span><button aria-label="Delete note" onClick={() => act({ action: "deleteNote", id: n.id })}><Icon n="trash" className="h-4 w-4 text-red-300" /></button></div>)}</div>
          <form className="mt-2 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await act({ action: "addNote", entity: "client", ref: c.id, text: note }, "Note added"); setNote(""); }}><input className={field} placeholder="Add a note…" aria-label="Client note" value={note} onChange={(e) => setNote(e.target.value)} /><Btn v="soft">Add</Btn></form></div>
      </>)}
    </SlideOver>
    <ResetLinkModal userId={reset} onClose={() => setReset(null)} />
    </>
  );
}
void panel;
