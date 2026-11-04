import { NextResponse } from "next/server";
import { currentUser, limited } from "@/lib/auth";
import { row, rows, run, now } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { getBusiness } from "@/lib/business";
import { refCodeFor, REFERRAL_PERCENT } from "@/lib/referral";

const ip = (r: Request) => r.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
const J = (o: unknown, status = 200) => NextResponse.json(o, { status });
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

// GET /api/site?q=cards|announce|blog|post|readers|threads|journal|chat|account
export async function GET(req: Request) {
  const u = new URL(req.url); const q = u.searchParams.get("q");
  const user = await currentUser();
  switch (q) {
    case "cards": return J({ cards: await rows("SELECT * FROM card_overrides") });
    case "config": return J(await getConfig());
    case "business": return J(await getBusiness());
    case "announce": return J({ items: await rows("SELECT id,text FROM announcements WHERE active=1 ORDER BY created DESC LIMIT 3") });
    case "blog": return J({ posts: await rows("SELECT slug,title,substr(body,1,180) AS excerpt,created FROM posts WHERE published=1 ORDER BY created DESC") });
    case "post": { const p = await row("SELECT slug,title,body,created FROM posts WHERE slug=? AND published=1", u.searchParams.get("slug") || ""); return p ? J({ post: p }) : J({ error: "Not found" }, 404); }
    case "readers": return J({ readers: await rows("SELECT id,name,bio,specialties,whatsapp,main FROM readers WHERE verified=1 ORDER BY main DESC, created") });
    case "threads": {
      const threads = await rows<{ id: number }>("SELECT id,name,title,body,created FROM threads WHERE approved=1 ORDER BY created DESC LIMIT 40");
      const out = await Promise.all(threads.map(async (t) => ({ ...t, replies: await rows("SELECT name,body,created FROM replies WHERE thread_id=? AND approved=1 ORDER BY created", t.id) })));
      return J({ threads: out });
    }
    case "account": {
      if (!user) return J({ premium: false, credits: 0 });
      const me = await row<{ premium: number; credits: number }>("SELECT premium,credits FROM users WHERE id=?", user.id);
      return J({ premium: !!me?.premium, credits: me?.credits ?? 0, refCode: await refCodeFor(user.id), refPercent: REFERRAL_PERCENT });
    }
    case "journal": if (!user) return J({ entries: [] }); return J({ entries: await rows("SELECT id,text,mood,created FROM journal WHERE user_id=? ORDER BY created DESC LIMIT 100", user.id) });
    case "chat": if (!user) return J({ messages: [] }); return J({ messages: await rows("SELECT id,sender,text,created FROM messages WHERE user_id=? ORDER BY created LIMIT 200", user.id) });
  }
  return J({ error: "bad query" }, 400);
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const user = await currentUser();
  const need = () => J({ error: "Please sign in first." }, 401);
  if (await limited("site:" + ip(req), 40)) return J({ error: "Too many requests." }, 429);

  switch (b.action) {
    case "thread": {
      if (!user) return need();
      const title = clip(b.title, 120), body = clip(b.body, 1500);
      if (title.length < 4 || body.length < 10) return J({ error: "Add a title and a few words." }, 400);
      await run("INSERT INTO threads (user_id,name,title,body,created) VALUES (?,?,?,?,?)", user.id, user.name.split(" ")[0], title, body, now());
      return J({ ok: true, message: "Thanks! Your post will appear once it's been reviewed." });
    }
    case "reply": {
      if (!user) return need();
      const body = clip(b.body, 800); if (body.length < 2) return J({ error: "Write a reply." }, 400);
      await run("INSERT INTO replies (thread_id,user_id,name,body,created) VALUES (?,?,?,?,?)", Number(b.threadId), user.id, user.name.split(" ")[0], body, now());
      return J({ ok: true, message: "Thanks! Your reply will appear once it's been reviewed." });
    }
    case "apply_reader": {
      const name = clip(b.name, 80), wa = clip(b.whatsapp, 20).replace(/\D/g, "");
      if (name.length < 2 || wa.length < 10) return J({ error: "Add your name and a WhatsApp number." }, 400);
      await run("INSERT INTO readers (name,bio,specialties,whatsapp,email,verified,created) VALUES (?,?,?,?,?,0,?)", name, clip(b.bio, 500), clip(b.specialties, 120), wa, clip(b.email, 100), now());
      return J({ ok: true, message: "Application received. Readers are verified before being listed." });
    }
    case "journal_add": {
      if (!user) return need();
      const text = clip(b.text, 2000); if (!text) return J({ error: "Write something first." }, 400);
      await run("INSERT INTO journal (user_id,text,mood,created) VALUES (?,?,?,?)", user.id, text, clip(b.mood, 20), now()); return J({ ok: true });
    }
    case "journal_delete": if (!user) return need(); await run("DELETE FROM journal WHERE id=? AND user_id=?", Number(b.id), user.id); return J({ ok: true });
    case "chat_send": {
      if (!user) return need();
      const text = clip(b.text, 800); if (!text) return J({ error: "Empty message." }, 400);
      await run("INSERT INTO messages (user_id,sender,text,created) VALUES (?,?,?,?)", user.id, "user", text, now()); return J({ ok: true });
    }
    case "subscribe": { // weekly-card signup: email or WhatsApp number, with explicit consent
      if (!b.consent) return J({ error: "Please tick the box to agree to receive the weekly card." }, 400);
      const c = clip(b.contact, 120); const isMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c); const digits = c.replace(/\D/g, "");
      if (!isMail && digits.length < 10) return J({ error: "Enter a valid email or WhatsApp number." }, 400);
      await run("INSERT OR IGNORE INTO leads (kind,contact,created) VALUES (?,?,?)", isMail ? "email" : "whatsapp", isMail ? c.toLowerCase() : (digits.length === 10 ? "91" + digits : digits), now());
      return J({ ok: true, message: "You're in! Your weekly card will arrive soon." });
    }
    case "waitlist": { // a fully booked day: leave a name and contact so the reader can message when a slot opens
      const date = clip(b.date, 10), name = clip(b.name, 80), contact = clip(b.contact, 120);
      const isMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact), digits = contact.replace(/\D/g, "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < new Date().toISOString().slice(0, 10) || name.length < 2 || (!isMail && digits.length < 10)) return J({ error: "Add your name, a WhatsApp number or email, and a valid date." }, 400);
      const c = isMail ? contact.toLowerCase() : digits.length === 10 ? "91" + digits : digits;
      if (!(await row("SELECT 1 x FROM waitlist WHERE date=? AND contact=?", date, c))) await run("INSERT INTO waitlist (date,name,contact,service_id,note,created) VALUES (?,?,?,?,?,?)", date, name, c, clip(b.serviceId, 30), clip(b.note, 200), now());
      return J({ ok: true, message: "You're on the waitlist. The reader will message you if a slot opens." });
    }
    case "buy_package": {
      if (!user) return need();
      const s = await row<{ id: string; name: string; price: number; sessions: number }>("SELECT id,name,price,sessions FROM services WHERE id=? AND kind='package' AND active=1", clip(b.serviceId, 30));
      if (!s) return J({ error: "Package not found." }, 404);
      await run("INSERT INTO payments (user_id,label,amount,method,status,sessions,created) VALUES (?,?,?,?, 'pending', ?, ?)", user.id, s.name, s.price, "manual", s.sessions, now());
      return J({ ok: true, label: s.name, price: s.price });
    }
  }
  return J({ error: "Unknown action" }, 400);
}
