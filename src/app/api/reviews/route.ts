import { NextResponse } from "next/server";
import { run, now } from "@/lib/db";
import { limited } from "@/lib/auth";

export async function POST(req: Request) {
  if (await limited("rev:" + (req.headers.get("x-forwarded-for") ?? "local"), 3, 600_000)) return NextResponse.json({ error: "Please wait before sending another review." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").trim().slice(0, 500), name = String(b.name || "Anonymous").trim().slice(0, 50) || "Anonymous";
  if (text.length < 10 || !b.permission) return NextResponse.json({ error: "Write at least a sentence and confirm permission to publish." }, { status: 400 });
  await run("INSERT INTO reviews (name,category,text,created) VALUES (?,?,?,?)", name, String(b.category || "").slice(0, 40), text, now());
  return NextResponse.json({ ok: true, message: "Thank you! Your review will appear once it's approved." });
}
