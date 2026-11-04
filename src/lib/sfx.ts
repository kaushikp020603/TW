"use client";
import { getAudioContext, isAmbientOn } from "./ambient";

// Small synthesized card sounds. They only play when the visitor has switched the site sound on.
function ready(): AudioContext | null { if (typeof window === "undefined" || !isAmbientOn()) return null; try { const c = getAudioContext(); void c.resume(); return c; } catch { return null; } }

function noise(c: AudioContext, dur: number, f0: number, f1: number, gain: number, at = 0) {
  const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.9; bp.frequency.setValueAtTime(f0, c.currentTime + at); bp.frequency.exponentialRampToValueAtTime(f1, c.currentTime + at + dur);
  const g = c.createGain(); g.gain.setValueAtTime(gain, c.currentTime + at); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  src.connect(bp).connect(g).connect(c.destination); src.start(c.currentTime + at);
}
export function sfxShuffle() { const c = ready(); if (!c) return; for (let i = 0; i < 7; i++) noise(c, 0.16, 2400 + Math.random() * 1200, 900, 0.2, i * 0.28); }
export function sfxPick() { const c = ready(); if (!c) return; noise(c, 0.07, 3200, 1800, 0.28); }
export function sfxFlip() {
  const c = ready(); if (!c) return;
  noise(c, 0.22, 600, 3800, 0.22);
  const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 659.25; const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime + 0.12); g.gain.exponentialRampToValueAtTime(0.1, c.currentTime + 0.16); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.1);
  o.connect(g).connect(c.destination); o.start(c.currentTime + 0.1); o.stop(c.currentTime + 1.2);
}
