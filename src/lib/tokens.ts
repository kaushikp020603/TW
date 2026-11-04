import "server-only";
import crypto from "node:crypto";
import { run, now } from "./db";

export const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");
/** Creates a single-use token (stored only as a hash) and returns the raw value to put in a link. */
export async function makeToken(userId: number, purpose: "reset" | "verify", ttlMs: number) {
  const raw = crypto.randomBytes(32).toString("base64url");
  await run("INSERT INTO tokens (hash,user_id,purpose,expires) VALUES (?,?,?,?)", hashToken(raw), userId, purpose, now() + ttlMs);
  return raw;
}
