/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Badge, Btn, Icon, Skeleton, UiProvider, field, useUi, STATUS_TONE, fshort } from "@/components/admin/ui";
import { Ctx, type Route } from "@/components/admin/ctx";
import { BookingDrawer, BookingsPage, CalendarPage, ClientDrawer, ClientsPage, Dashboard, PaymentsPage } from "@/components/admin/pages1";
import { AvailabilityPage, BlogPage, CardsPage, CouponsPage, NoticesPage, ReviewsPage, ServicesPage } from "@/components/admin/pages2";
import { ExperiencePage } from "@/components/admin/pages4";
import { AnalyticsPage, MarketingPage } from "@/components/admin/pages5";
import { ChatPage, CommunityPage, ReadersPage, ReadingsPage, ReportsPage, SettingsPage } from "@/components/admin/pages3";

const NAV: { group: string; items: { r: Route; label: string; icon: string; badge?: string }[] }[] = [
  { group: "Overview", items: [{ r: "dashboard", label: "Dashboard", icon: "dashboard" }, { r: "calendar", label: "Calendar", icon: "calendar", badge: "waitlist" }] },
  { group: "Business", items: [{ r: "bookings", label: "Bookings", icon: "bookings", badge: "bookings" }, { r: "payments", label: "Payments", icon: "payments", badge: "payments" }, { r: "clients", label: "Clients", icon: "clients", badge: "resets" }, { r: "services", label: "Services & pricing", icon: "services" }, { r: "availability", label: "Availability", icon: "clock" }, { r: "coupons", label: "Coupons", icon: "coupons" }] },
  { group: "Content", items: [{ r: "cards", label: "Tarot cards", icon: "cards" }, { r: "blog", label: "Blog", icon: "blog" }, { r: "experience", label: "Music & intro", icon: "sound" }, { r: "notices", label: "Announcements", icon: "bell" }, { r: "reviews", label: "Reviews", icon: "star", badge: "reviews" }] },
  { group: "Engagement", items: [{ r: "chat", label: "Chat", icon: "chat", badge: "chat" }, { r: "community", label: "Community", icon: "community", badge: "community" }, { r: "readers", label: "Readers", icon: "readers", badge: "readers" }, { r: "readings", label: "Saved readings", icon: "readings" }, { r: "marketing", label: "Marketing", icon: "sparkle" }] },
  { group: "Insights", items: [{ r: "reports", label: "Reports", icon: "reports" }, { r: "analytics", label: "Analytics & health", icon: "reports", badge: "errors" }] },
  { group: "System", items: [{ r: "settings", label: "Settings", icon: "settings" }] },
];
const ALL = NAV.flatMap((g) => g.items);
const PAGES: Record<Route, React.ComponentType> = { dashboard: Dashboard, calendar: CalendarPage, bookings: BookingsPage, payments: PaymentsPage, clients: ClientsPage, services: ServicesPage, availability: AvailabilityPage, coupons: CouponsPage, cards: CardsPage, blog: BlogPage, experience: ExperiencePage, analytics: AnalyticsPage, marketing: MarketingPage, notices: NoticesPage, reviews: ReviewsPage, chat: ChatPage, community: CommunityPage, readers: ReadersPage, readings: ReadingsPage, reports: ReportsPage, settings: SettingsPage };

