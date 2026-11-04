import "server-only";
import crypto from "node:crypto";
import { row, run } from "./db";

export const REFERRAL_PERCENT = 10;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alike characters

/** A friend-invite code like ARC-7KQ2M, created on first use and kept for the account. */
export async function refCodeFor(userId: number): Promise<string> {
  const cur = (await row<{ ref_code: string | null }>("SELECT ref_code FROM users WHERE id=?", userId))?.ref_code;
  if (cur) return cur;
  for (let i = 0; i < 6; i++) {
    const bytes = crypto.randomBytes(5); const code = "ARC-" + [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
    try { await run("UPDATE users SET ref_code=? WHERE id=? AND ref_code IS NULL", code, userId); } catch { continue; } // unique clash: try again
    const now = (await row<{ ref_code: string | null }>("SELECT ref_code FROM users WHERE id=?", userId))?.ref_code;
    if (now) return now;
  }
  throw new Error("could not create referral code");
}

/** When a referred booking is completed, the friend who invited gets one free-session credit (once). */
export async function rewardReferral(bookingId: number): Promise<boolean> {
  const b = await row<{ referrer_id: number | null; ref_rewarded: number }>("SELECT referrer_id,ref_rewarded FROM bookings WHERE id=?", bookingId);
  if (!b?.referrer_id || b.ref_rewarded) return false;
  const r = await run("UPDATE bookings SET ref_rewarded=1 WHERE id=? AND ref_rewarded=0", bookingId);
  if (!r.changes) return false;
  await run("UPDATE users SET credits=credits+1 WHERE id=?", b.referrer_id);
  return true;
}
