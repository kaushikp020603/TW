// Tiny generative ambient pad (WebAudio). Off by default; user toggles it.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const oscs: OscillatorNode[] = [];
let on = false;
const listeners = new Set<(v: boolean) => void>();

export function isAmbientOn() { return on; }
export function onAmbient(fn: (v: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function toggleAmbient() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 900;
    master.connect(lp).connect(ctx.destination);
    [110, 164.81, 220, 277.18].forEach((f, i) => {
      const o = ctx!.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f; o.detune.value = (i - 1.5) * 6;
      const g = ctx!.createGain(); g.gain.value = 0.18 / (i + 1);
      const lfo = ctx!.createOscillator(); lfo.frequency.value = 0.07 + i * 0.03;
      const lg = ctx!.createGain(); lg.gain.value = 0.06;
      lfo.connect(lg).connect(g.gain); lfo.start();
      o.connect(g).connect(master!); o.start(); oscs.push(o);
    });
  }
  on = !on;
  if (on) ctx.resume();
  master!.gain.cancelScheduledValues(ctx.currentTime);
  master!.gain.linearRampToValueAtTime(on ? 0.5 : 0, ctx.currentTime + 1.2);
  listeners.forEach((l) => l(on));
}
