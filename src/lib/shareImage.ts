"use client";
import type { Card } from "@/data/tarot";
import { EMBLEM_SVG } from "@/data/emblems";

type Item = { card: Card; reversed?: boolean; label?: string };

const emblemImage = (key: string, reversed: boolean) => new Promise<HTMLImageElement>((res) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="#d6b36d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><g transform="${reversed ? "rotate(180 50 50)" : ""}"><circle cx="50" cy="50" r="46" stroke="#c9b6df" stroke-opacity=".35" stroke-width=".8"/>${EMBLEM_SVG[key] ?? ""}</g></svg>`;
  const img = new Image(); img.onload = () => res(img); img.onerror = () => res(img); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
});
const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

/** Draws a 1080×1920 story-format image of one to three cards. */
export async function makeShareImage(title: string, items: Item[], note?: string): Promise<Blob> {
  const W = 1080, H = 1920; const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d")!;
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#241540"); bg.addColorStop(0.55, "#120a22"); bg.addColorStop(1, "#0b0812"); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W / 2, 520, 20, W / 2, 520, 700); glow.addColorStop(0, "rgba(214,179,109,.22)"); glow.addColorStop(1, "rgba(214,179,109,0)"); c.fillStyle = glow; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(245,236,221,${Math.random() * 0.6})`; c.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  c.textAlign = "center"; c.fillStyle = "#ead5a0"; c.font = "600 54px Georgia, serif"; c.fillText("T H E   A R C A N A", W / 2, 130);
  c.fillStyle = "#c9b6df"; c.font = "italic 38px Georgia, serif"; c.fillText(title, W / 2, 200);
  const n = items.length; const cw = n === 1 ? 560 : n === 2 ? 420 : 320, ch = cw * 1.6; const gap = 36; const total = n * cw + (n - 1) * gap; const y0 = n === 1 ? 330 : 420;
  for (let i = 0; i < n; i++) {
    const { card, reversed, label } = items[i]; const x = (W - total) / 2 + i * (cw + gap);
    const g = c.createLinearGradient(x, y0, x, y0 + ch); g.addColorStop(0, "#2a1747"); g.addColorStop(1, "#0b0812");
    rr(c, x, y0, cw, ch, 26); c.fillStyle = g; c.fill(); c.lineWidth = 4; c.strokeStyle = "#d6b36d"; c.stroke();
    rr(c, x + 16, y0 + 16, cw - 32, ch - 32, 18); c.lineWidth = 1.5; c.strokeStyle = "rgba(214,179,109,.35)"; c.stroke();
    c.fillStyle = "#ead5a0"; c.font = `${Math.round(cw * 0.07)}px Georgia, serif`; c.fillText(card.numeral, x + cw / 2, y0 + cw * 0.17);
    const img = await emblemImage(card.emblem, !!reversed); const s = cw * 0.66; c.drawImage(img, x + (cw - s) / 2, y0 + ch * 0.2, s, s);
    c.font = `600 ${Math.round(cw * 0.075)}px Georgia, serif`; c.fillText(card.name.toUpperCase(), x + cw / 2, y0 + ch - cw * 0.1);
    if (label) { c.fillStyle = "#d6b36d"; c.font = "30px Georgia, serif"; c.fillText(label.toUpperCase(), x + cw / 2, y0 + ch + 60); }
    if (reversed) { c.fillStyle = "#c9b6df"; c.font = "italic 28px Georgia, serif"; c.fillText("reversed", x + cw / 2, y0 + ch + (label ? 104 : 60)); }
  }
  const first = items[0]; let y = y0 + ch + (items.some((i) => i.label) ? 190 : 150);
  c.fillStyle = "#f5ecdd"; c.font = "600 64px Georgia, serif"; if (n === 1) { c.fillText(first.card.name, W / 2, y); y += 70; }
  c.fillStyle = "#d6b36d"; c.font = "italic 38px Georgia, serif"; if (n === 1) { c.fillText(first.card.keywords, W / 2, y); y += 90; }
  if (note) { c.fillStyle = "#f5ecdd"; c.font = "34px Georgia, serif"; const words = note.split(" "); let line = ""; for (const w of words) { const t = line ? line + " " + w : w; if (c.measureText(t).width > 820) { c.fillText(line, W / 2, y); y += 52; line = w; } else line = t; } if (line) c.fillText(line, W / 2, y); }
  c.fillStyle = "#c9b6df"; c.font = "30px Georgia, serif"; c.fillText("For reflection and entertainment", W / 2, H - 150);
  c.fillStyle = "#ead5a0"; c.font = "600 36px Georgia, serif"; c.fillText(location.host, W / 2, H - 90);
  return new Promise((res) => cv.toBlob((b) => res(b!), "image/png"));
}

/** Uses the phone's share sheet when available, otherwise downloads the image. */
export async function shareOrDownload(blob: Blob, name: string, text: string) {
  const file = new File([blob], name, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: object) => boolean };
  const touch = matchMedia("(pointer: coarse)").matches; // phones: native share sheet; desktop: download
  if (touch && nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], text }); return "shared"; } catch { return "cancelled"; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return "downloaded";
}
