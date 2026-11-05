"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SERVICES, SITE, waLink, IMG } from "@/config/site";
import { openAuth, useUser } from "@/lib/useUser";
import PayBox from "./PayBox";
import { confetti } from "@/lib/confetti";
import { track, trackOnce } from "@/lib/track";

type Svc = { id: string; name: string; price: number; mins: string; blurb: string; kind?: string; sessions?: number };
type Slot = { time: string; available: boolean; priority?: boolean };
type Bk = { code: string; service_name: string; price: number; discount: number; date: string; time: string; status: string; name?: string; kind?: string; meeting_link?: string | null; has_summary?: number };
const KEY = "arcana-codes";

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const label = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const STATUS_STYLE: Record<string, string> = { pending: "text-champagne", confirmed: "text-emerald-300", cancelled: "text-red-300", rejected: "text-red-300", completed: "text-lavender" };

function useSlots(date: string, bump = 0) {
  const [slots, setSlots] = useState<Slot[]>([]); const [hidden, setHidden] = useState(false); const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!date) return;
    let live = true;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`/api/public?q=slots&date=${date}`).then((r) => r.json()).then((j) => { if (live) { setSlots(j.slots || []); setHidden(!!j.priorityHidden); setLoading(false); } }).catch(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [date, bump]);
  return { slots, hidden, loading };
}

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { const q = matchMedia("(max-width: 639px)"); const f = () => setM(q.matches); f(); q.addEventListener("change", f); return () => q.removeEventListener("change", f); }, []);
  return m;
}