const post = (b: object) => fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
const fromHash = (): Route => { const h = (typeof location !== "undefined" ? location.hash.replace(/^#\/?/, "") : "") as Route; return ALL.some((i) => i.r === h) ? h : "dashboard"; };

export default function AdminPage() { return <UiProvider><Admin /></UiProvider>; }

function Admin() {
  const { toast } = useUi();
  const [d, setD] = useState<any>(null);
  const [state, setState] = useState<"loading" | "login" | "off" | "ok">("loading");
  const [route, setRoute] = useState<Route>("dashboard");
  const [collapsed, setCollapsed] = useState(false); const [mobileNav, setMobileNav] = useState(false);
  const [palette, setPalette] = useState(false); const [bell, setBell] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null); const [clientId, setClientId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin");
    if (r.status === 401) { const j = await r.json(); setState(j.configured ? "login" : "off"); return; }
    setD(await r.json()); setState("ok");
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoute(fromHash()); try { setCollapsed(localStorage.getItem("arcana-admin-collapsed") === "1"); } catch {}
    load();
    const onHash = () => setRoute(fromHash()); addEventListener("hashchange", onHash);
    const poll = setInterval(() => { if (!document.hidden) load(); }, 12000);
    return () => { removeEventListener("hashchange", onHash); clearInterval(poll); };
  }, [load]);

  const go = useCallback((r: Route) => { location.hash = "/" + r; setRoute(r); setMobileNav(false); setBell(false); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const act = useCallback(async (body: object, msg?: string) => {
    const r = await post(body); const j = await r.json().catch(() => ({}));
    if (!r.ok) { toast(j.error || "Something went wrong", "err"); return j; }
    if (msg) toast(msg); await load(); return j;
  }, [load, toast]);
  const toggleCollapse = () => setCollapsed((c) => { try { localStorage.setItem("arcana-admin-collapsed", c ? "0" : "1"); } catch {} return !c; });

  // keyboard: ⌘/Ctrl+K palette, g d / g b, [ collapse
  useEffect(() => {
    let g = 0;
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; const typing = /INPUT|TEXTAREA|SELECT/.test(t?.tagName || "") || t?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); return; }
      if (typing) return;
      if (e.key === "[") toggleCollapse();
      if (e.key.toLowerCase() === "g") { g = Date.now(); return; }
      if (Date.now() - g < 900) { if (e.key.toLowerCase() === "d") go("dashboard"); if (e.key.toLowerCase() === "b") go("bookings"); g = 0; }
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [go]);

  const ctx = useMemo(() => ({ d, act, go, reload: load, openBooking: (id: number) => setBookingId(id), openClient: (id: number) => setClientId(id) }), [d, act, go, load]);

  if (state === "loading") return <Splash />;
  if (state === "off") return <p className="p-10">Admin is disabled. Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code> and restart.</p>;
  if (state === "login") return <Login onDone={load} />;

  const total = d ? Object.values(d.alerts as Record<string, number>).reduce((a, b) => a + b, 0) : 0;
  const Page = PAGES[route]; const cur = ALL.find((i) => i.r === route)!;
  const side = (mobile?: boolean) => (
    <nav aria-label="Admin navigation" className="flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/[.06] px-4 ${collapsed && !mobile ? "justify-center" : ""}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_6px_20px_rgba(168,85,247,.45)]"><Icon n="sparkle" className="h-5 w-5 text-white" /></span>
        {(!collapsed || mobile) && <div className="leading-tight"><p className="font-display text-lg tracking-[.22em] text-champagne">THE ARCANA</p><p className="text-[.62rem] uppercase tracking-[.3em] text-ivory/35">Admin</p></div>}
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((g) => (
          <div key={g.group}>
            {(!collapsed || mobile) && <p className="mb-1.5 px-3 text-[.62rem] font-medium uppercase tracking-[.22em] text-ivory/30">{g.group}</p>}
            <ul className="space-y-0.5">{g.items.map((i) => {
              const on = route === i.r; const n = i.badge ? d.alerts[i.badge] : 0;
              return (
                <li key={i.r}><button onClick={() => go(i.r)} aria-current={on ? "page" : undefined} title={collapsed && !mobile ? i.label : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${collapsed && !mobile ? "justify-center" : ""} ${on ? "text-white" : "text-ivory/60 hover:bg-white/[.05] hover:text-ivory"}`}>
                  {on && <motion.span layoutId={mobile ? "navbg-m" : "navbg"} className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/70 to-fuchsia-600/55 shadow-[0_6px_22px_rgba(168,85,247,.28)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative"><Icon n={i.icon} className="h-[18px] w-[18px]" />{n > 0 && collapsed && !mobile && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#0d0818]" />}</span>
                  {(!collapsed || mobile) && <span className="relative flex-1 text-left">{i.label}</span>}
                  {(!collapsed || mobile) && n > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative rounded-full bg-amber-400 px-2 py-0.5 text-[.65rem] font-semibold text-black">{n}</motion.span>}
                </button></li>);
            })}</ul>
          </div>))}
      </div>
      <div className="shrink-0 border-t border-white/[.06] p-3">
        <a href="/" target="_blank" rel="noreferrer" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory/60 transition hover:bg-white/[.05] hover:text-ivory ${collapsed && !mobile ? "justify-center" : ""}`}><Icon n="external" className="h-[18px] w-[18px]" />{(!collapsed || mobile) && "View website"}</a>
        <button onClick={async () => { await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); location.reload(); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory/60 transition hover:bg-red-500/10 hover:text-red-300 ${collapsed && !mobile ? "justify-center" : ""}`}><Icon n="logout" className="h-[18px] w-[18px]" />{(!collapsed || mobile) && "Sign out"}</button>
      </div>
    </nav>
  );

  return (
    <Ctx.Provider value={ctx}>
      <div className="min-h-screen bg-[#0a0714] text-ivory [background-image:radial-gradient(50%_35%_at_80%_-5%,rgba(124,58,237,.18),transparent),radial-gradient(40%_30%_at_0%_10%,rgba(236,72,153,.08),transparent)]">
        {/* desktop sidebar */}
        <motion.aside animate={{ width: collapsed ? 76 : 264 }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="fixed inset-y-0 left-0 z-40 hidden border-r border-white/[.06] bg-[#0d0818] lg:block">{d ? side() : null}</motion.aside>
        {/* mobile drawer */}
        <AnimatePresence>{mobileNav && d && (<>
          <motion.div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-[2px] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }} className="fixed inset-y-0 left-0 z-[71] w-[82vw] max-w-[300px] border-r border-white/10 bg-[#0d0818] lg:hidden">{side(true)}</motion.aside></>)}</AnimatePresence>

        <div className={`transition-[padding] duration-300 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"}`}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[.06] bg-[#0a0714]/85 px-4 backdrop-blur-xl sm:px-6">
            <button onClick={() => setMobileNav(true)} aria-label="Open menu" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ivory/80 transition hover:bg-white/10 lg:hidden"><Icon n="menu" /></button>
            <button onClick={toggleCollapse} aria-label="Collapse sidebar" className="hidden h-10 w-10 items-center justify-center rounded-xl text-ivory/60 transition hover:bg-white/10 hover:text-white lg:flex"><motion.span animate={{ rotate: collapsed ? 180 : 0 }}><Icon n="menu" /></motion.span></button>
            <div className="hidden items-center gap-2 text-sm text-ivory/45 sm:flex"><span>Admin</span><Icon n="chevron" className="h-3.5 w-3.5" /><span className="text-ivory">{cur.label}</span></div>
            <button onClick={() => setPalette(true)} className="mx-auto flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3.5 text-sm text-ivory/45 transition hover:border-fuchsia-400/40 hover:bg-white/[.07]"><Icon n="search" className="h-4 w-4" /><span className="flex-1 text-left">Search or jump to…</span><kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[.65rem] sm:block">⌘K</kbd></button>
            <div className="relative">
              <button onClick={() => setBell(!bell)} aria-label={`Notifications, ${total} need attention`} aria-expanded={bell} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ivory/80 transition hover:bg-white/10"><Icon n="bell" />{total > 0 && <motion.span key={total} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[.6rem] font-bold text-black">{total}</motion.span>}</button>
              <AnimatePresence>{bell && d && (<>
                <div className="fixed inset-0 z-40" onClick={() => setBell(false)} />
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-12 z-50 w-[min(92vw,340px)] overflow-hidden rounded-2xl border border-white/10 bg-[#120c20] shadow-2xl">
                  <p className="border-b border-white/[.07] px-4 py-3 font-display text-lg">Needs attention</p>
                  {total === 0 ? <p className="px-4 py-8 text-center text-sm text-ivory/45">You&apos;re all caught up ✦</p> : <ul>{([["bookings", "bookings", "Bookings awaiting confirmation"], ["payments", "payments", "Pending payments"], ["chat", "chat", "Chats waiting for a reply"], ["reviews", "reviews", "Reviews to approve"], ["community", "community", "Community posts to review"], ["readers", "readers", "Reader applications"], ["resets", "clients", "Password reset requests"], ["errors", "analytics", "Site errors (24h)"]] as const).filter(([k]) => d.alerts[k] > 0).map(([k, r, l]) => (
                    <li key={k}><button onClick={() => go(r)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-white/[.06]">{l}<Badge tone="amber">{d.alerts[k]}</Badge></button></li>))}</ul>}
                </motion.div></>)}</AnimatePresence>
            </div>
            <Avatar name="Admin" />
          </header>

          <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
            {!d ? <div className="space-y-4"><Skeleton className="h-10 w-64" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div><Skeleton className="h-72" /></div> : (
              <AnimatePresence mode="wait"><motion.div key={route} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}><Page /></motion.div></AnimatePresence>)}
          </main>
        </div>

        {d && <>
          <BookingDrawer id={bookingId} onClose={() => setBookingId(null)} />
          <ClientDrawer id={clientId} onClose={() => setClientId(null)} />
          <Palette open={palette} onClose={() => setPalette(false)} d={d} go={go} openBooking={(id) => setBookingId(id)} openClient={(id) => setClientId(id)} />
        </>}
      </div>
    </Ctx.Provider>
  );
}

function Splash() {
  return <div className="flex min-h-screen items-center justify-center bg-[#0a0714]"><motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.6, repeat: Infinity }} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600"><Icon n="sparkle" className="h-7 w-7 text-white" /></motion.div></div>;
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [shake, setShake] = useState(0);
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0714] px-4">
      <motion.div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px]" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="pointer-events-none absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/15 blur-[120px]" animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 9, repeat: Infinity }} />
      <motion.form key={shake} initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={shake ? { x: [0, -12, 12, -8, 8, 0], opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }} transition={{ duration: shake ? 0.4 : 0.6, ease: "easeOut" }}
        onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await post({ action: "login", password: pw }); const j = await r.json(); setBusy(false); if (j.ok) onDone(); else { setErr(j.error || "Wrong password"); setShake((s) => s + 1); } }}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#120c20]/95 p-8 shadow-[0_30px_100px_rgba(0,0,0,.6)]">
        <motion.span animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 5, repeat: Infinity }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_10px_30px_rgba(168,85,247,.5)]"><Icon n="sparkle" className="h-7 w-7 text-white" /></motion.span>
        <h1 className="mt-5 text-center font-display text-3xl tracking-[.18em] text-champagne">THE ARCANA</h1><p className="mt-1 text-center text-xs uppercase tracking-[.3em] text-ivory/40">Admin portal</p>
        <label className="mt-8 block"><span className="mb-1.5 block text-xs uppercase tracking-[.14em] text-ivory/45">Password</span><input type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} className={field} autoComplete="current-password" /></label>
        <AnimatePresence>{err && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }} role="alert" className="mt-2 text-sm text-red-300">{err}</motion.p>}</AnimatePresence>
        <Btn v="primary" className="mt-6 w-full !py-3" disabled={busy || !pw}>{busy ? "Checking…" : "Enter"}</Btn>
      </motion.form>
    </main>
  );
}

function Palette({ open, onClose, d, go, openBooking, openClient }: { open: boolean; onClose: () => void; d: any; go: (r: Route) => void; openBooking: (id: number) => void; openClient: (id: number) => void }) {
  const [q, setQ] = useState(""); const [i, setI] = useState(0); const ref = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) { setQ(""); setI(0); setTimeout(() => ref.current?.focus(), 50); } }, [open]);
  const items = useMemo(() => {
    const s = q.toLowerCase().trim();
    const pages = ALL.filter((p) => !s || p.label.toLowerCase().includes(s)).map((p) => ({ k: "p" + p.r, label: p.label, hint: "Go to page", icon: p.icon, run: () => go(p.r) }));
    if (!s) return pages;
    const bks = d.bookings.filter((b: any) => `${b.name} ${b.code} ${b.service_name}`.toLowerCase().includes(s)).slice(0, 5).map((b: any) => ({ k: "b" + b.id, label: `${b.name} · ${b.service_name}`, hint: `${fshort(b.date)} ${b.time} · ${b.status}`, icon: "bookings", run: () => openBooking(b.id) }));
    const cls = d.customers.filter((c: any) => `${c.name} ${c.email} ${c.phone || ""}`.toLowerCase().includes(s)).slice(0, 5).map((c: any) => ({ k: "c" + c.id, label: c.name, hint: c.email, icon: "clients", run: () => openClient(c.id) }));
    return [...pages, ...bks, ...cls];
  }, [q, d, go, openBooking, openClient]);
  const pick = (n: number) => { items[n]?.run(); onClose(); };
  void STATUS_TONE;
  return (
    <AnimatePresence>{open && (
      <motion.div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/65 p-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div role="dialog" aria-modal="true" aria-label="Search" onClick={(e) => e.stopPropagation()} initial={{ y: -20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: -10, opacity: 0 }} className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#120c20] shadow-[0_30px_100px_rgba(0,0,0,.7)]">
          <div className="flex items-center gap-3 border-b border-white/[.07] px-4"><Icon n="search" className="h-5 w-5 text-ivory/40" />
            <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} aria-label="Search pages, bookings and clients" placeholder="Search pages, bookings, clients…" className="h-14 w-full bg-transparent text-base text-ivory outline-none placeholder:text-ivory/30"
              onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(items.length - 1, x + 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); } if (e.key === "Enter") pick(i); if (e.key === "Escape") onClose(); }} /></div>
          <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">{items.map((it, n) => (
            <li key={it.k} role="option" aria-selected={n === i}><button onMouseEnter={() => setI(n)} onClick={() => pick(n)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${n === i ? "bg-gradient-to-r from-violet-600/50 to-fuchsia-600/40" : ""}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[.07] text-violet-200"><Icon n={it.icon} className="h-[18px] w-[18px]" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm text-ivory">{it.label}</span><span className="block truncate text-xs text-ivory/45">{it.hint}</span></span>{n === i && <span className="text-xs text-ivory/40">↵</span>}</button></li>))}
            {!items.length && <li className="px-4 py-10 text-center text-sm text-ivory/40">No results for “{q}”</li>}</ul>
        </motion.div></motion.div>)}</AnimatePresence>
  );
}
