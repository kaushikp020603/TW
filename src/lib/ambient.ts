// Background music engine. Off until the visitor taps the sound button (browsers require a gesture).
// Source is controlled from Admin → Experience: built-in generated tracks, an uploaded song, or a link.
import { DEFAULT_CONFIG, type SiteConfig } from "./siteConfig";

type Music = SiteConfig["music"];
let cfg: Music = DEFAULT_CONFIG.music;
let ctx: AudioContext | null = null;
let on = false;
let stopMain: (() => void) | null = null;
let stopPreviewFn: (() => void) | null = null;
const listeners = new Set<(on: boolean) => void>();
const notify = () => listeners.forEach((l) => l(on));

export const isAmbientOn = () => on;
export const getAmbientMode = () => cfg.mode;
export function onAmbient(fn: (v: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

function audioCtx(): AudioContext {
  if (!ctx) { const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; ctx = new AC(); }
  return ctx;
}
const src = (m: Music) => (m.mode === "media" && m.mediaId ? `/api/media/${m.mediaId}` : m.mode === "url" ? m.url : "");

/** Starts a track and returns a function that fades it out and stops it. */
function start(m: Music): (() => void) | null {
  if (m.mode === "off") return null;
  const level = Math.max(0, Math.min(1, m.volume / 100));

  // ── uploaded file or link: a looping <audio> element
  if (m.mode === "media" || m.mode === "url") {
    const el = new Audio(src(m)); el.loop = true; el.volume = 0; el.preload = "auto";
    el.play().catch(() => {});
    let raf = 0; const t0 = performance.now();
    const fadeIn = () => { const k = Math.min(1, (performance.now() - t0) / 1200); el.volume = level * k; if (k < 1) raf = requestAnimationFrame(fadeIn); };
    raf = requestAnimationFrame(fadeIn);
    return () => {
      cancelAnimationFrame(raf); const v0 = el.volume; const t1 = performance.now();
      const fadeOut = () => { const k = Math.min(1, (performance.now() - t1) / 700); el.volume = v0 * (1 - k); if (k < 1) requestAnimationFrame(fadeOut); else { el.pause(); el.src = ""; } };
      requestAnimationFrame(fadeOut);
    };
  }

  // ── built-in generated tracks (WebAudio, no files needed)
  const c = audioCtx(); c.resume();
  const master = c.createGain(); master.gain.value = 0;
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = m.preset === "space" ? 500 : 1100;
  master.connect(lp).connect(c.destination);
  master.gain.linearRampToValueAtTime(level * 0.9, c.currentTime + 1.4);
  const nodes: { stop?: () => void }[] = []; const timers: number[] = [];

  if (m.preset === "bells") {
    // sparse pentatonic chimes through a feedback echo
    const echo = c.createDelay(1.5); echo.delayTime.value = 0.42; const fb = c.createGain(); fb.gain.value = 0.38; const wet = c.createGain(); wet.gain.value = 0.5;
    echo.connect(fb).connect(echo); echo.connect(wet).connect(master);
    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    const ring = () => {
      const f = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.25 ? 2 : 1);
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2.01;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.22, c.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 3.2);
      const g2 = c.createGain(); g2.gain.value = 0.25;
      o.connect(g); o2.connect(g2).connect(g); g.connect(master); g.connect(echo);
      o.start(); o2.start(); o.stop(c.currentTime + 3.4); o2.stop(c.currentTime + 3.4);
      timers.push(window.setTimeout(ring, 900 + Math.random() * 1800));
    };
    ring();
  } else {
    const freqs = m.preset === "space" ? [55, 55.4, 82.41, 110.3] : [110, 164.81, 220, 277.18];
    freqs.forEach((f, i) => {
      const o = c.createOscillator(); o.type = m.preset === "space" ? (i % 2 ? "sawtooth" : "triangle") : i % 2 ? "sine" : "triangle";
      o.frequency.value = f; o.detune.value = (i - 1.5) * 6;
      const g = c.createGain(); g.gain.value = (m.preset === "space" ? 0.22 : 0.18) / (i + 1);
      const lfo = c.createOscillator(); lfo.frequency.value = (m.preset === "space" ? 0.04 : 0.07) + i * 0.03;
      const lg = c.createGain(); lg.gain.value = m.preset === "space" ? 0.1 : 0.06; lfo.connect(lg).connect(g.gain); lfo.start();
      o.connect(g).connect(master); o.start(); nodes.push({ stop: () => { o.stop(); lfo.stop(); } });
    });
    if (m.preset === "space") { // slow filter sweep
      const sweep = c.createOscillator(); sweep.frequency.value = 0.03; const sg = c.createGain(); sg.gain.value = 260; sweep.connect(sg).connect(lp.frequency); sweep.start(); nodes.push({ stop: () => sweep.stop() });
    }
  }
  return () => {
    timers.forEach((t) => clearTimeout(t));
    master.gain.cancelScheduledValues(c.currentTime); master.gain.setValueAtTime(master.gain.value, c.currentTime); master.gain.linearRampToValueAtTime(0, c.currentTime + 0.7);
    setTimeout(() => { nodes.forEach((n) => { try { n.stop?.(); } catch { /* already stopped */ } }); master.disconnect(); lp.disconnect(); }, 800);
  };
}

/** Called when the admin-configured music changes (or loads). Restarts the track if it is playing. */
export function configureAmbient(m: Music) {
  const changed = JSON.stringify(m) !== JSON.stringify(cfg); cfg = m;
  if (m.mode === "off" && on) { stopMain?.(); stopMain = null; on = false; }
  else if (changed && on) { stopMain?.(); stopMain = start(m); }
  notify();
}

export function toggleAmbient() {
  if (typeof window === "undefined" || cfg.mode === "off") return;
  if (on) { stopMain?.(); stopMain = null; on = false; } else { stopMain = start(cfg); on = true; }
  notify();
}

/** Admin preview of a candidate setup, independent of the visitor toggle. */
export function playPreview(m: Music) { stopPreview(); stopPreviewFn = start(m); }
export function stopPreview() { stopPreviewFn?.(); stopPreviewFn = null; }
export const isPreviewing = () => !!stopPreviewFn;
