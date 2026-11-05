// Captures a poster frame (public/videos/N.jpg) from each public/videos/N.mp4. Needs the site running on :3200.
//   PW_CHANNEL=msedge node scripts/video-posters.mjs
import { chromium } from "playwright-core";
import fs from "node:fs";

const base = process.env.BASE_URL || "http://localhost:3200";
const at = { 1: 3.5, 2: 4, 3: 3, 4: 4, 5: 3 };
const b = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const p = await b.newPage();
await p.goto(base + "/api/health");
for (const n of [1, 2, 3, 4, 5]) {
  if (!fs.existsSync(`public/videos/${n}.mp4`)) continue;
  const data = await p.evaluate(async ([n, t]) => {
    const v = document.createElement("video");
    v.muted = true; v.src = `/videos/${n}.mp4`; v.preload = "auto";
    await new Promise((r) => { v.onloadeddata = r; });
    v.currentTime = Math.min(t, (v.duration || t) - 0.3);
    await new Promise((r) => { v.onseeked = r; });
    const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    return c.toDataURL("image/jpeg", 0.85);
  }, [n, at[n]]);
  fs.writeFileSync(`public/videos/${n}.jpg`, Buffer.from(data.split(",")[1], "base64"));
  console.log("wrote", n);
}
await b.close();
