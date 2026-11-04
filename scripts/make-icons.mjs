// Generates the PWA icons into public/icons from an SVG design.
//   node scripts/make-icons.mjs        (uses Playwright's Chromium, or set PW_CHANNEL=msedge)
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(out, { recursive: true });

const art = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#3a2166"/><stop offset=".6" stop-color="#180f29"/><stop offset="1" stop-color="#0b0812"/></radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1dfae"/><stop offset="1" stop-color="#c79a45"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${pad}) translate(-256 -256)">
    <circle cx="256" cy="256" r="196" fill="none" stroke="url(#gold)" stroke-width="7" opacity=".85"/>
    <circle cx="256" cy="256" r="178" fill="none" stroke="#c9b6df" stroke-width="2" opacity=".35"/>
    <path d="M318 132a132 132 0 1 0 0 248 104 104 0 1 1 0-248z" fill="url(#gold)"/>
    <path d="M346 176Q352 214 392 220Q352 226 346 264Q340 226 300 220Q340 214 346 176z" fill="#f5ecdd" opacity=".96"/><circle cx="300" cy="300" r="6" fill="#f5ecdd" opacity=".7"/><circle cx="392" cy="150" r="4" fill="#f5ecdd" opacity=".6"/>
  </g>
</svg>`;

const jobs = [["icon-192.png", 192, 1], ["icon-512.png", 512, 1], ["maskable-512.png", 512, 0.74], ["apple-touch-icon.png", 180, 0.92]];
const b = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
for (const [name, size, pad] of jobs) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${art(pad)}`);
  await p.screenshot({ path: path.join(out, name) });
  await p.close();
  console.log("wrote", name);
}
// favicon-style icon used by the App Router (src/app/icon.png)
const p = await b.newPage({ viewport: { width: 64, height: 64 } });
await p.setContent(`<style>html,body{margin:0}svg{display:block;width:64px;height:64px}</style>${art(0.95)}`);
await p.screenshot({ path: path.join(process.cwd(), "src", "app", "icon.png") });
await b.close();
console.log("wrote src/app/icon.png");
