import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminChangePassword, adminConfigured, adminLogin, isAdmin, limited } from "@/lib/auth";
import { rows, row, run, now } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { getConfig, saveConfig } from "@/lib/config";

type B = Record<string, unknown> & { id?: number };
const csv = (data: Record<string, unknown>[]) => {
  if (!data.length) return "";
  const keys = Object.keys(data[0]); const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...data.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
};
const dayKey = (t: number) => new Date(t - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const count = async (sql: string) => (await row<{ c: number }>(sql))?.c ?? 0;

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ authed: false, configured: await adminConfigured() }, { status: 401 });
  const u = new URL(req.url); const ex = u.searchParams.get("export");
  if (u.searchParams.get("backup")) {
    const tables = ["services", "bookings", "payments", "coupons", "blocked", "slots", "reviews", "readings", "card_overrides", "posts", "announcements", "threads", "replies", "readers", "notes", "activity"];
    const dump: Record<string, unknown> = {};
    const parts = await Promise.all(tables.map((t) => rows(`SELECT * FROM ${t}`)));
    tables.forEach((t, i) => (dump[t] = parts[i]));
    dump.users = await rows("SELECT id,email,name,phone,premium,credits,created FROM users");
    return new NextResponse(JSON.stringify(dump, null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename=arcana-backup-${new Date().toISOString().slice(0, 10)}.json` } });
  }
  if (ex) {
    const data = ex === "customers" ? await rows("SELECT id,name,email,phone,premium,credits,datetime(created/1000,'unixepoch') AS joined FROM users")
      : ex === "payments" ? await rows("SELECT id,label,amount,method,status,datetime(created/1000,'unixepoch') AS created FROM payments ORDER BY created DESC")
      : ex === "readings" ? await rows("SELECT r.id,u.name,u.email,r.spread,r.category,r.question,r.cards,datetime(r.created/1000,'unixepoch') AS created FROM readings r JOIN users u ON u.id=r.user_id")
      : await rows("SELECT code,name,phone,service_name,kind,price,discount,coupon,date,time,status,datetime(created/1000,'unixepoch') AS created FROM bookings ORDER BY date DESC");
    return new NextResponse(csv(data), { headers: { "content-type": "text/csv", "content-disposition": `attachment; filename=arcana-${ex}.csv` } });
  }
  const [bookings, payments, customers, services, coupons, blocked, slots, reviews, readings, cardOverrides, posts, announcements, chats, threads, replies, readers, notes, activity, allMessages,
    nCustomers, nReviews, nThreads, nReplies, nReaders, nChat] = await Promise.all([
    rows<{ id: number; status: string; date: string; created: number; price: number; discount: number }>("SELECT * FROM bookings ORDER BY date DESC, time"),
    rows<{ amount: number; status: string; created: number }>("SELECT p.*, u.name AS user_name FROM payments p LEFT JOIN users u ON u.id=p.user_id ORDER BY created DESC"),
    rows("SELECT id,name,email,phone,premium,credits,created,(SELECT COUNT(*) FROM bookings b WHERE b.user_id=users.id) AS bookings FROM users ORDER BY created DESC"),
    rows("SELECT * FROM services ORDER BY sort"), rows("SELECT * FROM coupons"), rows("SELECT * FROM blocked ORDER BY date"),
    rows<{ time: string; priority: number }>("SELECT time,priority FROM slots ORDER BY sort"), rows("SELECT * FROM reviews ORDER BY created DESC"),
    rows("SELECT r.id,r.spread,r.category,r.question,r.cards,r.created,u.name,u.email FROM readings r JOIN users u ON u.id=r.user_id ORDER BY r.created DESC LIMIT 100"),
    rows("SELECT * FROM card_overrides"), rows("SELECT * FROM posts ORDER BY created DESC"), rows("SELECT * FROM announcements ORDER BY created DESC"),
    rows("SELECT u.id,u.name,u.email,(SELECT text FROM messages m WHERE m.user_id=u.id ORDER BY created DESC LIMIT 1) AS last,(SELECT created FROM messages m WHERE m.user_id=u.id ORDER BY created DESC LIMIT 1) AS at FROM users u WHERE EXISTS (SELECT 1 FROM messages m WHERE m.user_id=u.id) ORDER BY at DESC"),
    rows("SELECT * FROM threads ORDER BY created DESC LIMIT 100"), rows("SELECT r.*, t.title AS thread FROM replies r JOIN threads t ON t.id=r.thread_id ORDER BY r.created DESC LIMIT 100"),
    rows("SELECT * FROM readers ORDER BY main DESC, created"), rows("SELECT * FROM notes ORDER BY created DESC"), rows("SELECT * FROM activity ORDER BY created DESC LIMIT 40"),
    rows("SELECT user_id,sender,text,created FROM messages ORDER BY created"),
    count("SELECT COUNT(*) c FROM users"), count("SELECT COUNT(*) c FROM reviews WHERE approved=0"), count("SELECT COUNT(*) c FROM threads WHERE approved=0"), count("SELECT COUNT(*) c FROM replies WHERE approved=0"),
    count("SELECT COUNT(*) c FROM readers WHERE verified=0"),
    count("SELECT COUNT(*) c FROM (SELECT user_id, (SELECT sender FROM messages m2 WHERE m2.user_id=m.user_id ORDER BY created DESC LIMIT 1) AS last FROM messages m GROUP BY user_id) WHERE last='user'"),
  ]);
  const [config, media] = await Promise.all([getConfig(), rows("SELECT id,name,mime,size,created FROM media ORDER BY created DESC")]);
  const paid = payments.filter((p) => p.status === "paid");
  const today = dayKey(Date.now());
  const days = Array.from({ length: 7 }, (_, i) => dayKey(Date.now() - (6 - i) * 864e5));
  const month = today.slice(0, 7), year = today.slice(0, 4);
  const sum = (f: (p: { created: number }) => boolean) => paid.filter(f).reduce((s, p) => s + p.amount, 0);
  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (11 - i), 1); return d.toISOString().slice(0, 7); });
  return NextResponse.json({
    authed: true, today,
    stats: {
      bookings: bookings.length, pending: bookings.filter((b) => b.status === "pending").length, upcoming: bookings.filter((b) => b.date >= today && ["pending", "confirmed"].includes(b.status)).length,
      customers: nCustomers,
      revenueMonth: sum((p) => dayKey(p.created).startsWith(month)), revenueYear: sum((p) => dayKey(p.created).startsWith(year)), revenueAll: sum(() => true),
      pendingPayments: payments.filter((p) => p.status === "pending").length,
    },
    weekly: days.map((d) => ({ day: d, revenue: sum((p) => dayKey(p.created) === d), bookings: bookings.filter((b) => dayKey(b.created) === d).length })),
    monthly: months.map((m) => ({ month: m, revenue: sum((p) => dayKey(p.created).startsWith(m)), bookings: bookings.filter((b) => dayKey(b.created).startsWith(m)).length })),
    config, media,
    bookings, payments, customers, services, coupons, blocked, slots, reviews, readings, cardOverrides, posts, announcements, chats, threads, replies, readers, notes, activity, allMessages,
    alerts: { bookings: bookings.filter((b) => b.status === "pending").length, payments: payments.filter((p) => p.status === "pending").length, reviews: nReviews, community: nThreads + nReplies, readers: nReaders, chat: nChat },
  });
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as B;
  if (b.action === "login") {
    if (await limited("adm:" + (req.headers.get("x-forwarded-for") ?? "local"), 6, 300_000)) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
    return (await adminLogin(String(b.password || ""))) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  if (b.action === "logout") { (await cookies()).delete("arcana_admin"); return NextResponse.json({ ok: true }); }
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const S = (k: string, n = 500) => String(b[k] ?? "").slice(0, n);
  const N = (k: string) => Number(b[k]) | 0;
  const log = (t: string) => run("INSERT INTO activity (text,created) VALUES (?,?)", t, now());
  try {
    switch (b.action) {
      case "changePassword":
        if (await adminChangePassword(S("current", 200), S("next", 200))) { await log("Admin password changed"); return NextResponse.json({ ok: true }); }
        return NextResponse.json({ error: "Current password is wrong, or the new one is under 8 characters." }, { status: 400 });
      case "addNote": { const t = S("text", 1000).trim(); if (t && ["booking", "client"].includes(S("entity"))) await run("INSERT INTO notes (entity,ref,text,created) VALUES (?,?,?,?)", S("entity"), N("ref"), t, now()); break; }
      case "saveConfig": { const c = await saveConfig(b.config); await log(`Experience updated: music ${c.music.mode}${c.music.mode === "preset" ? " (" + c.music.preset + ")" : ""}, intro ${c.intro.style}`); break; }
      case "deleteMedia": {
        await run("DELETE FROM media WHERE id=?", N("id"));
        const c = await getConfig(); if (c.music.mediaId === N("id")) await saveConfig({ ...c, music: { ...c.music, mode: "preset", mediaId: null, mediaName: "" } });
        break;
      }
      case "deleteNote": await run("DELETE FROM notes WHERE id=?", N("id")); break;
      case "bulkStatus": {
        if (!["confirmed", "cancelled", "completed", "rejected"].includes(S("status"))) break;
        const ids = (b.ids as number[]).slice(0, 200);
        for (const id of ids) await run("UPDATE bookings SET status=?, updated=? WHERE id=?", S("status"), now(), Number(id));
        await log(`${ids.length} booking(s) marked ${S("status")}`); break;
      }
      case "resetData": {
        if (S("confirm") !== "DELETE") return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
        for (const t of ["bookings", "payments", "sessions", "readings", "reviews", "threads", "replies", "messages", "journal", "posts", "announcements", "notes", "activity", "ratelimit", "users"]) await run(`DELETE FROM ${t}`);
        await log("All demo/customer data cleared"); break;
      }
      case "chatMessages": return NextResponse.json({ messages: await rows("SELECT id,sender,text,created FROM messages WHERE user_id=? ORDER BY created", N("userId")) });
      case "setStatus": {
        if (!["pending", "confirmed", "cancelled", "completed", "rejected"].includes(S("status"))) break;
        const bk = await row<{ id: number; code: string; kind: string; meeting_link: string | null; user_id: number | null; used_credit: number; status: string; service_name: string; date: string; time: string }>("SELECT * FROM bookings WHERE id=?", N("id"));
        if (!bk) break;
        await run("UPDATE bookings SET status=?, updated=? WHERE id=?", S("status"), now(), bk.id); await log(`Booking ${bk.code} → ${S("status")}`);
        if (S("status") === "confirmed" && ["video", "voice"].includes(bk.kind) && !bk.meeting_link)
          await run("UPDATE bookings SET meeting_link=? WHERE id=?", `https://meet.jit.si/Arcana-${bk.code}${bk.kind === "voice" ? "#config.startWithVideoMuted=true" : ""}`, bk.id);
        if (["cancelled", "rejected"].includes(S("status")) && !["cancelled", "rejected"].includes(bk.status) && bk.used_credit && bk.user_id) await run("UPDATE users SET credits=credits+1 WHERE id=?", bk.user_id);
        if (S("status") === "confirmed" && bk.user_id) { const u = await row<{ email: string }>("SELECT email FROM users WHERE id=?", bk.user_id); void sendMail(u?.email, `Booking ${bk.code} confirmed`, `Your ${bk.service_name} on ${bk.date} at ${bk.time} is confirmed.`); }
        break;
      }
      case "reschedule": await run("UPDATE bookings SET date=?, time=?, updated=? WHERE id=?", S("date"), S("time"), now(), N("id")); break;
      case "markPaid": {
        const bk = await row<{ id: number; user_id: number | null; service_name: string; price: number; discount: number }>("SELECT id,user_id,service_name,price,discount FROM bookings WHERE id=?", N("id"));
        if (bk) { const amt = Number(b.amount) || bk.price - bk.discount; await run("INSERT INTO payments (booking_id,user_id,label,amount,method,status,created) VALUES (?,?,?,?,?,'paid',?)", bk.id, bk.user_id, bk.service_name, amt, S("method", 20) || "UPI", now()); await log(`Payment ₹${amt} recorded for ${bk.service_name}`); }
        break;
      }
      case "addPayment": await run("INSERT INTO payments (label,amount,method,status,note,created) VALUES (?,?,?,?,?,?)", S("label", 80) || "Payment", N("amount"), S("method", 20), ["paid", "failed", "pending", "refunded"].includes(S("status")) ? S("status") : "paid", S("note", 200), now()); break;
      case "setPayment": {
        const p = await row<{ status: string; user_id: number | null; sessions: number }>("SELECT status,user_id,sessions FROM payments WHERE id=?", N("id"));
        if (!p || !["paid", "failed", "pending", "refunded"].includes(S("status"))) break;
        await run("UPDATE payments SET status=? WHERE id=?", S("status"), N("id")); await log(`Payment #${N("id")} → ${S("status")}`);
        if (p.sessions && p.user_id) { // package credits follow the payment state
          if (S("status") === "paid" && p.status !== "paid") await run("UPDATE users SET credits=credits+? WHERE id=?", p.sessions, p.user_id);
          if (p.status === "paid" && S("status") !== "paid") await run("UPDATE users SET credits=MAX(0,credits-?) WHERE id=?", p.sessions, p.user_id);
        }
        break;
      }
      case "saveService":
        await run("INSERT INTO services (id,name,price,mins,blurb,active,sort,kind,sessions) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, price=excluded.price, mins=excluded.mins, blurb=excluded.blurb, active=excluded.active",
          S("id", 30).replace(/[^a-z0-9_-]/gi, "") || "svc" + now(), S("name", 80), Math.max(0, N("price")), S("mins", 40), S("blurb", 160), b.active ? 1 : 0, N("sort"), ["reading", "video", "voice", "package"].includes(S("kind")) ? S("kind") : "reading", N("sessions")); break;
      case "saveCoupon":
        await run("INSERT INTO coupons (code,kind,value,active,max_uses) VALUES (?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET kind=excluded.kind, value=excluded.value, active=excluded.active, max_uses=excluded.max_uses",
          S("code", 20).trim().toUpperCase(), b.kind === "flat" ? "flat" : "percent", Math.max(0, N("value")), b.active === false ? 0 : 1, b.max_uses ? Number(b.max_uses) : null); break;
      case "deleteCoupon": await run("DELETE FROM coupons WHERE code=?", S("code")); break;
      case "block": await run("INSERT OR IGNORE INTO blocked (date,time) VALUES (?,?)", S("date"), b.time ? S("time") : null); break;
      case "unblock": await run("DELETE FROM blocked WHERE id=?", N("id")); break;
      case "saveSlots": {
        const clean = (v: unknown) => String(v ?? "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20);
        await run("DELETE FROM slots");
        for (const [i, t] of clean(b.times).entries()) await run("INSERT OR REPLACE INTO slots (time,sort,priority) VALUES (?,?,0)", t, i);
        for (const [i, t] of clean(b.priority).entries()) await run("INSERT OR REPLACE INTO slots (time,sort,priority) VALUES (?,?,1)", t, 100 + i);
        break;
      }
      case "reviewApprove": await run("UPDATE reviews SET approved=? WHERE id=?", b.approved ? 1 : 0, N("id")); break;
      case "reviewDelete": await run("DELETE FROM reviews WHERE id=?", N("id")); break;
      case "saveCard": {
        const id = N("id"); if (id < 0 || id > 21) break;
        await run("INSERT INTO card_overrides (id,keywords,upright,reversed,love,career) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET keywords=excluded.keywords, upright=excluded.upright, reversed=excluded.reversed, love=excluded.love, career=excluded.career",
          id, S("keywords", 100), S("upright", 600), S("reversed", 600), S("love", 300), S("career", 300)); break;
      }
      case "resetCard": await run("DELETE FROM card_overrides WHERE id=?", N("id")); break;
      case "savePost": {
        const slug = (S("slug", 60) || S("title", 60)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "post-" + now();
        await run("INSERT INTO posts (slug,title,body,published,created) VALUES (?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, body=excluded.body, published=excluded.published", slug, S("title", 160), S("body", 20000), b.published === false ? 0 : 1, now()); break;
      }
      case "deletePost": await run("DELETE FROM posts WHERE id=?", N("id")); break;
      case "addAnnouncement": await run("INSERT INTO announcements (text,created) VALUES (?,?)", S("text", 240), now()); break;
      case "toggleAnnouncement": await run("UPDATE announcements SET active=? WHERE id=?", b.active ? 1 : 0, N("id")); break;
      case "deleteAnnouncement": await run("DELETE FROM announcements WHERE id=?", N("id")); break;
      case "chatReply": await run("INSERT INTO messages (user_id,sender,text,created) VALUES (?,?,?,?)", N("userId"), "reader", S("text", 800), now()); break;
      case "approveThread": await run("UPDATE threads SET approved=? WHERE id=?", b.approved ? 1 : 0, N("id")); break;
      case "deleteThread": await run("DELETE FROM replies WHERE thread_id=?", N("id")); await run("DELETE FROM threads WHERE id=?", N("id")); break;
      case "approveReply": await run("UPDATE replies SET approved=? WHERE id=?", b.approved ? 1 : 0, N("id")); break;
      case "deleteReply": await run("DELETE FROM replies WHERE id=?", N("id")); break;
      case "readerVerify": await run("UPDATE readers SET verified=? WHERE id=?", b.verified ? 1 : 0, N("id")); break;
      case "readerDelete": await run("DELETE FROM readers WHERE id=? AND main=0", N("id")); break;
      case "userSet": await run("UPDATE users SET premium=?, credits=? WHERE id=?", b.premium ? 1 : 0, Math.max(0, N("credits")), N("id")); await log(`Client #${N("id")}: premium ${b.premium ? "on" : "off"}, ${N("credits")} credits`); break;
      case "deleteReading": await run("DELETE FROM readings WHERE id=?", N("id")); break;
      default: return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    if (/UNIQUE|constraint/i.test(String((e as Error)?.message || e))) return NextResponse.json({ error: "Another active booking already holds that time slot." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}
