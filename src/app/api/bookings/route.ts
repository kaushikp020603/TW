import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { currentUser, limited } from "@/lib/auth";
import { row, rows, run, now } from "@/lib/db";
import { sendMail } from "@/lib/mail";

const ip = (r: Request) => r.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";

type Coupon = { code: string; kind: string; value: number; active: number; uses: number; max_uses: number | null };

async function priceWithCoupon(price: number, code?: string) {
  if (!code) return { discount: 0, coupon: null as string | null };
  const c = await row<Coupon>("SELECT * FROM coupons WHERE code=? AND active=1", code.trim().toUpperCase());
  if (!c || (c.max_uses && c.uses >= c.max_uses)) return { discount: 0, coupon: null };
  const d = c.kind === "percent" ? Math.round((price * c.value) / 100) : Math.min(price, c.value);
  return { discount: d, coupon: c.code };
}
async function slotFree(date: string, time: string, ignoreId = 0) {
  if (await row("SELECT 1 x FROM blocked WHERE date=? AND (time IS NULL OR time=?)", date, time)) return false;
  return !(await row("SELECT 1 x FROM bookings WHERE date=? AND time=? AND status IN ('pending','confirmed') AND id<>?", date, time, ignoreId));
}
const isUniqueViolation = (e: unknown) => /UNIQUE|constraint/i.test(String((e as Error)?.message || e));

// GET ?code=XXXX (guest lookup)  |  no params + signed in → my bookings  |  ?coupon=CODE&service=id → preview discount
export async function GET(req: Request) {
  const u = new URL(req.url);
  const cp = u.searchParams.get("coupon");
  if (cp) {
    const s = await row<{ price: number }>("SELECT price FROM services WHERE id=?", u.searchParams.get("service") || "");
    if (!s) return NextResponse.json({ valid: false });
    const r = await priceWithCoupon(s.price, cp);
    return NextResponse.json({ valid: !!r.coupon, discount: r.discount, final: s.price - r.discount });
  }
  const code = u.searchParams.get("code");
  if (code) return NextResponse.json({ bookings: await rows("SELECT code,service_name,price,discount,date,time,status,name,kind,meeting_link FROM bookings WHERE code=?", code.toUpperCase()) });
  const user = await currentUser();
  if (!user) return NextResponse.json({ bookings: [] });
  return NextResponse.json({ bookings: await rows("SELECT code,service_name,price,discount,date,time,status,kind,meeting_link FROM bookings WHERE user_id=? ORDER BY date DESC, time", user.id) });
}

export async function POST(req: Request) {
  if (await limited("book:" + ip(req), 8, 300_000)) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const user = await currentUser();
  const name = String(b.name || user?.name || "").trim().slice(0, 80);
  const phone = String(b.phone || user?.phone || "").trim().slice(0, 20);
  const date = String(b.date || ""), time = String(b.time || "");
  const svc = await row<{ id: string; name: string; price: number; kind: string }>("SELECT id,name,price,kind FROM services WHERE id=? AND active=1 AND kind<>'package'", String(b.serviceId || ""));
  if (!svc || name.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(await row("SELECT 1 x FROM slots WHERE time=?", time))) return NextResponse.json({ error: "Please complete all booking details." }, { status: 400 });
  if (date < new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: "That date has passed." }, { status: 400 });
  if (!(await slotFree(date, time))) return NextResponse.json({ error: "Sorry, that slot was just taken. Please choose another." }, { status: 409 });
  const slotRow = await row<{ priority: number }>("SELECT priority FROM slots WHERE time=?", time);
  if (slotRow?.priority && !(user && (await row("SELECT 1 x FROM users WHERE id=? AND premium=1", user.id)))) return NextResponse.json({ error: "That is a priority slot for premium members." }, { status: 403 });
  let { discount, coupon } = await priceWithCoupon(svc.price, b.coupon);
  let usedCredit = 0;
  if (b.useCredit) {
    const cr = user ? (await row<{ credits: number }>("SELECT credits FROM users WHERE id=?", user.id))?.credits ?? 0 : 0;
    if (!user || cr < 1) return NextResponse.json({ error: "You have no package credits left." }, { status: 400 });
    usedCredit = 1; discount = svc.price; coupon = null;
  }
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  try {
    await run("INSERT INTO bookings (code,user_id,name,phone,service_id,service_name,price,discount,coupon,date,time,note,created,kind,used_credit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      code, user?.id ?? null, name, phone || null, svc.id, svc.name, svc.price, discount, coupon, date, time, String(b.note || "").slice(0, 300), now(), svc.kind, usedCredit);
  } catch (e) {
    if (isUniqueViolation(e)) return NextResponse.json({ error: "Sorry, that slot was just taken. Please choose another." }, { status: 409 });
    throw e;
  }
  if (usedCredit && user) { // deduct atomically, only after the slot is secured
    const r = await run("UPDATE users SET credits=credits-1 WHERE id=? AND credits>0", user.id);
    if (!r.changes) { await run("DELETE FROM bookings WHERE code=?", code); return NextResponse.json({ error: "You have no package credits left." }, { status: 400 }); }
  }
  if (coupon) await run("UPDATE coupons SET uses=uses+1 WHERE code=?", coupon);
  if (user) void sendMail(user.email, `Booking request ${code} received`, `Hi ${name}, we received your request for ${svc.name} on ${date} at ${time}. It is confirmed once the reader replies on WhatsApp. Ref ${code}.`);
  return NextResponse.json({ booking: { code, service_name: svc.name, price: svc.price, discount, final: svc.price - discount, date, time, status: "pending", name } });
}

// PATCH {code, action:"cancel"} | {code, action:"reschedule", date, time}
export async function PATCH(req: Request) {
  const b = await req.json().catch(() => ({}));
  const bk = await row<{ id: number; status: string; used_credit: number; user_id: number | null }>("SELECT id,status,used_credit,user_id FROM bookings WHERE code=?", String(b.code || "").toUpperCase());
  if (!bk || bk.status === "cancelled" || bk.status === "completed") return NextResponse.json({ error: "Booking not found or can't be changed." }, { status: 404 });
  if (b.action === "cancel") {
    await run("UPDATE bookings SET status='cancelled', updated=? WHERE id=?", now(), bk.id);
    if (bk.used_credit && bk.user_id) await run("UPDATE users SET credits=credits+1 WHERE id=?", bk.user_id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "reschedule") {
    const date = String(b.date || ""), time = String(b.time || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(await row("SELECT 1 x FROM slots WHERE time=?", time))) return NextResponse.json({ error: "Invalid slot." }, { status: 400 });
    if (!(await slotFree(date, time, bk.id))) return NextResponse.json({ error: "That slot is taken." }, { status: 409 });
    try { await run("UPDATE bookings SET date=?, time=?, status='pending', updated=? WHERE id=?", date, time, now(), bk.id); }
    catch (e) { if (isUniqueViolation(e)) return NextResponse.json({ error: "That slot is taken." }, { status: 409 }); throw e; }
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
