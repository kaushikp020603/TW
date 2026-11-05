import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { row, run, now } from "@/lib/db";
import { limited } from "@/lib/auth";

// POST /api/shop  { product, qty, name, phone?, note? } -> { code }. The buyer then sends the order on WhatsApp.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (await limited("shop:" + ip, 8, 10 * 60_000)) return NextResponse.json({ error: "Too many orders just now. Please try again in a few minutes." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as { product?: string; qty?: number; name?: string; phone?: string; note?: string };
  const p = await row<{ id: string; name: string; price: number; kind: string; stock: number | null }>("SELECT id,name,price,kind,stock FROM products WHERE id=? AND active=1", String(b.product || ""));
  if (!p) return NextResponse.json({ error: "That product is not available." }, { status: 404 });
  const name = String(b.name || "").trim().slice(0, 60);
  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  const note = String(b.note || "").trim().slice(0, 300);
  if (/custom/i.test(p.kind) && !note) return NextResponse.json({ error: "Please describe the card you would like." }, { status: 400 });
  const qty = Math.min(10, Math.max(1, Math.floor(Number(b.qty) || 1)));
  if (p.stock !== null && p.stock !== undefined) {
    if (p.stock < qty) return NextResponse.json({ error: p.stock <= 0 ? "Sorry, this is sold out right now." : `Only ${p.stock} left. Please lower the quantity.` }, { status: 409 });
    await run("UPDATE products SET stock=stock-? WHERE id=? AND stock>=?", qty, p.id, qty);
  }
  const code = "SHOP-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  await run("INSERT INTO orders (code,product_id,product_name,qty,total,name,phone,note,status,created) VALUES (?,?,?,?,?,?,?,?,?,?)", code, p.id, p.name, qty, p.price * qty, name, String(b.phone || "").replace(/[^\d+ ]/g, "").slice(0, 20), note, "new", now());
  return NextResponse.json({ ok: true, code });
}
