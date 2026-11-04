import { NextResponse } from "next/server";

// Optional AI oracle. Works only when ANTHROPIC_API_KEY is set in the environment.
// Without a key it replies { configured: false } and the UI uses its built-in local oracle.
const hits = new Map<string, { n: number; t: number }>();

const SYSTEM = `You are "The Oracle", a warm, mystical but grounded tarot guide for the website THE ARCANA.
Rules: Tarot is for reflection and entertainment. Never claim certainty about the future. Never give definitive medical, legal or financial predictions or advice; gently suggest a qualified professional for those.
Explain card symbolism, recommend spreads (one-card or three-card Past/Present/Future), and offer reflective questions. Keep answers under 140 words. Reply in the user's language (English or Hindi). When relevant, invite them to book a personal reading.`;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ configured: false });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.t < 60_000) { if (h.n >= 12) return NextResponse.json({ error: "rate_limited" }, { status: 429 }); h.n++; }
  else hits.set(ip, { n: 1, t: now });

  let body: { message?: string; history?: { role: "user" | "assistant"; content: string }[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const message = String(body.message ?? "").slice(0, 600);
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 });
  const history = (body.history ?? []).slice(-8).map((m) => ({ role: m.role, content: String(m.content).slice(0, 800) }));

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ORACLE_MODEL || "claude-haiku-5-5", max_tokens: 400, system: SYSTEM, messages: [...history, { role: "user", content: message }] }),
    });
    if (!r.ok) return NextResponse.json({ configured: true, error: "upstream" }, { status: 502 });
    const data = await r.json();
    const reply = data?.content?.[0]?.text ?? "";
    return NextResponse.json({ configured: true, reply });
  } catch {
    return NextResponse.json({ configured: true, error: "network" }, { status: 502 });
  }
}
