import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { rows, run, now, row } from "@/lib/db";

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ readings: [] });
  return NextResponse.json({ readings: await rows("SELECT id,spread,category,question,cards,created FROM readings WHERE user_id=? ORDER BY created DESC LIMIT 30", u.id) });
}
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Sign in to save readings." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.consent) return NextResponse.json({ error: "Consent is required to save a reading." }, { status: 400 });
  const cards = JSON.stringify(b.cards ?? []).slice(0, 4000);
  await run("INSERT INTO readings (user_id,spread,category,question,cards,created) VALUES (?,?,?,?,?,?)", u.id, String(b.spread || ""), String(b.category || ""), String(b.question || "").slice(0, 240), cards, now());
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (await row("SELECT 1 x FROM readings WHERE id=? AND user_id=?", id, u.id)) await run("DELETE FROM readings WHERE id=?", id);
  return NextResponse.json({ ok: true });
}
