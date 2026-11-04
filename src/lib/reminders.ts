import "server-only";
import { rows } from "./db";
import { sendMail } from "./mail";

const dayKey = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const tomorrowKey = () => dayKey(new Date(Date.now() + 864e5));

/** Emails tomorrow's confirmed/pending bookings that belong to an account with an email (needs RESEND_API_KEY). */
export async function sendReminders() {
  const list = await rows<{ code: string; name: string; service_name: string; time: string; email: string; meeting_link: string | null }>(
    "SELECT b.code,b.name,b.service_name,b.time,b.meeting_link,u.email FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.date=? AND b.status IN ('pending','confirmed')", tomorrowKey());
  let sent = 0;
  for (const b of list) if (await sendMail(b.email, "Reminder: your reading is tomorrow", `Hi ${b.name}, a gentle reminder of your ${b.service_name} tomorrow at ${b.time}.${b.meeting_link ? " Join here: " + b.meeting_link : ""} Ref ${b.code}.`)) sent++;
  return { eligible: list.length, sent, emailConfigured: !!process.env.RESEND_API_KEY };
}
