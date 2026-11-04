import { NextResponse } from "next/server";
import { row } from "@/lib/db";

// Uptime monitors (e.g. UptimeRobot, free) can poll this. 200 = app and database are fine.
export async function GET() {
  const t = Date.now();
  try {
    await row("SELECT 1 AS ok");
    return NextResponse.json({ ok: true, db: "up", ms: Date.now() - t, time: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
