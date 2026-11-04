import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { row, run, now } from "./db";

export type User = { id: number; email: string; name: string; phone: string | null };

// Secure cookies on Vercel (https). Plain http (local dev / tunnels' origin) keeps working.
const SECURE = process.env.VERCEL === "1";

export function hashPw(pw: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
export function checkPw(pw: string, stored: string) {
  const [salt, h] = stored.split(":");
  const a = Buffer.from(h, "hex"), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function startSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  await run("INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)", token, userId, now() + 30 * 864e5);
  (await cookies()).set("arcana_sid", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86400, secure: SECURE });
}
export async function endSession() {
  const c = await cookies(); const t = c.get("arcana_sid")?.value;
  if (t) await run("DELETE FROM sessions WHERE token=?", t);
  c.delete("arcana_sid");
}
export async function currentUser(): Promise<User | null> {
  const t = (await cookies()).get("arcana_sid")?.value;
  if (!t) return null;
  const u = await row<User>("SELECT u.id,u.email,u.name,u.phone FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?", t, now());
  return u ?? null;
}

// ── Admin: password from ADMIN_PASSWORD (or a changed one stored hashed in the DB). The cookie is an HMAC, never the password.
const storedHash = async () => (await row<{ value: string }>("SELECT value FROM settings WHERE key='admin_hash'"))?.value || "";
const adminToken = (hash: string) => crypto.createHmac("sha256", (process.env.ADMIN_PASSWORD || "arcana") + hash).update("arcana-admin-v1").digest("hex");
export async function adminConfigured() { return !!process.env.ADMIN_PASSWORD || !!(await storedHash()); }
async function passwordOk(pw: string) {
  const h = await storedHash();
  if (h) return checkPw(pw, h);
  const p = process.env.ADMIN_PASSWORD;
  return !!p && pw.length === p.length && crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(p));
}
export async function adminChangePassword(current: string, next: string) {
  if (!(await passwordOk(current)) || next.length < 8) return false;
  await run("INSERT INTO settings (key,value) VALUES ('admin_hash',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", hashPw(next));
  return true;
}
export async function adminLogin(pw: string) {
  if (!(await passwordOk(pw))) return false;
  (await cookies()).set("arcana_admin", adminToken(await storedHash()), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 8 * 3600, secure: SECURE });
  return true;
}
export async function isAdmin() {
  if (!(await adminConfigured())) return false;
  const t = (await cookies()).get("arcana_admin")?.value; const want = adminToken(await storedHash());
  return !!t && t.length === want.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(want));
}

// Rate limiter stored in the database, so it works across serverless instances (Vercel).
export async function limited(key: string, max: number, windowMs = 60_000) {
  const t = Date.now();
  await run("INSERT INTO ratelimit (k, ts) VALUES (?, ?)", key, t);
  const c = await row<{ c: number }>("SELECT COUNT(*) AS c FROM ratelimit WHERE k=? AND ts>?", key, t - windowMs);
  if (Math.random() < 0.05) await run("DELETE FROM ratelimit WHERE ts<?", t - 3_600_000); // occasional cleanup
  return (c?.c ?? 0) > max;
}
