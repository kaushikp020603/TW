import { NextResponse } from "next/server";
import { currentUser, startSession, endSession, hashPw, checkPw, limited } from "@/lib/auth";
import { row, run, now } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { siteOrigin } from "@/lib/origin";
import { hashToken, makeToken } from "@/lib/tokens";

const ip = (r: Request) => r.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";

export async function GET(req: Request) {
  const verify = new URL(req.url).searchParams.get("verify");
  if (verify) { // email verification link
    const h = hashToken(verify);
    const t = await row<{ user_id: number; expires: number; used: number }>("SELECT user_id,expires,used FROM tokens WHERE hash=? AND purpose='verify'", h);
    if (!t || t.used || t.expires < now()) return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
    await run("UPDATE users SET email_verified=1 WHERE id=?", t.user_id);
    await run("UPDATE tokens SET used=1 WHERE hash=?", h);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ user: await currentUser() });
}

export async function POST(req: Request) {
  if (await limited("auth:" + ip(req), 15)) return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  const email = String(b.email || "").trim().toLowerCase().slice(0, 120);

  if (action === "register") {
    const name = String(b.name || "").trim().slice(0, 80), pw = String(b.password || ""), phone = String(b.phone || "").trim().slice(0, 20);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || name.length < 2 || pw.length < 8) return NextResponse.json({ error: "Enter a valid email, your name and a password of 8+ characters." }, { status: 400 });
    if (await row("SELECT id FROM users WHERE email=?", email)) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const r = await run("INSERT INTO users (email,name,phone,hash,created) VALUES (?,?,?,?,?)", email, name, phone || null, hashPw(pw), now());
    await startSession(Number(r.lastInsertRowid));
    if (process.env.RESEND_API_KEY) {
      const t = await makeToken(Number(r.lastInsertRowid), "verify", 3 * 864e5);
      void sendMail(email, "Confirm your email for THE ARCANA", `Hi ${name}, please confirm your email: ${siteOrigin(req)}/verify?token=${t}`);
    }
    return NextResponse.json({ user: await currentUser() });
  }
  if (action === "forgot") { // always answers the same, so it never reveals whether an account exists
    const u = email ? await row<{ id: number }>("SELECT id FROM users WHERE email=?", email) : undefined;
    const mailOn = !!process.env.RESEND_API_KEY;
    if (u) {
      await run("INSERT INTO reset_requests (user_id,email,created) VALUES (?,?,?)", u.id, email, now());
      if (mailOn) {
        const t = await makeToken(u.id, "reset", 3600e3);
        void sendMail(email, "Reset your THE ARCANA password", `Use this link within one hour to choose a new password: ${siteOrigin(req)}/reset?token=${t}\n\nIf you did not ask for this, you can ignore this message.`);
      }
    }
    return NextResponse.json({ ok: true, emailSent: mailOn });
  }
  if (action === "reset") {
    const token = String(b.token || ""), pw = String(b.password || "");
    if (pw.length < 8) return NextResponse.json({ error: "Choose a password of at least 8 characters." }, { status: 400 });
    const h = hashToken(token);
    const t = await row<{ user_id: number; expires: number; used: number }>("SELECT user_id,expires,used FROM tokens WHERE hash=? AND purpose='reset'", h);
    if (!t || t.used || t.expires < now()) return NextResponse.json({ error: "This reset link is invalid or has expired. Please request a new one." }, { status: 400 });
    await run("UPDATE users SET hash=? WHERE id=?", hashPw(pw), t.user_id);
    await run("UPDATE tokens SET used=1 WHERE hash=?", h);
    await run("DELETE FROM sessions WHERE user_id=?", t.user_id);
    await run("UPDATE reset_requests SET handled=1 WHERE user_id=?", t.user_id);
    return NextResponse.json({ ok: true });
  }
  if (action === "login") {
    const u = await row<{ id: number; hash: string }>("SELECT id,hash FROM users WHERE email=?", email);
    if (!u || !checkPw(String(b.password || ""), u.hash)) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    await startSession(u.id);
    return NextResponse.json({ user: await currentUser() });
  }
  if (action === "logout") { await endSession(); return NextResponse.json({ ok: true }); }
  if (action === "delete") {
    const u = await currentUser();
    if (!u) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    await run("DELETE FROM readings WHERE user_id=?", u.id);
    await run("DELETE FROM journal WHERE user_id=?", u.id);
    await run("DELETE FROM messages WHERE user_id=?", u.id);
    await run("UPDATE bookings SET user_id=NULL, phone=NULL WHERE user_id=?", u.id);
    await run("DELETE FROM sessions WHERE user_id=?", u.id);
    await run("DELETE FROM users WHERE id=?", u.id);
    await endSession();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
