import fs from "node:fs";
import { BASE, OUT, ADMIN, launchBrowser, wav, isoDay } from "./lib.mjs";
void wav; void isoDay; void fs;
const SHOTS = process.env.SHOTS === "1";
const b = await launchBrowser();
const VPS = [["s320", 320, 640, true], ["m390", 390, 844, true], ["t768", 768, 1024, true], ["l1024", 1024, 768, false]];
const PAGES = ["/", "/insights", "/journey", "/community", "/blog", "/readers", "/chat", "/admin", "/privacy"];
const issues = [];
for (const [vn, w, h, mobile] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("arcana-intro", "1"));
  // admin login
  await p.goto(BASE + "/admin"); await p.waitForTimeout(500);
  await p.evaluate(async (pw) => fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", password: pw }) }), ADMIN);
  for (const path of PAGES) {
    await p.goto(BASE + path, { waitUntil: "load" }); await p.waitForTimeout(900);
    // scroll through to trigger lazy/anim then measure
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += h * 0.8) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(60); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
    const r = await p.evaluate((vw) => {
      const over = document.documentElement.scrollWidth - vw;
      const bad = [];
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el); if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden") continue;
        const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
        // ignore things inside horizontally scrollable containers
        let anc = el.parentElement, scrollable = false; while (anc && anc !== document.body) { const a = getComputedStyle(anc); if (/(auto|scroll|hidden)/.test(a.overflowX) && anc.scrollWidth > anc.clientWidth) { scrollable = true; break; } if (/(hidden|clip)/.test(a.overflowX)) { scrollable = true; break; } anc = anc.parentElement; }
        if (!scrollable && rc.right > vw + 2) bad.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 40)} right=${Math.round(rc.right)}`);
      }
      const small = [];
      for (const el of document.querySelectorAll("a[href],button,input,select,textarea,[role=tab]")) {
        const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || el.disabled) continue;
        const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
        if (el.type === "checkbox" || el.type === "radio") continue;
        if (rc.height < 32 || rc.width < 32) small.push(`${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute("aria-label") || el.placeholder || "").trim().slice(0, 24)}" ${Math.round(rc.width)}x${Math.round(rc.height)}`);
      }
      return { over, bad: bad.slice(0, 6), small: [...new Set(small)].slice(0, 12), textTiny: [...document.querySelectorAll("p,li,label,span,a,button")].filter((e) => { const f = parseFloat(getComputedStyle(e).fontSize); return e.innerText?.trim() && f < 11 && getComputedStyle(e).display !== "none"; }).length };
    }, w);
    if (r.over > 1 || r.bad.length) issues.push(`${vn} ${path}: OVERFLOW +${r.over}px ${r.bad.join(" | ")}`);
    if (r.small.length && mobile) issues.push(`${vn} ${path}: small targets → ${r.small.join("; ")}`);
    if (SHOTS && ["/", "/admin", "/insights"].includes(path) && (vn === "m390" || vn === "t768")) await p.screenshot({ path: `${OUT}/r-${vn}-${path.replace(/\//g, "_") || "home"}.png`, fullPage: false });
  }
  await ctx.close();
}
console.log(issues.length ? issues.join("\n") : "NO ISSUES"); if (issues.length) process.exitCode = 1;
await b.close();