export default function Booking() {
  const { user } = useUser();
  const [dates, setDates] = useState<string[]>([]);
  const [services, setServices] = useState<Svc[]>(SERVICES.map((s) => ({ ...s })));
  const [service, setService] = useState("three");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [note, setNote] = useState("");
  const [code, setCode] = useState(""); const [cp, setCp] = useState<{ discount: number; code: string } | null>(null); const [cpMsg, setCpMsg] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [done, setDone] = useState<Bk | null>(null);
  const [mine, setMine] = useState<Bk[]>([]);
  const [bump, setBump] = useState(0);
  const { slots, hidden: priorityHidden, loading: slotsLoading } = useSlots(date, bump);
  const mobile = useIsMobile(); const [step, setStep] = useState(1); const [inView, setInView] = useState(false); const secRef = useRef<HTMLElement>(null);
  const vis = (n: number) => (mobile && step !== n ? "hidden" : "");
  useEffect(() => { const el = secRef.current; if (!el) return; const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 }); io.observe(el); return () => io.disconnect(); }, []);
  const stickyOn = mobile && inView;
  useEffect(() => { document.body.classList.toggle("has-sticky-bar", stickyOn); return () => document.body.classList.remove("has-sticky-bar"); }, [stickyOn]);
  const goStep = (n: number) => { setStep(n); secRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const [acct, setAcct] = useState<{ premium: boolean; credits: number; refCode?: string; refPercent?: number }>({ premium: false, credits: 0 }); const [useCredit, setUseCredit] = useState(false); const [pkgMsg, setPkgMsg] = useState<{ text: string; wa: string } | null>(null);

  useEffect(() => {
    const t = new Date(); if (t.getHours() >= 20) t.setDate(t.getDate() + 1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDates(Array.from({ length: 14 }, (_, i) => { const d = new Date(t); d.setDate(t.getDate() + i); return iso(d); }));
    setDate(iso(t));
    fetch("/api/public?q=services").then((r) => r.json()).then((j) => j.services?.length && setServices(j.services)).catch(() => {});
    const ref = new URLSearchParams(location.search).get("ref"); if (ref && /^ARC-[A-Z0-9]{5}$/i.test(ref)) setCode(ref.toUpperCase());
    const h = (e: Event) => { const id = (e as CustomEvent).detail?.serviceId; if (id) setService(id); };
    addEventListener("arcana:book", h); return () => removeEventListener("arcana:book", h);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!user) { setAcct({ premium: false, credits: 0 }); return; } fetch("/api/site?q=account").then((r) => r.json()).then((j) => setAcct({ premium: !!j.premium, credits: j.credits || 0, refCode: j.refCode, refPercent: j.refPercent })).catch(() => {}); }, [user, done]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (user) { setName((n) => n || user.name); setPhone((p) => p || user.phone || ""); } }, [user]);

  const loadMine = useCallback(async () => {
    let list: Bk[] = [];
    if (user) list = (await fetch("/api/bookings").then((r) => r.json())).bookings || [];
    let codes: string[] = []; try { codes = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch {}
    const seen = new Set(list.map((b) => b.code));
    for (const c of codes) if (!seen.has(c)) { const j = await fetch(`/api/bookings?code=${c}`).then((r) => r.json()).catch(() => null); if (j?.bookings?.[0]) list.push(j.bookings[0]); }
    setMine(list);
  }, [user]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMine(); }, [loadMine]);

  const svc = services.find((s) => s.id === service) ?? services[0];
  const bookable = services.filter((x) => x.kind !== "package"); const packages = services.filter((x) => x.kind === "package");
  const discount = useCredit ? (svc?.price ?? 0) : cp?.discount ?? 0;
  const final = (svc?.price ?? 0) - discount;
  const ready = !!time && name.trim().length > 1 && !!svc;

  async function applyCoupon() {
    setCpMsg(""); setCp(null);
    const j = await fetch(`/api/bookings?coupon=${encodeURIComponent(code)}&service=${service}`).then((r) => r.json());
    if (j.valid) { setCp({ discount: j.discount, code: code.toUpperCase() }); setCpMsg(`Applied: you save ${inr(j.discount)}`); } else setCpMsg("That code isn't valid.");
  }
  async function submit() {
    setBusy(true); setErr("");
    const r = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ serviceId: service, date, time, name, phone, note, coupon: useCredit ? undefined : cp?.code, useCredit }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setErr(j.error || "Could not save your request."); setBump((b) => b + 1); setTime(""); return; }
    try { const c = JSON.parse(localStorage.getItem(KEY) || "[]"); localStorage.setItem(KEY, JSON.stringify([j.booking.code, ...c].slice(0, 12))); } catch {}
    track("booking_submit"); confetti(0.5, 0.3);
    setDone(j.booking); setStep(1); setTime(""); setBump((b) => b + 1); loadMine();
  }
  async function buyPackage(p: Svc) {
    if (!user) { openAuth("register"); return; }
    const r = await fetch("/api/site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "buy_package", serviceId: p.id }) });
    if (r.ok) setPkgMsg({ text: `${p.name} ordered (${inr(p.price)}). Send the message on WhatsApp to pay. Your ${p.sessions} credits are added as soon as payment is confirmed.`, wa: waLink(`Hi! I'd like to buy the ${p.name} (${inr(p.price)}) on Spill the Cards. Please share payment details. Account: ${user.email}`) });
  }
  const waText = (b: Bk) => `Hi! I'd like to confirm my tarot booking.\n\nRef: ${b.code}\nService: ${b.service_name} (${inr(b.price - b.discount)})\nDate: ${label(b.date)}\nTime: ${b.time}\nName: ${b.name ?? name}\n\nPlease confirm and share payment details. Thank you!`;

  return (
    <section id="book" ref={secRef} className="relative isolate overflow-hidden px-5 py-28 sm:px-8" aria-labelledby="book-h">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG.lavender} alt="" aria-hidden loading="lazy" className="absolute right-0 top-0 -z-10 hidden h-full w-[42%] object-cover object-[60%_20%] opacity-30 [mask-image:linear-gradient(270deg,#000,transparent)] lg:block" />
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Personal consultation</p>
          <h2 id="book-h" className="h-hero text-[clamp(2rem,5.5vw,4.2rem)]">Book your <span className="gold-text italic">reading</span></h2>
          <p className="mt-5 font-light text-ivory/80">Choose a service and a free slot. We save your request, then you send it on WhatsApp. Your slot is confirmed once she replies, and payment is arranged directly there.{!user && <> <button className="text-gold underline underline-offset-4" onClick={() => openAuth("register")}>Create an account</button> to keep your bookings together, or just book as a guest.</>}</p>
        </div>

        {done ? (
          <div className="glass frame mt-12 max-w-2xl space-y-4 p-8" role="status">
            <p className="eyebrow">Request saved</p>
            <h3 className="font-display text-3xl text-champagne">Reference {done.code}</h3>
            <p className="font-light text-ivory/85">{done.service_name} · {label(done.date)} · {done.time}<br />Total {inr(done.price - done.discount)}{done.discount ? ` (saved ${inr(done.discount)})` : ""}</p>
            {(done.kind === "video" || done.kind === "voice") && <p className="text-sm text-champagne">A {done.kind} meeting link is shared here and on WhatsApp once she confirms.</p>}
            <p className="text-sm font-light text-ivory/70">One last step: send this on WhatsApp so she can confirm your slot. It isn&apos;t confirmed until she replies.</p>
            <div className="flex flex-wrap gap-3">
              <a className="btn btn-solid" href={waLink(waText({ ...done, name }))} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>
              <button className="btn" onClick={() => setDone(null)}>Book another</button>
            </div>
            <PayBox amount={done.price - done.discount} code={done.code} service={done.service_name} />
          </div>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            {mobile && (
              <div className="-mb-2" aria-label={`Step ${step} of 3`}>
                <div className="flex gap-1.5">{[1, 2, 3].map((n) => <span key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= step ? "bg-gold" : "bg-gold/20"}`} />)}</div>
                <p className="eyebrow mt-3">Step {step} of 3 · {["Choose a service", "Pick a date and time", "Your details"][step - 1]}</p>
              </div>
            )}
            <div className={`space-y-10 ${mobile && step === 3 ? "hidden" : ""}`}>
              <fieldset className={vis(1)}>
                <legend className="eyebrow mb-4">1 · Service</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {bookable.map((s) => (
                    <button key={s.id} onClick={() => { setService(s.id); setCp(null); setCpMsg(""); trackOnce("booking_start"); }} aria-pressed={service === s.id}
                      className={`glass p-4 text-left transition ${service === s.id ? "!border-gold bg-gold/15" : "hover:!border-gold/60"}`}>
                      <span className="flex items-baseline justify-between gap-2"><span className="font-display text-xl text-champagne">{s.name}</span><span className="text-sm text-gold">{inr(s.price)}</span></span>
                      <span className="mt-1 block text-xs font-light text-ivory/60">{s.kind === "video" ? "📹 " : s.kind === "voice" ? "🎧 " : ""}{s.mins} · {s.blurb}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className={vis(2)}>
                <legend className="eyebrow mb-4">2 · Date</legend>
                <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
                  {dates.map((d) => <button key={d} onClick={() => { setDate(d); setTime(""); trackOnce("booking_start"); }} aria-pressed={date === d} className={`shrink-0 border px-4 py-3 text-sm transition ${date === d ? "border-gold bg-gold text-midnight" : "border-gold/30 hover:border-gold"}`}>{label(d)}</button>)}
                </div>
              </fieldset>
              <fieldset className={vis(2)}>
                <legend className="eyebrow mb-4">3 · Time</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {slotsLoading && !slots.length && Array.from({ length: 8 }).map((_, i) => <span key={i} aria-hidden className="h-[46px] animate-pulse rounded-sm bg-gold/10" />)}
                  {slots.map((s) => <button key={s.time} disabled={!s.available} onClick={() => { setTime(s.time); trackOnce("booking_start"); }} aria-pressed={time === s.time}
                    className={`border px-3 py-3 text-sm transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-30 ${time === s.time ? "border-gold bg-gold text-midnight" : "border-gold/30 hover:border-gold"}`}>{s.priority ? "★ " : ""}{s.time}</button>)}
                </div>
                {priorityHidden && <p className="mt-2 text-xs text-lavender">Premium members also get early and late priority slots.</p>}
                {slots.length > 0 && slots.every((s) => !s.available) && <div className="mt-3 space-y-3"><p className="text-sm text-champagne">This day is fully booked. Please choose another date, or join the waitlist and the reader will message you if a slot opens.</p><Waitlist date={date} serviceId={service} defaultName={name} /></div>}
              </fieldset>
            </div>

            <div className={`space-y-6 ${vis(3)}`}>
              <div className="glass frame space-y-5 p-6 sm:p-8">
                <p className="eyebrow">4 · Your details</p>
                <div><label htmlFor="nm" className="mb-1 block text-xs text-ivory/60">Name</label><input id="nm" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full border border-gold/30 bg-midnight/95 p-3 font-light" /></div>
                <div><label htmlFor="ph" className="mb-1 block text-xs text-ivory/60">WhatsApp number (optional)</label><input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="w-full border border-gold/30 bg-midnight/95 p-3 font-light" /></div>
                <div><label htmlFor="nt" className="mb-1 block text-xs text-ivory/60">Anything she should know? (optional)</label><textarea id="nt" value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} rows={2} className="w-full border border-gold/30 bg-midnight/95 p-3 font-light" /></div>
                {acct.credits > 0 && <label className="flex items-center gap-2 text-sm text-champagne"><input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} /> Use 1 package credit ({acct.credits} left)</label>}
                {acct.premium && <p className="text-xs text-lavender">★ Premium member: priority slots unlocked</p>}
                <div>
                  <label htmlFor="cp" className="mb-1 block text-xs text-ivory/60">Coupon code</label>
                  <div className="flex gap-2"><input id="cp" value={code} onChange={(e) => setCode(e.target.value)} className="min-w-0 flex-1 border border-gold/30 bg-midnight/95 p-3 font-light uppercase" /><button type="button" className="btn !px-4" onClick={applyCoupon} disabled={!code || useCredit}>Apply</button></div>
                  {cpMsg && <p className={`mt-1 text-xs ${cp ? "text-emerald-300" : "text-red-300"}`}>{cpMsg}</p>}
                </div>
                <div className="border-t border-gold/20 pt-4 text-sm font-light text-ivory/80">
                  <p>{svc?.name}</p><p>{date && label(date)}{time && ` · ${time}`}</p>
                  <p className="mt-1 font-display text-2xl text-champagne">{inr(final)} {discount > 0 && <span className="text-sm text-ivory/50 line-through">{inr(svc.price)}</span>}</p>
                </div>
                {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
                <button className="btn btn-solid w-full disabled:cursor-not-allowed disabled:opacity-40" disabled={!ready || busy} onClick={submit}>{busy ? "Saving…" : "Reserve this slot"}</button>
                <a className="block py-3 text-center text-xs uppercase tracking-[.2em] text-lavender hover:text-gold" href={waLink("Hi! I have a question before booking.")} target="_blank" rel="noopener noreferrer">Or just chat · {SITE.whatsappDisplay}</a>
              </div>
            </div>
          </div>
        )}

        {stickyOn && !done && (
          <div className="fixed inset-x-0 bottom-0 z-[66] border-t border-gold/40 bg-midnight px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,.6)]" role="region" aria-label="Booking summary">
            <div className="mx-auto flex max-w-md items-center gap-3">
              <div className="min-w-0 flex-1"><p className="truncate text-xs text-ivory/60">{svc?.name}{date && time ? ` · ${label(date)} ${time}` : ""}</p><p className="font-display text-2xl text-champagne">{inr(final)}</p></div>
              {step > 1 && <button className="btn !px-4 !py-2.5" onClick={() => goStep(step - 1)}>Back</button>}
              {step < 3 ? <button className="btn btn-solid !px-5 !py-2.5 disabled:opacity-40" disabled={step === 2 && !time} onClick={() => goStep(step + 1)}>Next</button>
                : <button className="btn btn-solid !px-5 !py-2.5 disabled:opacity-40" disabled={!ready || busy} onClick={submit}>{busy ? "Saving…" : "Reserve"}</button>}
            </div>
          </div>
        )}

        {packages.length > 0 && (
          <div className="mt-16" aria-labelledby="pk-h">
            <p id="pk-h" className="eyebrow mb-4">Reading packages · save when you buy together</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {packages.map((p) => (
                <div key={p.id} className="glass frame p-6"><h3 className="font-display text-2xl text-champagne">{p.name}</h3><p className="mt-1 text-sm font-light text-ivory/70">{p.blurb}</p>
                  <p className="mt-3 font-display text-3xl text-gold">{inr(p.price)}</p><button className="btn mt-4" onClick={() => buyPackage(p)}>{user ? "Order package" : "Sign in to order"}</button></div>))}
            </div>
            {pkgMsg && <div className="glass mt-4 p-5 text-sm font-light" role="status"><p>{pkgMsg.text}</p><a className="btn btn-solid mt-3" href={pkgMsg.wa} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a></div>}
          </div>
        )}

        {mine.length > 0 && <MyBookings list={mine} reload={loadMine} />}

        {user && acct.refCode && (
          <div className="glass frame mt-12 flex flex-wrap items-center gap-5 p-6 sm:p-8" aria-label="Invite a friend">
            <div className="min-w-0 flex-1"><p className="eyebrow">Invite a friend</p><p className="font-display mt-1 text-2xl text-champagne">They get {acct.refPercent ?? 10}% off. You get a free session.</p>
              <p className="mt-1 text-sm font-light text-ivory/65">Share your code. When their first reading is completed, a session credit lands in your account.</p></div>
            <div className="flex flex-col items-start gap-2"><code className="rounded-lg border border-gold/40 bg-midnight px-4 py-2 font-display text-2xl tracking-[.2em] text-gold">{acct.refCode}</code>
              <div className="flex gap-2"><button className="btn !py-2" onClick={async () => { await navigator.clipboard?.writeText(`${location.origin}/?ref=${acct.refCode}`).catch(() => {}); }}>Copy link</button>
                <a className="btn btn-solid !py-2" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`I love my tarot readings at Spill the Cards ✦ Use my code ${acct.refCode} for ${acct.refPercent ?? 10}% off your first reading: ${location.origin}/?ref=${acct.refCode}`)}`}>Share on WhatsApp</a></div></div>
          </div>
        )}
      </div>
    </section>
  );
}

function Waitlist({ date, serviceId, defaultName }: { date: string; serviceId: string; defaultName: string }) {
  const [name, setName] = useState(defaultName); const [contact, setContact] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function join(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "waitlist", date, name, contact, serviceId }) }); const j = await r.json();
    setMsg({ ok: r.ok, t: j.message || j.error });
  }
  return (
    <form onSubmit={join} className="flex flex-wrap items-start gap-2" aria-label="Join the waitlist">
      <input aria-label="Your name" required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1 basis-40 border border-gold/30 bg-midnight/95 p-3 text-sm font-light" />
      <input aria-label="WhatsApp number or email" required placeholder="WhatsApp number or email" value={contact} onChange={(e) => setContact(e.target.value)} className="min-w-0 flex-1 basis-52 border border-gold/30 bg-midnight/95 p-3 text-sm font-light" />
      <button className="btn !py-3">Join waitlist</button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`basis-full text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.t}</p>}
    </form>
  );
}

function MyBookings({ list, reload }: { list: Bk[]; reload: () => void }) {
  const [edit, setEdit] = useState<string | null>(null);
  const [d, setD] = useState(""); const [t, setT] = useState(""); const [msg, setMsg] = useState(""); const [payFor, setPayFor] = useState<string | null>(null);
  const { slots } = useSlots(edit ? d : "");
  const patch = async (b: object) => {
    const r = await fetch("/api/bookings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); const j = await r.json();
    setMsg(r.ok ? "Updated." : j.error || "Failed."); if (r.ok) { setEdit(null); reload(); }
  };
  return (
    <div className="glass mt-16 p-6 sm:p-8" aria-labelledby="mb-h">
      <p id="mb-h" className="eyebrow mb-4">My bookings</p>
      <ul className="space-y-4">
        {list.map((b) => (
          <li key={b.code} className="border-b border-gold/15 pb-4 text-sm font-light">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-display text-xl text-champagne">{b.service_name}</span>
              <span className={`text-xs uppercase tracking-[.2em] ${STATUS_STYLE[b.status] || ""}`}>{b.status}</span>
            </div>
            <p className="text-ivory/65">{label(b.date)} · {b.time} · Ref {b.code} · {inr(b.price - b.discount)}</p>
            {b.status === "confirmed" && b.meeting_link && <a className="btn btn-solid mt-2 !py-2" href={b.meeting_link} target="_blank" rel="noopener noreferrer">Join your {b.kind === "voice" ? "voice" : "video"} session</a>}
            {["pending", "confirmed"].includes(b.status) && (
              <p className="mt-2 flex flex-wrap gap-4 text-xs uppercase tracking-[.15em]">
                <a className="text-lavender hover:text-gold" target="_blank" rel="noopener noreferrer" href={waLink(`Hi! Regarding my booking ${b.code} (${b.service_name}, ${label(b.date)} ${b.time}).`)}>Message on WhatsApp</a>
                {b.has_summary ? <a className="text-gold hover:text-champagne" href={`/summary/${b.code}`}>View my summary</a> : null}
                {b.status === "pending" && <button className="text-gold hover:text-champagne" onClick={() => setPayFor(payFor === b.code ? null : b.code)}>Pay now</button>}
                <button className="text-lavender hover:text-gold" onClick={() => { setEdit(edit === b.code ? null : b.code); setD(b.date); setT(""); setMsg(""); }}>Reschedule</button>
                <button className="text-lavender hover:text-gold" onClick={() => confirm("Cancel this booking?") && patch({ code: b.code, action: "cancel" })}>Cancel</button>
              </p>
            )}
            {payFor === b.code && <PayBox amount={b.price - b.discount} code={b.code} service={b.service_name} />}
            {edit === b.code && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input type="date" aria-label="New date" value={d} min={iso(new Date())} onChange={(e) => { setD(e.target.value); setT(""); }} className="border border-gold/30 bg-midnight/95 p-2" />
                <select aria-label="New time" value={t} onChange={(e) => setT(e.target.value)} className="border border-gold/30 bg-midnight/95 p-2"><option value="">Time…</option>{slots.filter((s) => s.available).map((s) => <option key={s.time}>{s.time}</option>)}</select>
                <button className="btn !py-2" disabled={!t} onClick={() => patch({ code: b.code, action: "reschedule", date: d, time: t })}>Confirm new time</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {msg && <p className="mt-3 text-xs text-champagne" role="status">{msg}</p>}
    </div>
  );
}
