import { NextResponse } from "next/server";
import { row, rows } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// GET /api/public?q=services | slots&date=YYYY-MM-DD | reviews
export async function GET(req: Request) {
  const u = new URL(req.url); const q = u.searchParams.get("q");
  if (q === "services") return NextResponse.json({ services: await rows("SELECT id,name,price,mins,blurb,kind,sessions FROM services WHERE active=1 ORDER BY sort") });
  if (q === "reviews") return NextResponse.json({ reviews: await rows("SELECT name,category,text FROM reviews WHERE approved=1 ORDER BY created DESC LIMIT 12") });
  if (q === "slots") {
    const date = u.searchParams.get("date") || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "bad date" }, { status: 400 });
    const user = await currentUser();
    const [dayBlockedRow, takenRows, blockedRows, premiumRow, all] = await Promise.all([
      row("SELECT 1 x FROM blocked WHERE date=? AND time IS NULL", date),
      rows<{ time: string }>("SELECT time FROM bookings WHERE date=? AND status IN ('pending','confirmed')", date),
      rows<{ time: string }>("SELECT time FROM blocked WHERE date=? AND time IS NOT NULL", date),
      user ? row("SELECT 1 x FROM users WHERE id=? AND premium=1", user.id) : Promise.resolve(undefined),
      rows<{ time: string; priority: number }>("SELECT time,priority FROM slots ORDER BY sort"),
    ]);
    const dayBlocked = !!dayBlockedRow, premium = !!premiumRow;
    const taken = new Set(takenRows.map((r) => r.time)), blocked = new Set(blockedRows.map((r) => r.time));
    const slots = all.filter((s) => !s.priority || premium).map((s) => ({ time: s.time, priority: !!s.priority, available: !dayBlocked && !taken.has(s.time) && !blocked.has(s.time) }));
    return NextResponse.json({ slots, dayBlocked, priorityHidden: !premium && all.some((s) => s.priority) });
  }
  return NextResponse.json({ error: "bad query" }, { status: 400 });
}
