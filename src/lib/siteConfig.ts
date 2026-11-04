// Shared (client + server) shape of the admin-controlled "experience" settings.
export type MusicMode = "preset" | "media" | "url" | "off";
export type Preset = "moonlit" | "bells" | "space";
export type IntroStyle = "off" | "quick" | "short" | "full";

export type SiteConfig = {
  music: { mode: MusicMode; preset: Preset; url: string; mediaId: number | null; mediaName: string; volume: number };
  intro: { style: IntroStyle };
};

export const DEFAULT_CONFIG: SiteConfig = {
  music: { mode: "preset", preset: "moonlit", url: "", mediaId: null, mediaName: "", volume: 50 },
  intro: { style: "short" },
};

export const PRESET_LIST: { id: Preset; label: string; hint: string }[] = [
  { id: "moonlit", label: "Moonlit pad", hint: "Warm, slowly shifting chords" },
  { id: "bells", label: "Temple bells", hint: "Soft, sparse chimes with echo" },
  { id: "space", label: "Deep space", hint: "Low, drifting drone" },
];
/** Speed multiplier applied to the base intro timeline (full ≈ 8 s). */
export const INTRO_SPEED: Record<Exclude<IntroStyle, "off">, number> = { full: 1, short: 4.2, quick: 6.5 };
export const INTRO_LABEL: Record<IntroStyle, string> = { off: "No intro", quick: "Quick · ~2 s", short: "Short · ~3 s", full: "Full · ~8 s" };

export function sanitizeConfig(raw: unknown): SiteConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as { music?: Partial<SiteConfig["music"]>; intro?: Partial<SiteConfig["intro"]> };
  const m = r.music ?? {}; const d = DEFAULT_CONFIG.music;
  const mode: MusicMode = (["preset", "media", "url", "off"] as const).includes(m.mode as MusicMode) ? (m.mode as MusicMode) : d.mode;
  const preset: Preset = PRESET_LIST.some((p) => p.id === m.preset) ? (m.preset as Preset) : d.preset;
  let url = String(m.url ?? "").trim().slice(0, 500); if (!/^https?:\/\//i.test(url)) url = "";
  const mediaId = Number.isInteger(Number(m.mediaId)) && Number(m.mediaId) > 0 ? Number(m.mediaId) : null;
  const volume = Math.min(100, Math.max(0, Math.round(Number(m.volume ?? d.volume))));
  const style: IntroStyle = (["off", "quick", "short", "full"] as const).includes(r.intro?.style as IntroStyle) ? (r.intro!.style as IntroStyle) : DEFAULT_CONFIG.intro.style;
  // a mode that points at nothing falls back to the built-in track
  const eff: MusicMode = mode === "url" && !url ? "preset" : mode === "media" && !mediaId ? "preset" : mode;
  return { music: { mode: eff, preset, url, mediaId, mediaName: String(m.mediaName ?? "").slice(0, 120), volume: Number.isFinite(volume) ? volume : d.volume }, intro: { style } };
}
