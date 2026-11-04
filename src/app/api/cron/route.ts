import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { storeBackup } from "@/lib/backup";
import { sendReminders } from "@/lib/reminders";

// Called by Vercel Cron (see vercel.json). Vercel sends an Authorization Bearer header when CRON_SECRET is set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const ok = (secret && auth === `Bearer ${secret}`) || (await isAdmin());
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const job = new URL(req.url).searchParams.get("job");
  if (job === "backup") return NextResponse.json({ ok: true, ...(await storeBackup("auto")) });
  if (job === "reminders") return NextResponse.json({ ok: true, ...(await sendReminders()) });
  return NextResponse.json({ error: "Unknown job" }, { status: 400 });
}
