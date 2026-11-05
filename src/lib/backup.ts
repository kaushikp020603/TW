import "server-only";
import { rows, run, now } from "./db";

const TABLES = ["products", "orders", "services", "bookings", "payments", "coupons", "blocked", "slots", "reviews", "readings", "card_overrides", "posts", "announcements", "threads", "replies", "readers", "notes", "activity", "journal", "leads"];

/** Builds a JSON snapshot of the business data (never password hashes, sessions, tokens or audio blobs). */
export async function snapshot() {
  const dump: Record<string, unknown> = { exported: new Date().toISOString() };
  const parts = await Promise.all(TABLES.map((t) => rows(`SELECT * FROM ${t}`)));
  TABLES.forEach((t, i) => (dump[t] = parts[i]));
  dump.users = await rows("SELECT id,email,name,phone,premium,credits,email_verified,created FROM users");
  dump.settings = await rows("SELECT key,value FROM settings WHERE key IN ('site_config','business')");
  return dump;
}
/** Stores a snapshot in the database and keeps the newest 14. */
export async function storeBackup(kind: "auto" | "manual") {
  const json = JSON.stringify(await snapshot());
  const r = await run("INSERT INTO backups (created,kind,size,data) VALUES (?,?,?,?)", now(), kind, json.length, json);
  await run("DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY created DESC LIMIT 14)");
  return { id: r.lastInsertRowid, size: json.length };
}
