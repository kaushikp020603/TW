/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Badge, Btn, Card, DataTable, Empty, Icon, Label, Modal, Segmented, Stat, ago, fdate, field, fshort, useUi, waNumber, type Col } from "./ui";
import { AreaChart, HBars } from "./charts";
import { useAdmin } from "./ctx";
import { MAJOR_ARCANA } from "@/data/tarot";
import { SITE } from "@/config/site";

const post = (b: object) => fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json());
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const isoDay = (t: number) => new Date(t - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

// ───────── Analytics & health ─────────
export function AnalyticsPage() {
  const { toast } = useUi();
  const [days, setDays] = useState("30"); const [tab, setTab] = useState("traffic"); const [a, setA] = useState<any>(null); const [nowTs] = useState(() => Date.now());
  const [ping, setPing] = useState<string>("");
  const load = useCallback(async () => { setA(await post({ action: "analytics", days: Number(days) })); }, [days]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  const series = useMemo(() => {
    if (!a) return { labels: [] as string[], pv: [] as number[], rd: [] as number[], bk: [] as number[] };
    const n = Number(days), keys = Array.from({ length: n }, (_, i) => isoDay(nowTs - (n - 1 - i) * 864e5));
    const g = (t: string) => keys.map((k) => a.daily.find((x: any) => x.d === k && x.type === t)?.c ?? 0);
    return { labels: keys.map((k) => k.slice(5)), pv: g("pageview"), rd: g("reading_complete"), bk: g("booking_submit") };
  }, [a, days, nowTs]);
  const funnel: [string, number][] = a?.funnel ?? [];
  const top = funnel[0]?.[1] || 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl">Analytics & health</h1><p className="mt-1 text-sm text-ivory/50">Privacy-friendly: no cookies, no IP addresses, no personal data stored.</p></div>
        <div className="flex flex-wrap gap-2"><Segmented label="analytics tab" value={tab} onChange={setTab} options={[{ v: "traffic", label: "Traffic & funnel" }, { v: "health", label: "Health & errors" }]} />
          {tab === "traffic" && <Segmented label="analytics range" value={days} onChange={setDays} options={[{ v: "7", label: "7 days" }, { v: "30", label: "30 days" }, { v: "90", label: "90 days" }]} />}</div></div>
      {!a ? <Empty icon="reports" title="Loading…" /> : tab === "traffic" ? (<>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Unique visitors" value={a.visitors} icon="clients" sub="approximate, per day" />
          <Stat label="Page views" value={a.pageviews} icon="readings" tone="pink" delay={0.07} />
          <Stat label="Readings finished" value={funnel[2]?.[1] ?? 0} icon="cards" tone="gold" delay={0.14} sub={`${a.other.share} shared`} />
          <Stat label="Booking requests" value={funnel[4]?.[1] ?? 0} icon="bookings" tone="teal" delay={0.21} sub={`${a.other.wa_click} WhatsApp clicks`} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card title="Page views"><AreaChart key={days} data={series.pv} labels={series.labels.map((l, i) => (series.labels.length > 14 && i % Math.ceil(series.labels.length / 12) ? "" : l))} /></Card>
          <Card title="Booking funnel" delay={0.05}>
            <ul className="space-y-3">{funnel.map(([label, n], i) => {
              const pct = top ? Math.round((n / top) * 100) : 0; const prev = i ? funnel[i - 1][1] : 0; const step = i && prev ? Math.round((n / prev) * 100) : null;
              return (<li key={label}><div className="mb-1 flex justify-between text-sm"><span className="text-ivory/85">{label}</span><span className="text-ivory/60">{n}{step !== null && <span className="ml-2 text-xs text-violet-300">{step}% of previous</span>}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/[.06]"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.07 }} /></div></li>);
            })}</ul>
            <p className="mt-4 text-xs text-ivory/40">Visitors are counted once per day per browser. Confirmed bookings come from the bookings table.</p></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Top pages">{a.pages.length ? <HBars items={a.pages.map((p: any) => ({ label: p.path || "/", value: p.c }))} /> : <Empty icon="readings" title="No visits yet" hint="Visits appear as people browse the live site." />}</Card>
          <Card title="Where visitors come from">{a.sources.length ? <HBars items={a.sources.map((p: any) => ({ label: p.r, value: p.c }))} /> : <Empty icon="external" title="No data yet" />}</Card>
        </div>
        <Card title="Other activity"><div className="grid gap-3 sm:grid-cols-5">{([["WhatsApp clicks", a.other.wa_click], ["Shares", a.other.share], ["Sign-ups", a.other.signup], ["Weekly-card sign-ups", a.other.subscribe], ["App installs", a.other.install]] as const).map(([k, v]) => <div key={k} className="rounded-xl bg-white/[.04] p-4"><p className="font-display text-3xl">{v}</p><Label>{k}</Label></div>)}</div></Card>
      </>) : (<>
        <Card title="Uptime monitoring">
          <p className="mb-3 text-sm text-ivory/60">Add this address to a free uptime monitor (for example UptimeRobot) to be alerted when the site or database goes down. It returns 200 when everything is fine.</p>
          <div className="flex flex-wrap items-center gap-2"><code className="rounded-lg bg-black/40 px-3 py-2 text-sm text-champagne">{typeof location !== "undefined" ? location.origin : ""}/api/health</code>
            <Btn size="sm" onClick={async () => { await navigator.clipboard?.writeText(`${location.origin}/api/health`).catch(() => {}); toast("Address copied"); }}>Copy</Btn>
            <Btn size="sm" icon="check" onClick={async () => { const t = Date.now(); const r = await fetch("/api/health", { cache: "no-store" }).catch(() => null); setPing(r?.ok ? `Healthy · database ${(await r.json()).ms} ms · round trip ${Date.now() - t} ms` : "Not healthy"); }}>Check now</Btn>{ping && <Badge tone={ping.startsWith("Healthy") ? "green" : "red"}>{ping}</Badge>}</div>
        </Card>
        <Card title={`Recent errors (${a.errors.length})`} action={a.errors.length > 0 && <Btn size="sm" v="danger" icon="trash" onClick={async () => { await post({ action: "clearErrors" }); load(); toast("Errors cleared"); }}>Clear</Btn>}>
          {a.errors.length ? <ul className="space-y-2">{a.errors.map((e: any) => <li key={e.id} className="rounded-xl bg-red-500/[.06] p-3 text-sm"><p className="break-words text-ivory">{e.message}</p><p className="mt-1 text-xs text-ivory/40">{e.path} · {ago(e.ts)} · {String(e.ua).slice(0, 60)}</p></li>)}</ul> : <Empty icon="check" title="No errors recorded" hint="Browser errors on the public site are logged here automatically." />}
        </Card>
      </>)}
    </div>
  );
}

// ───────── Marketing: weekly card + subscribers ─────────
export function MarketingPage() {
  const { d, act } = useAdmin(); const { toast, confirm } = useUi();
  const [nowTs] = useState(() => Date.now());
  const week = Math.floor(nowTs / (7 * 864e5)); const card = MAJOR_ARCANA[(week * 7) % 22];
  const [text, setText] = useState(`✦ Your weekly card from THE ARCANA: ${card.name} (${card.keywords}).\n\n${card.upright}\n\nReflect: where does "${card.keywords.split(" · ")[0]}" show up for you this week?\n\nDraw your own free card: ${typeof location !== "undefined" ? location.origin : ""}`);
  const [subject, setSubject] = useState(`Your weekly card: ${card.name}`);
  const wa = d.leads.filter((l: any) => l.kind === "whatsapp"), em = d.leads.filter((l: any) => l.kind === "email");
  const cols: Col<any>[] = [
    { key: "k", label: "Type", render: (l) => <Badge tone={l.kind === "email" ? "violet" : "green"}>{l.kind}</Badge> },
    { key: "c", label: "Contact", sort: (l) => l.contact, render: (l) => <span className="text-ivory">{l.contact}</span> },
    { key: "d", label: "Joined", sort: (l) => l.created, render: (l) => <span className="text-ivory/55">{fdate(l.created)}</span> },
    { key: "a", label: "", className: "text-right", render: (l) => <Btn size="sm" v="danger" icon="trash" aria-label="Remove subscriber" onClick={() => act({ action: "deleteLead", id: l.id }, "Removed")} /> },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl">Marketing</h1><a href="/api/admin?export=leads"><Btn icon="download">Export subscribers</Btn></a></div>
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Subscribers" value={d.leads.length} icon="community" /><Stat label="WhatsApp" value={wa.length} icon="whatsapp" tone="teal" delay={0.07} /><Stat label="Email" value={em.length} icon="bell" tone="pink" delay={0.14} /></div>
      <Card title="This week's card">
        <p className="mb-3 text-sm text-ivory/55">A card is picked for the week automatically. Edit the message, then send it. WhatsApp can&apos;t be sent in bulk automatically, so each WhatsApp subscriber gets a one-tap link below.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3"><label className="block"><Label>Email subject</Label><input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
            <label className="block"><Label>Message</Label><textarea className={`${field} min-h-[220px]`} value={text} onChange={(e) => setText(e.target.value)} /></label>
            <div className="flex flex-wrap gap-2"><Btn icon="check" onClick={async () => { await navigator.clipboard?.writeText(text).catch(() => {}); toast("Message copied"); }}>Copy message</Btn>
              <Btn v="primary" icon="bell" disabled={!em.length} onClick={async () => { if (!(await confirm({ title: `Email ${em.length} subscriber(s)?`, body: "Requires an email service key (RESEND_API_KEY).", yes: "Send" }))) return; const j = await post({ action: "emailLeads", subject, text }); toast(j.emailConfigured ? `Sent to ${j.sent} of ${j.total}` : "Email isn't set up yet. Add RESEND_API_KEY to send emails.", j.emailConfigured ? "ok" : "err"); }}>Email all ({em.length})</Btn></div></div>
          <div><Label>WhatsApp subscribers</Label>
            {wa.length ? <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">{wa.map((l: any) => <li key={l.id} className="flex items-center justify-between rounded-xl bg-white/[.04] p-3 text-sm"><span>+{l.contact}</span><a target="_blank" rel="noreferrer" href={`https://wa.me/${waNumber(l.contact)}?text=${encodeURIComponent(text)}`}><Btn size="sm" icon="whatsapp">Send</Btn></a></li>)}</ul> : <p className="text-sm text-ivory/40">No WhatsApp subscribers yet.</p>}</div>
        </div>
      </Card>
      <Card title="All subscribers"><DataTable rows={d.leads} cols={cols} rowKey={(l) => l.id} search={(l) => l.contact} searchPlaceholder="Search subscribers…" empty={<Empty icon="community" title="No subscribers yet" hint="People join from the weekly-card box in the website footer, with their consent." />} /></Card>
    </div>
  );
}

// ───────── Settings cards: business details, backups, recently deleted ─────────
export function BusinessCard() {
  const { d, act } = useAdmin(); const [b, setB] = useState<any>(d.business);
  const set = (k: string, v: string) => setB((x: any) => ({ ...x, [k]: v })); const dirty = JSON.stringify(b) !== JSON.stringify(d.business);
  const f = (k: string, label: string, ph = "", type = "text") => <label className="block"><Label>{label}</Label><input type={type} className={field} placeholder={ph} value={b[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></label>;
  return (
    <Card title="Business details" className="lg:col-span-2">
      <p className="mb-4 text-sm text-ivory/55">Shown on the site: the UPI payment box after a booking, footer links, and the About page.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {f("upiId", "UPI ID (for the payment QR code)", "yourname@bank")}{f("upiName", "Name shown in the UPI app", "THE ARCANA")}
        {f("instagram", "Instagram link", "https://instagram.com/yourhandle", "url")}{f("channel", "WhatsApp Channel link", "https://whatsapp.com/channel/…", "url")}
        {f("aboutName", "Reader's name (About page)")}{f("aboutSpecialties", "Specialties", "Love · Career · Self-discovery")}
        <div className="md:col-span-2">{f("aboutExperience", "Experience (only what is true; leave blank if unsure)")}</div>
        <label className="block md:col-span-2"><Label>About the reader (blank line = new paragraph)</Label><textarea rows={5} className={field} value={b.aboutBio ?? ""} onChange={(e) => set("aboutBio", e.target.value)} /></label>
      </div>
      <div className="mt-4 flex items-center gap-3"><Btn v="primary" icon="check" disabled={!dirty} onClick={() => act({ action: "saveBusiness", business: b }, "Business details saved")}>Save details</Btn>{b.upiId && !/^[\w.\-]{2,}@[A-Za-z]\w+$/.test(b.upiId) && <span className="text-xs text-amber-300">That UPI ID doesn&apos;t look valid, so it will be ignored.</span>}</div>
    </Card>
  );
}

export function BackupsCard() {
  const { d, act } = useAdmin(); const { confirm } = useUi();
  return (
    <Card title="Automatic backups" className="lg:col-span-2" action={<Btn v="primary" icon="download" onClick={() => act({ action: "backupNow" }, "Backup saved")}>Back up now</Btn>}>
      <p className="mb-4 text-sm text-ivory/55">A backup is taken automatically every night when the site runs on Vercel (the newest 14 are kept). Download any of them, or take one before risky changes.</p>
      {d.backups.length ? <ul className="space-y-2">{d.backups.map((b: any) => (
        <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[.04] p-3 text-sm"><Badge tone={b.kind === "auto" ? "violet" : "green"}>{b.kind}</Badge><span className="flex-1 text-ivory/85">{new Date(b.created).toLocaleString("en-IN")} · {Math.round(b.size / 1024)} KB</span>
          <a href={`/api/admin?backupId=${b.id}`}><Btn size="sm" icon="download">Download</Btn></a>
          <Btn size="sm" v="danger" icon="trash" aria-label="Delete backup" onClick={async () => (await confirm({ title: "Delete this backup?", danger: true, yes: "Delete" })) && act({ action: "deleteBackup", id: b.id }, "Backup deleted")} /></li>))}</ul>
        : <Empty icon="download" title="No stored backups yet" hint="Press Back up now to create the first one." />}
    </Card>
  );
}

const TBL: Record<string, string> = { posts: "Blog post", reviews: "Review", coupons: "Coupon", announcements: "Announcement", readings: "Saved reading", notes: "Note" };
export function TrashCard() {
  const { d, act } = useAdmin();
  return (
    <Card title="Recently deleted" className="lg:col-span-2">
      <p className="mb-4 text-sm text-ivory/55">Deleted a blog post, review, coupon, announcement, note or saved reading by mistake? Restore it within 30 days.</p>
      {d.trash.length ? <ul className="space-y-2">{d.trash.map((t: any) => (
        <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[.04] p-3 text-sm"><Badge>{TBL[t.tbl] || t.tbl}</Badge><span className="flex-1 text-ivory/85">{t.label}<span className="ml-2 text-xs text-ivory/40">{ago(t.deleted)}</span></span>
          <Btn size="sm" v="primary" icon="check" onClick={() => act({ action: "restoreTrash", id: t.id }, "Restored")}>Restore</Btn><Btn size="sm" icon="close" onClick={() => act({ action: "purgeTrash", id: t.id }, "Removed for good")}>Delete for good</Btn></li>))}</ul>
        : <p className="text-sm text-ivory/40">Nothing has been deleted recently.</p>}
    </Card>
  );
}

// ───────── Bookings: tomorrow's reminders + printable day sheet ─────────
export function printDaySheet(title: string, list: any[]) {
  const w = window.open("", "_blank"); if (!w) return;
  w.document.write(`<!doctype html><title>${esc(title)}</title><style>body{font-family:Georgia,serif;max-width:900px;margin:30px auto;padding:0 20px;color:#222}h1{letter-spacing:.2em;font-weight:500;border-bottom:1px solid #b89a52;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:14px}th,td{border-bottom:1px solid #ddd;padding:8px 6px;text-align:left;vertical-align:top}th{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7a5c1e}.n{color:#777;font-size:12px}</style>
    <h1>THE ARCANA · ${esc(title)}</h1>${list.length ? `<table><tr><th>Time</th><th>Client</th><th>Service</th><th>Status</th><th>Notes</th></tr>${list.map((b) => `<tr><td><b>${esc(b.time)}</b></td><td>${esc(b.name)}<br><span class="n">${esc(b.phone || "")}</span></td><td>${esc(b.service_name)}<br><span class="n">₹${b.price - b.discount}</span></td><td>${esc(b.status)}</td><td>${esc(b.note || "")}</td></tr>`).join("")}</table>` : "<p>No sessions.</p>"}
    <script>setTimeout(()=>window.print(),300)<\/script>`);
  w.document.close();
}

export function RemindersButton() {
  const { d } = useAdmin(); const { toast } = useUi(); const [open, setOpen] = useState(false); const [nowTs] = useState(() => Date.now());
  const tomorrow = isoDay(nowTs + 864e5);
  const list = d.bookings.filter((b: any) => b.date === tomorrow && ["pending", "confirmed"].includes(b.status)).sort((a: any, b: any) => a.time.localeCompare(b.time));
  const msg = (b: any) => `Hi ${b.name}, a gentle reminder of your ${b.service_name} tomorrow (${fshort(b.date)}) at ${b.time}.${b.meeting_link ? " Join here: " + b.meeting_link : ""} Ref ${b.code}. See you then ✦ ${SITE.name}`;
  return (<>
    <Btn icon="bell" onClick={() => setOpen(true)}>Tomorrow&apos;s reminders{list.length ? ` (${list.length})` : ""}</Btn>
    <Modal open={open} onClose={() => setOpen(false)} title="Remind tomorrow's clients">
      {list.length ? (<div className="space-y-3">
        <ul className="space-y-2">{list.map((b: any) => (<li key={b.id} className="flex items-center gap-3 rounded-xl bg-white/[.04] p-3 text-sm"><Avatar name={b.name} /><span className="min-w-0 flex-1"><span className="block truncate text-ivory">{b.name}</span><span className="text-xs text-ivory/50">{b.time} · {b.service_name}</span></span>
          {b.phone ? <a target="_blank" rel="noreferrer" href={`https://wa.me/${waNumber(b.phone)}?text=${encodeURIComponent(msg(b))}`}><Btn size="sm" icon="whatsapp">Remind</Btn></a> : <Badge tone="amber">no phone</Badge>}</li>))}</ul>
        <Btn icon="bell" className="w-full" onClick={async () => { const j = await post({ action: "emailReminders" }); toast(j.emailConfigured ? `Emailed ${j.sent} of ${j.eligible} client(s) with an account email` : "Email isn't set up yet. Add RESEND_API_KEY to send reminders by email.", j.emailConfigured ? "ok" : "err"); }}>Also send email reminders</Btn></div>)
        : <Empty icon="calendar" title="Nothing tomorrow" hint="No pending or confirmed sessions for tomorrow." />}
    </Modal></>);
}

// ───────── Clients: CSV import + password reset links ─────────
function parseCsv(text: string) {
  const rows: string[][] = []; let cur: string[] = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ",") { cur.push(f); f = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; cur.push(f); f = ""; if (cur.some((x) => x.trim())) rows.push(cur); cur = []; } else f += c;
  }
  cur.push(f); if (cur.some((x) => x.trim())) rows.push(cur);
  return rows;
}
export function ImportClientsButton() {
  const { act } = useAdmin(); const { toast } = useUi();
  return (
    <label className="inline-flex cursor-pointer"><span className="group inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-ivory/90 transition hover:border-fuchsia-400/50 hover:bg-white/[.04]"><Icon n="download" className="h-4 w-4 rotate-180" />Import CSV</span>
      <input type="file" accept=".csv,text/csv" className="sr-only" aria-label="Import clients from CSV" onChange={async (e) => {
        const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
        const rows = parseCsv(await file.text()); if (!rows.length) return toast("That file is empty", "err");
        const head = rows[0].map((h) => h.trim().toLowerCase()); const hasHead = head.includes("email"); const idx = (k: string, d: number) => (hasHead ? head.indexOf(k) : d);
        const data = (hasHead ? rows.slice(1) : rows).map((r) => ({ name: r[idx("name", 0)], email: r[idx("email", 1)], phone: r[idx("phone", 2)] }));
        const j = await act({ action: "importClients", rows: data }); toast(`Imported ${j.added ?? 0} client(s), skipped ${j.skipped ?? 0}. They can sign in via "Forgot password".`);
      }} /></label>
  );
}

export function ResetLinkModal({ userId, onClose }: { userId: number | null; onClose: () => void }) {
  const { d, act } = useAdmin(); const { toast } = useUi(); const [url, setUrl] = useState("");
  const u = d.customers.find((c: any) => c.id === userId);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (userId == null) { setUrl(""); return; } let live = true; act({ action: "resetLink", id: userId }).then((j) => live && setUrl(j.url || "")); return () => { live = false; }; }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = `Hi ${u?.name || ""}, here is your one-time link to choose a new password for THE ARCANA (valid for 24 hours): ${url}`;
  return (
    <Modal open={userId != null} onClose={onClose} title="Password reset link">
      {url ? (<div className="space-y-4">
        <p className="text-sm text-ivory/60">Send this one-time link to {u?.name}. It works for 24 hours and only once.</p>
        <code className="block break-all rounded-xl bg-black/40 p-3 text-sm text-champagne">{url}</code>
        <div className="flex flex-wrap gap-2"><Btn icon="check" onClick={async () => { await navigator.clipboard?.writeText(url).catch(() => {}); toast("Link copied"); }}>Copy link</Btn>
          <a target="_blank" rel="noreferrer" href={`https://wa.me/${waNumber(u?.phone)}?text=${encodeURIComponent(text)}`}><Btn v="primary" icon="whatsapp">Send on WhatsApp</Btn></a></div>
        {!u?.phone && <p className="text-xs text-amber-300">No phone on file. Copy the link and send it another way.</p>}</div>) : <Empty icon="sparkle" title="Creating link…" />}
    </Modal>
  );
}

export function ResetRequests() {
  const { d } = useAdmin(); const [uid, setUid] = useState<number | null>(null);
  return (<>
    <AnimatePresence>{d.resetRequests.length > 0 && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
        <Card title={<span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />Password reset requests</span>}>
          <ul className="space-y-2">{d.resetRequests.map((r: any) => (<li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[.04] p-3 text-sm"><Avatar name={r.name} /><span className="min-w-0 flex-1"><span className="block text-ivory">{r.name}</span><span className="text-xs text-ivory/50">{r.email} · {ago(r.created)}</span></span><Btn size="sm" v="primary" icon="shield" onClick={() => setUid(r.user_id)}>Create reset link</Btn></li>))}</ul></Card>
      </motion.div>)}</AnimatePresence>
    <ResetLinkModal userId={uid} onClose={() => setUid(null)} />
  </>);
}

// ───────── Reading summary editor (shown inside the booking panel) ─────────
export function SummaryEditor({ b }: { b: any }) {
  const { act } = useAdmin(); const { toast } = useUi();
  const initCards = (() => { try { return JSON.parse(b.summary_cards || "[]") as { id: number; reversed: boolean; label?: string }[]; } catch { return []; } })();
  const [text, setText] = useState<string>(b.summary || ""); const [cards, setCards] = useState(initCards); const [pick, setPick] = useState(0);
  const url = typeof location !== "undefined" ? `${location.origin}/summary/${b.code}` : "";
  const norm = (l: { id: number; reversed?: boolean }[]) => JSON.stringify(l.map((x) => ({ id: x.id, reversed: !!x.reversed })));
  const dirty = text !== (b.summary || "") || norm(cards) !== norm(initCards);
  return (
    <div><Label>Reading summary for the client</Label>
      <p className="mb-2 text-xs text-ivory/45">Pick the cards from the session and write a short summary. The client opens it from a private link and can save it as a PDF.</p>
      <div className="mb-2 flex flex-wrap gap-2">{cards.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1 text-sm text-violet-100 ring-1 ring-violet-400/25">{MAJOR_ARCANA[c.id]?.name}{c.reversed ? " ↺" : ""}
          <button aria-label={`Flip ${MAJOR_ARCANA[c.id]?.name}`} className="text-xs text-ivory/60 hover:text-white" onClick={() => setCards(cards.map((x, j) => (j === i ? { ...x, reversed: !x.reversed } : x)))}>flip</button>
          <button aria-label={`Remove ${MAJOR_ARCANA[c.id]?.name}`} onClick={() => setCards(cards.filter((_, j) => j !== i))}><Icon n="close" className="h-3.5 w-3.5" /></button></span>))}</div>
      <div className="mb-3 flex gap-2"><select aria-label="Card to add" className={`${field} !w-auto flex-1`} value={pick} onChange={(e) => setPick(Number(e.target.value))}>{MAJOR_ARCANA.map((c) => <option key={c.id} value={c.id}>{c.numeral} · {c.name}</option>)}</select>
        <Btn size="sm" icon="plus" onClick={() => cards.length < 10 && setCards([...cards, { id: pick, reversed: false }])}>Add card</Btn></div>
      <textarea aria-label="Summary text" rows={5} className={field} placeholder="What came up, what it means for them, and a few gentle things to reflect on…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2 flex flex-wrap gap-2"><Btn v="primary" size="sm" icon="check" disabled={!dirty} onClick={() => act({ action: "saveSummary", id: b.id, text, cards }, "Summary saved")}>Save summary</Btn>
        {b.summary && !dirty && (<>
          <Btn size="sm" onClick={async () => { await navigator.clipboard?.writeText(url).catch(() => {}); toast("Private link copied"); }}>Copy client link</Btn>
          <a target="_blank" rel="noreferrer" href={`https://wa.me/${waNumber(b.phone)}?text=${encodeURIComponent(`Hi ${b.name}, your reading summary from THE ARCANA is ready ✦ ${url}`)}`}><Btn size="sm" icon="whatsapp">Send on WhatsApp</Btn></a></>)}</div>
    </div>
  );
}

// ───────── Waitlist (calendar page) ─────────
export function WaitlistCard() {
  const { d, act } = useAdmin();
  const free = (date: string) => { const total = d.slots.filter((s: any) => !s.priority).length; if (d.blocked.some((x: any) => x.date === date && !x.time)) return 0; const used = d.bookings.filter((x: any) => x.date === date && ["pending", "confirmed"].includes(x.status)).length + d.blocked.filter((x: any) => x.date === date && x.time).length; return Math.max(0, total - used); };
  if (!d.waitlist.length) return null;
  return (
    <Card title={<span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />Waitlist ({d.waitlist.length})</span>}>
      <p className="mb-4 text-sm text-ivory/55">People who wanted a day that was full. When a slot opens, message them with one tap.</p>
      <ul className="space-y-2">{d.waitlist.map((w: any) => {
        const isMail = w.contact.includes("@"); const n = free(w.date); const msg = `Hi ${w.name}, good news: a slot has opened on ${fshort(w.date)}. Would you like to book it? ${typeof location !== "undefined" ? location.origin : ""}/#book`;
        return (<li key={w.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[.04] p-3 text-sm"><Avatar name={w.name} />
          <span className="min-w-0 flex-1"><span className="block text-ivory">{w.name} <span className="text-ivory/50">· {fshort(w.date)}</span></span><span className="text-xs text-ivory/50">{isMail ? w.contact : "+" + w.contact} · {ago(w.created)}</span></span>
          <Badge tone={n > 0 ? "green" : "gray"}>{n > 0 ? `${n} slot${n > 1 ? "s" : ""} free now` : "still full"}</Badge>
          <a target="_blank" rel="noreferrer" href={isMail ? `mailto:${w.contact}?subject=${encodeURIComponent("A slot opened at THE ARCANA")}&body=${encodeURIComponent(msg)}` : `https://wa.me/${w.contact}?text=${encodeURIComponent(msg)}`}><Btn size="sm" icon={isMail ? "bell" : "whatsapp"}>Notify</Btn></a>
          <Btn size="sm" v="danger" icon="trash" aria-label="Remove from waitlist" onClick={() => act({ action: "deleteWaitlist", id: w.id }, "Removed")} /></li>);
      })}</ul>
    </Card>
  );
}

// ───────── Gift cards (coupons page) ─────────
const GIFT_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function GiftCardButton() {
  const { act } = useAdmin(); const { toast } = useUi(); const [open, setOpen] = useState(false); const [amount, setAmount] = useState("499"); const [code, setCode] = useState("");
  async function create() {
    const bytes = crypto.getRandomValues(new Uint8Array(6)); const c = "GIFT-" + [...bytes].map((x) => GIFT_CHARS[x % GIFT_CHARS.length]).join("");
    const j = await act({ action: "saveCoupon", code: c, kind: "flat", value: amount, max_uses: 1 }); if (j?.ok) setCode(c);
  }
  const text = `Here's your THE ARCANA gift card ✦ Code ${code} is worth ₹${amount} off a personal reading. Enter it in the Coupon box when you book: ${typeof location !== "undefined" ? location.origin : ""}/#book`;
  return (<>
    <Btn icon="sparkle" onClick={() => { setCode(""); setOpen(true); }}>New gift card</Btn>
    <Modal open={open} onClose={() => setOpen(false)} title="Create a gift card">
      {!code ? (<div className="space-y-4">
        <p className="text-sm text-ivory/60">Creates a one-time code worth a fixed amount. Do this after you&apos;ve received the payment.</p>
        <label className="block"><Label>Amount (₹)</Label><input className={field} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} /></label>
        <Btn v="primary" className="w-full" disabled={!Number(amount)} onClick={create}>Create gift code</Btn></div>)
        : (<div className="space-y-4"><p className="font-display text-4xl tracking-[.15em] text-gold">{code}</p><p className="text-sm text-ivory/60">Worth ₹{amount}, single use.</p>
          <div className="flex flex-wrap gap-2"><Btn icon="check" onClick={async () => { await navigator.clipboard?.writeText(text).catch(() => {}); toast("Message copied"); }}>Copy message</Btn>
            <a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}><Btn v="primary" icon="whatsapp">Send on WhatsApp</Btn></a></div></div>)}
    </Modal></>);
}
