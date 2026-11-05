import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { run, now } from "@/lib/db";

// Privacy-friendly, cookie-free analytics. No IP address or user id is stored; a daily-rotating hash approximates unique visitors.
const TYPES = new Set(["pageview", "reading_start", "reading_complete", "booking_start", "booking_submit", "wa_click", "share", "signup", "intro_skip", "install", "subscribe"]);
const hits = new Map<string, number[]>();
const limited = (k: string) => {
  const t = Date.now(), a = (hits.get(k) || []).filter((x) => t - x < 60_000);
  a.push(t); hits.set(k, a); if (hits.size > 5000) hits.clear();
  return a.length > 120;
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const ua = req.headers.get("user-agent") || "";
  if (limited(ip)) return new NextResponse(null, { status: 204 });
  const b = (await req.json().catch(() => ({}))) as { type?: string; path?: string; ref?: string; msg?: string; consent?: boolean; lang?: string; utm?: string; choice?: string };
  const type = String(b.type || "");
  const path = String(b.path || "").slice(0, 120).replace(/[?#].*$/, "");
  if (type === "error") {
    const msg = String(b.msg || "").slice(0, 300);
    if (msg) await run("INSERT INTO errors (ts,source,message,path,ua) VALUES (?,?,?,?,?)", now(), "browser", msg, path, ua.slice(0, 160));
    return new NextResponse(null, { status: 204 });
  }
  if (type === "consent") {
    const choice = b.choice === "all" ? "all" : "essential";
    const day0 = new Date().toISOString().slice(0, 10);
    const vid0 = crypto.createHash("sha256").update(`${ip}|${ua}|${day0}|${process.env.ADMIN_PASSWORD || "arcana"}`).digest("hex").slice(0, 12);
    await run("INSERT INTO consents (ts,vid,choice) VALUES (?,?,?)", now(), vid0, choice);
    return new NextResponse(null, { status: 204 });
  }
  if (!TYPES.has(type)) return new NextResponse(null, { status: 204 });
  const day = new Date().toISOString().slice(0, 10);
  const vid = crypto.createHash("sha256").update(`${ip}|${ua}|${day}|${process.env.ADMIN_PASSWORD || "arcana"}`).digest("hex").slice(0, 12);
  let ref = "";
  try { ref = b.ref ? new URL(String(b.ref)).hostname.slice(0, 80) : ""; } catch { ref = ""; }
  const device = /ipad|tablet/i.test(ua) ? "Tablet" : /mobi|android|iphone/i.test(ua) ? "Mobile" : "Desktop";
  // Optional, consent-only fields. Location comes from Vercel's edge headers; the IP itself is never stored.
  const h = (k: string) => { try { return decodeURIComponent(req.headers.get(k) || "").slice(0, 60); } catch { return ""; } };
  const c = b.consent === true;
  const country = c ? h("x-vercel-ip-country") : "", region = c ? h("x-vercel-ip-country-region") : "", city = c ? h("x-vercel-ip-city") : "";
  const lang = c ? String(b.lang || "").slice(0, 12) : "", src = c ? String(b.utm || "").replace(/[^\w.\- ]/g, "").slice(0, 40) : "";
  await run("INSERT INTO events (ts,type,path,ref,vid,country,region,city,device,lang,src) VALUES (?,?,?,?,?,?,?,?,?,?,?)", now(), type, path, ref, vid, country, region, city, device, lang, src);
  return new NextResponse(null, { status: 204 });
}
