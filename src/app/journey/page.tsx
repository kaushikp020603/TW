"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell, { field } from "@/components/PageShell";
import { MAJOR_ARCANA } from "@/data/tarot";
import { SPREADS, type SpreadKey } from "@/data/spreads";
import { MOODS } from "@/lib/mystic";
import { openAuth, useUser } from "@/lib/useUser";

type Reading = { at: number; spread: SpreadKey; category: string; question: string; cards: { id: number; reversed: boolean }[] };
type Entry = { id: string; at: number; text: string; mood?: string };
const JK = "arcana-journal";

function icsFor(time: string) {
  const [h, m] = time.split(":"); const d = new Date(); const pad = (n: number | string) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Spill the Cards//Daily Card//EN", "BEGIN:VEVENT", `UID:arcana-daily-${Date.now()}@arcana`, `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, "DURATION:PT10M", "RRULE:FREQ=DAILY",
    "SUMMARY:Draw your card of the day ✦ Spill the Cards", `DESCRIPTION:Take a breath and draw your free daily card: ${location.origin}/reading`, `URL:${location.origin}/reading`, "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:Your card of the day is waiting", "END:VALARM", "END:VEVENT", "END:VCALENDAR"];
  return lines.join("\r\n");
}

export default function Journey() {
  const { user } = useUser();
  const [readings, setReadings] = useState<Reading[]>([]); const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState(""); const [mood, setMood] = useState(""); const [time, setTime] = useState("08:00");

  const load = useCallback(async () => {
    let rs: Reading[] = []; let es: Entry[] = [];
    try { rs = (JSON.parse(localStorage.getItem("arcana-readings") || "[]") as Reading[]); es = JSON.parse(localStorage.getItem(JK) || "[]"); } catch {}
    if (user) {
      const jr = await fetch("/api/readings").then((r) => r.json()).catch(() => ({ readings: [] }));
      const seen = new Set(rs.map((r) => r.at));
      rs = [...rs, ...(jr.readings || []).filter((x: { created: number }) => !seen.has(x.created)).map((x: { created: number; spread: SpreadKey; category: string; question: string; cards: string }) => ({ at: x.created, spread: x.spread, category: x.category, question: x.question, cards: JSON.parse(x.cards) }))];
      const je = await fetch("/api/site?q=journal").then((r) => r.json()).catch(() => ({ entries: [] }));
      es = [...es.filter((e) => e.id.startsWith("l")), ...(je.entries || []).map((e: { id: number; created: number; text: string; mood: string }) => ({ id: "s" + e.id, at: e.created, text: e.text, mood: e.mood }))];
    }
    setReadings(rs); setEntries(es);
  }, [user]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!text.trim()) return;
    if (user) await fetch("/api/site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "journal_add", text, mood }) });
    else { const es: Entry[] = [{ id: "l" + Date.now(), at: Date.now(), text, mood }, ...entries.filter((x) => x.id.startsWith("l"))]; localStorage.setItem(JK, JSON.stringify(es)); }
    setText(""); setMood(""); load();
  }
  async function del(en: Entry) {
    if (en.id.startsWith("s")) await fetch("/api/site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "journal_delete", id: Number(en.id.slice(1)) }) });
    else localStorage.setItem(JK, JSON.stringify(entries.filter((x) => x.id.startsWith("l") && x.id !== en.id)));
    load();
  }

  const timeline = useMemo(() => [...readings.map((r) => ({ at: r.at, kind: "reading" as const, r })), ...entries.map((e) => ({ at: e.at, kind: "note" as const, e }))].sort((a, b) => b.at - a.at), [readings, entries]);
  const themes = useMemo(() => {
    const count = new Map<number, number>(); let rev = 0, total = 0; const cats = new Map<string, number>();
    for (const r of readings) { cats.set(r.category, (cats.get(r.category) || 0) + 1); for (const c of r.cards) { count.set(c.id, (count.get(c.id) || 0) + 1); total++; if (c.reversed) rev++; } }
    return { top: [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3), revPct: total ? Math.round((rev / total) * 100) : 0, cat: [...cats.entries()].sort((a, b) => b[1] - a[1])[0]?.[0], total };
  }, [readings]);

  return (
    <PageShell eyebrow="Journal · Timeline · Reminders" title={<>My <span className="gold-text italic">journey</span></>} intro={user ? "Your private notes and saved readings, in one timeline." : "Notes are kept on this device. Create a free account to keep them on every device."}>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <form onSubmit={add} className="glass frame space-y-4 p-6">
            <p className="eyebrow">Journal</p>
            <textarea className={field} rows={3} aria-label="Journal entry" placeholder="What came up for you today? What did a card stir?" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Mood">{MOODS.map((m) => <button type="button" key={m.id} aria-pressed={mood === m.id} onClick={() => setMood(mood === m.id ? "" : m.id)} className={`rounded-full border px-4 py-2.5 text-xs ${mood === m.id ? "border-gold bg-gold text-midnight" : "border-gold/30"}`}>{m.emoji} {m.label}</button>)}</div>
            <div className="flex items-center gap-4"><button className="btn btn-solid">Add note</button>{!user && <button type="button" className="text-xs uppercase tracking-[.2em] text-gold underline" onClick={() => openAuth("register")}>Sync across devices</button>}</div>
          </form>

          <div><p className="eyebrow mb-4">Timeline</p>
            <ol className="relative space-y-4 border-l border-gold/30 pl-6">
              {timeline.map((t, i) => (
                <li key={i} className="relative"><span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_10px_#d6b36d]" />
                  <p className="text-xs text-ivory/50">{new Date(t.at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                  {t.kind === "reading" ? (<div className="glass p-4"><p className="text-champagne">{SPREADS[t.r.spread]?.label} · {t.r.category}</p>{t.r.question && <p className="text-sm italic text-ivory/60">“{t.r.question}”</p>}<p className="text-sm font-light text-ivory/80">{t.r.cards.map((c) => `${MAJOR_ARCANA[c.id].name}${c.reversed ? " (r)" : ""}`).join(" · ")}</p></div>)
                    : (<div className="glass p-4"><p className="whitespace-pre-line text-sm font-light text-ivory/90">{t.e.text}</p><p className="mt-2 flex gap-4 text-xs text-ivory/50">{t.e.mood && <span>{MOODS.find((m) => m.id === t.e.mood)?.emoji} {MOODS.find((m) => m.id === t.e.mood)?.label}</span>}<button className="text-lavender hover:text-gold" onClick={() => del(t.e)}>Delete</button></p></div>)}
                </li>))}
              {!timeline.length && <li className="text-sm text-ivory/50">Nothing yet. Pull a card and save the reading, or write your first note.</li>}
            </ol></div>
        </div>

        <aside className="space-y-6">
          <div className="glass frame p-6"><p className="eyebrow">Your themes</p>
            {themes.total ? (<div className="mt-3 space-y-2 text-sm font-light text-ivory/85">
              <p>Cards that keep returning: <b className="text-champagne">{themes.top.map(([id, n]) => `${MAJOR_ARCANA[id].name} ×${n}`).join(", ")}</b></p>
              <p>Most explored area: <b className="text-champagne">{themes.cat}</b></p><p>Reversed cards: <b className="text-champagne">{themes.revPct}%</b> of your draws</p>
              <p className="pt-2 text-xs text-ivory/55">Repeating cards can be worth noticing. What do {MAJOR_ARCANA[themes.top[0][0]].keywords.split(" · ").slice(0, 2).join(" and ")} mean to you right now?</p></div>) : <p className="mt-2 text-sm font-light text-ivory/60">Save a few readings and your recurring themes will appear here.</p>}</div>
          <div className="glass frame p-6"><p className="eyebrow">Daily card reminder</p>
            <p className="mt-2 text-sm font-light text-ivory/75">Download a repeating calendar reminder. It works in Google, Apple and Outlook calendars, even when this site is closed.</p>
            <div className="mt-3 flex items-center gap-3"><input type="time" aria-label="Reminder time" value={time} onChange={(e) => setTime(e.target.value)} className={`${field} !w-auto`} />
              <button className="btn" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([icsFor(time)], { type: "text/calendar" })); a.download = "arcana-daily-card.ics"; a.click(); }}>Add reminder</button></div></div>
        </aside>
      </div>
    </PageShell>
  );
}
