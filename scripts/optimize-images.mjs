// Recompresses public/img to WebP (max 1600 px wide). Run once after adding artwork: node scripts/optimize-images.mjs
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "public", "img");
let before = 0, after = 0;
for (const f of fs.readdirSync(dir)) {
  if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
  const src = path.join(dir, f); const out = path.join(dir, f.replace(/\.(png|jpe?g|webp)$/i, ".webp"));
  const buf = fs.readFileSync(src); before += buf.length;
  const res = await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toBuffer();
  if (res.length < buf.length || !f.endsWith(".webp")) { fs.writeFileSync(out, res); after += res.length; if (out !== src) fs.unlinkSync(src); }
  else after += buf.length;
  console.log(f.padEnd(10), Math.round(buf.length / 1024), "KB →", Math.round(Math.min(res.length, buf.length) / 1024), "KB");
}
console.log(`Total: ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB`);
