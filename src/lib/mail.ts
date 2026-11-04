import "server-only";

/** Optional email via Resend (free tier). No-op unless RESEND_API_KEY is set. */
export async function sendMail(to: string | null | undefined, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "THE ARCANA <onboarding@resend.dev>", to, subject, text }),
    });
    return r.ok;
  } catch { return false; }
}
