import { NextResponse } from "next/server";
import { currentUser, startSession, endSession, hashPw, checkPw, limited } from "@/lib/auth";
import { row, run, now } from "@/lib/db";

const ip = (r: Request) => r.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";

export async function GET() {
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
    return NextResponse.json({ user: await currentUser() });
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
