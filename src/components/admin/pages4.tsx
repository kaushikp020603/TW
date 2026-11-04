/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge, Btn, Card, Icon, Label, Segmented, ago, field, useUi } from "./ui";
import { useAdmin } from "./ctx";
import { INTRO_LABEL, PRESET_LIST, sanitizeConfig, type IntroStyle, type MusicMode, type SiteConfig } from "@/lib/siteConfig";
import { playPreview, stopPreview } from "@/lib/ambient";

const INTRO_INFO: Record<IntroStyle, string> = {
  off: "Visitors go straight to the site.",
  quick: "A star, the moon and the name, in about two seconds.",
  short: "The full story in miniature: star, galaxy, moon, cards and the name. About 3 seconds. Recommended.",
  full: "The original slow cinematic opening, about 8 seconds.",
};
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function ExperiencePage() {
  const { d, act, reload } = useAdmin(); const { toast } = useUi();
  const [cfg, setCfg] = useState<SiteConfig>(d.config);
  const [playing, setPlaying] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(sanitizeConfig(cfg)) !== JSON.stringify(d.config);
  useEffect(() => () => stopPreview(), []);

  const setMusic = (p: Partial<SiteConfig["music"]>) => { setCfg((c) => ({ ...c, music: { ...c.music, ...p } })); if (playing) { stopPreview(); setPlaying(null); } };
  const preview = (key: string, m: SiteConfig["music"]) => {
    if (playing === key) { stopPreview(); setPlaying(null); return; }
    if (m.mode === "off") return;
    playPreview(m); setPlaying(key);
  };
  const cur = cfg.music;
  const mediaOf = (id: number | null) => d.media.find((x: any) => x.id === id);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast(`That file is ${kb(file.size)}. The maximum is 3 MB.`, "err"); return; }
    setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/admin/media", { method: "POST", body: fd }); const j = await r.json().catch(() => ({}));
    setBusy(false); if (fileRef.current) fileRef.current.value = "";
    if (!r.ok) { toast(j.error || "Upload failed", "err"); return; }
    toast("Uploaded. Press Save to make it the site song"); await reload();
    setMusic({ mode: "media", mediaId: j.media.id, mediaName: j.media.name });
  }

  const modeOpts: { v: MusicMode; label: string }[] = [{ v: "preset", label: "Built-in" }, { v: "media", label: "My song" }, { v: "url", label: "Link" }, { v: "off", label: "No music" }];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl">Music & intro</h1><p className="mt-1 text-sm text-ivory/50">Choose the song visitors can play and how the opening animation behaves.</p></div>
        <AnimatePresence>{dirty && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
          <Btn onClick={() => { stopPreview(); setPlaying(null); setCfg(d.config); }}>Discard</Btn>
          <Btn v="primary" icon="check" onClick={async () => { stopPreview(); setPlaying(null); await act({ action: "saveConfig", config: cfg }, "Saved. Live on the site"); }}>Save changes</Btn></motion.div>}</AnimatePresence>
      </div>

      <Card title="Background music" delay={0.02}>
        <p className="mb-4 text-sm text-ivory/50">Music never starts on its own. Visitors tap the sound button, and it stays off until they do.</p>
        <Segmented label="music source" value={cur.mode} onChange={(v) => setMusic({ mode: v })} options={modeOpts} />

        <AnimatePresence mode="wait"><motion.div key={cur.mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mt-5">
          {cur.mode === "preset" && (
            <div className="grid gap-3 sm:grid-cols-3">{PRESET_LIST.map((p) => {
              const on = cur.preset === p.id; const key = "p-" + p.id;
              return (
                <div key={p.id} role="radio" aria-checked={on} tabIndex={0} onClick={() => setMusic({ preset: p.id })} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setMusic({ preset: p.id })}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${on ? "border-fuchsia-400/60 bg-gradient-to-br from-violet-600/25 to-fuchsia-600/15 shadow-[0_8px_30px_rgba(168,85,247,.2)]" : "border-white/10 bg-white/[.03] hover:border-white/25"}`}>
                  <div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[.08] text-violet-200"><Icon n="sparkle" /></span>{on && <Badge tone="violet">selected</Badge>}</div>
                  <p className="mt-3 font-display text-xl">{p.label}</p><p className="text-sm text-ivory/50">{p.hint}</p>
                  <Btn size="sm" className="mt-3" icon={playing === key ? "close" : "sound"} onClick={(e) => { e.stopPropagation(); preview(key, { ...cur, mode: "preset", preset: p.id }); }}>{playing === key ? "Stop" : "Listen"}</Btn>
                </div>);
            })}</div>)}

          {cur.mode === "media" && (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[.02] p-8 text-center transition hover:border-fuchsia-400/50 hover:bg-white/[.04]">
                <motion.span animate={busy ? { rotate: 360 } : { y: [0, -4, 0] }} transition={{ duration: busy ? 1 : 2.5, repeat: Infinity, ease: busy ? "linear" : "easeInOut" }} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300"><Icon n={busy ? "sparkle" : "download"} className={`h-6 w-6 ${busy ? "" : "rotate-180"}`} /></motion.span>
                <span className="text-ivory">{busy ? "Uploading…" : "Choose an audio file to upload"}</span>
                <span className="text-xs text-ivory/45">MP3, M4A, AAC, OGG, WAV or WebM · up to 3 MB · works best as a seamless loop</span>
                <input ref={fileRef} type="file" accept="audio/*" className="sr-only" aria-label="Upload a song" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
              </label>
              {d.media.length > 0 && <ul className="space-y-2">{d.media.map((m: any) => {
                const on = cur.mediaId === m.id; const key = "m-" + m.id;
                return (
                  <li key={m.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${on ? "border-fuchsia-400/50 bg-violet-500/10" : "border-white/10 bg-white/[.03]"}`}>
                    <button onClick={() => setMusic({ mediaId: m.id, mediaName: m.name })} aria-pressed={on} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-fuchsia-400 bg-fuchsia-500" : "border-white/30"}`}>{on && <Icon n="check" className="h-3 w-3 text-white" />}</span>
                      <span className="min-w-0"><span className="block truncate text-sm text-ivory">{m.name}</span><span className="text-xs text-ivory/40">{kb(m.size)} · {ago(m.created)}</span></span></button>
                    <Btn size="sm" icon={playing === key ? "close" : "sound"} onClick={() => preview(key, { ...cur, mode: "media", mediaId: m.id })}>{playing === key ? "Stop" : "Listen"}</Btn>
                    <Btn size="sm" v="danger" icon="trash" aria-label={`Delete ${m.name}`} onClick={async () => { if (playing === key) { stopPreview(); setPlaying(null); } await act({ action: "deleteMedia", id: m.id }, "Song deleted"); if (cur.mediaId === m.id) setCfg((c) => ({ ...c, music: { ...c.music, mode: "preset", mediaId: null, mediaName: "" } })); }} /></li>);
              })}</ul>}
              {cur.mode === "media" && !mediaOf(cur.mediaId) && <p className="text-sm text-amber-300">Upload a song (or pick one above). Until then the built-in track plays.</p>}
            </div>)}

          {cur.mode === "url" && (
            <div className="space-y-3">
              <label className="block"><Label>Link to an audio file</Label><input className={field} inputMode="url" placeholder="https://example.com/my-song.mp3" value={cur.url} onChange={(e) => setMusic({ url: e.target.value })} /></label>
              <p className="text-xs text-ivory/45">Use a direct link to an .mp3 (or similar) file, for example from your own hosting or a cloud drive&apos;s direct-download link. Make sure you have the right to use the music. Pages on a streaming site won&apos;t work.</p>
              <Btn size="sm" icon={playing === "u" ? "close" : "sound"} disabled={!/^https?:\/\//i.test(cur.url)} onClick={() => preview("u", { ...cur, mode: "url" })}>{playing === "u" ? "Stop" : "Listen"}</Btn>
            </div>)}

          {cur.mode === "off" && <p className="rounded-xl bg-white/[.04] p-4 text-sm text-ivory/60">No music. The sound button is hidden from the site.</p>}
        </motion.div></AnimatePresence>

        {cur.mode !== "off" && (
          <div className="mt-6 flex items-center gap-4 border-t border-white/[.07] pt-5">
            <label className="flex flex-1 items-center gap-4"><span className="w-20 text-sm text-ivory/60">Volume</span>
              <input type="range" min={0} max={100} value={cur.volume} aria-label="Volume" onChange={(e) => setMusic({ volume: Number(e.target.value) })} className="h-2 flex-1 cursor-pointer accent-fuchsia-500" /><span className="w-10 text-right text-sm text-ivory">{cur.volume}%</span></label>
          </div>)}
      </Card>

      <Card title="Intro animation" delay={0.08}>
        <p className="mb-4 text-sm text-ivory/50">The opening that plays when someone first arrives. It only plays once per visit, and visitors can always skip it.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Intro style">
          {(["off", "quick", "short", "full"] as IntroStyle[]).map((s) => {
            const on = cfg.intro.style === s;
            return (
              <button key={s} role="radio" aria-checked={on} onClick={() => setCfg({ ...cfg, intro: { style: s } })}
                className={`rounded-2xl border p-4 text-left transition ${on ? "border-fuchsia-400/60 bg-gradient-to-br from-violet-600/25 to-fuchsia-600/15" : "border-white/10 bg-white/[.03] hover:border-white/25"}`}>
                <div className="flex items-center justify-between"><p className="font-display text-xl">{INTRO_LABEL[s].split(" · ")[0]}</p>{s === "short" && <Badge tone="green">recommended</Badge>}</div>
                <p className="text-xs uppercase tracking-[.16em] text-violet-300 [&>span]:normal-case">{INTRO_LABEL[s].includes("·") ? <span className="normal-case tracking-normal">{INTRO_LABEL[s].split(" · ")[1].replace("~", "about ")}</span> : "skips it"}</p>
                <p className="mt-2 text-sm text-ivory/55">{INTRO_INFO[s]}</p></button>);
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a href={`/?intro=preview&style=${cfg.intro.style === "off" ? "short" : cfg.intro.style}`} target="_blank" rel="noreferrer"><Btn icon="external">Preview intro in a new tab</Btn></a>
          <span className="text-xs text-ivory/40">The preview uses the style selected above, even before you save.</span>
        </div>
      </Card>
    </div>
  );
}
