import "server-only";
import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { SERVICES, SITE } from "@/config/site";

/**
 * Database layer (libSQL = SQLite-compatible).
 *  - Production / Vercel: set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) → hosted Turso database.
 *  - Local development: no env needed → a file at ./data/arcana.db (or ARCANA_DATA_DIR).
 */
const g = globalThis as unknown as { __arcana?: { client: Client; ready: Promise<void> } };

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT, hash TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL, mins TEXT, blurb TEXT, active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY, code TEXT UNIQUE, user_id INTEGER, name TEXT NOT NULL, phone TEXT, service_id TEXT NOT NULL, service_name TEXT, price INTEGER, discount INTEGER DEFAULT 0, coupon TEXT, date TEXT NOT NULL, time TEXT NOT NULL, note TEXT, status TEXT NOT NULL DEFAULT 'pending', created INTEGER NOT NULL, updated INTEGER);
  CREATE TABLE IF NOT EXISTS blocked (id INTEGER PRIMARY KEY, date TEXT NOT NULL, time TEXT, UNIQUE(date, time));
  CREATE TABLE IF NOT EXISTS slots (time TEXT PRIMARY KEY, sort INTEGER);
  CREATE TABLE IF NOT EXISTS coupons (code TEXT PRIMARY KEY, kind TEXT NOT NULL, value INTEGER NOT NULL, active INTEGER DEFAULT 1, uses INTEGER DEFAULT 0, max_uses INTEGER);
  CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT, text TEXT NOT NULL, approved INTEGER DEFAULT 0, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, spread TEXT, category TEXT, question TEXT, cards TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, created INTEGER);
  CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, booking_id INTEGER, user_id INTEGER, label TEXT, amount INTEGER NOT NULL, method TEXT, status TEXT NOT NULL DEFAULT 'paid', note TEXT, sessions INTEGER DEFAULT 0, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS card_overrides (id INTEGER PRIMARY KEY, keywords TEXT, upright TEXT, reversed TEXT, love TEXT, career TEXT);
  CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, published INTEGER DEFAULT 1, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY, text TEXT NOT NULL, active INTEGER DEFAULT 1, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS journal (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, text TEXT NOT NULL, mood TEXT, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, sender TEXT NOT NULL, text TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS threads (id INTEGER PRIMARY KEY, user_id INTEGER, name TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, approved INTEGER DEFAULT 0, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS replies (id INTEGER PRIMARY KEY, thread_id INTEGER NOT NULL, user_id INTEGER, name TEXT NOT NULL, body TEXT NOT NULL, approved INTEGER DEFAULT 0, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, entity TEXT NOT NULL, ref INTEGER NOT NULL, text TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY, text TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, data BLOB NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, purpose TEXT NOT NULL, expires INTEGER NOT NULL, used INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS reset_requests (id INTEGER PRIMARY KEY, user_id INTEGER, email TEXT, created INTEGER NOT NULL, handled INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, type TEXT NOT NULL, path TEXT, ref TEXT, vid TEXT);
  CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts, type);
  CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT, price INTEGER NOT NULL, blurb TEXT, details TEXT, art TEXT DEFAULT 'moon', active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, stock INTEGER, image INTEGER);
  CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, code TEXT UNIQUE, product_id TEXT, product_name TEXT, qty INTEGER, total INTEGER, name TEXT, phone TEXT, note TEXT, status TEXT DEFAULT 'new', created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS consents (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, vid TEXT, choice TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS errors (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, source TEXT, message TEXT, path TEXT, ua TEXT);
  CREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY, created INTEGER NOT NULL, kind TEXT, size INTEGER, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS trash (id INTEGER PRIMARY KEY, tbl TEXT NOT NULL, label TEXT, payload TEXT NOT NULL, deleted INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, contact TEXT NOT NULL UNIQUE, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS waitlist (id INTEGER PRIMARY KEY, date TEXT NOT NULL, name TEXT NOT NULL, contact TEXT NOT NULL, service_id TEXT, note TEXT, created INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_waitlist_date ON waitlist (date);
  CREATE TABLE IF NOT EXISTS ratelimit (id INTEGER PRIMARY KEY, k TEXT NOT NULL, ts INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_ratelimit ON ratelimit (k, ts);
  CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (date, time);
  CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id);
  CREATE TABLE IF NOT EXISTS readers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, bio TEXT, specialties TEXT, whatsapp TEXT NOT NULL, email TEXT, verified INTEGER DEFAULT 0, main INTEGER DEFAULT 0, created INTEGER NOT NULL);
`;
const MIGRATIONS = [
  "ALTER TABLE products ADD COLUMN image INTEGER",
  "DELETE FROM products WHERE id IN ('guidance-deck','pocket-tarot','affirmation-12','custom-card','digital-pack')",
  "ALTER TABLE products ADD COLUMN stock INTEGER",
  "ALTER TABLE reviews ADD COLUMN rating INTEGER DEFAULT 5", "ALTER TABLE reviews ADD COLUMN city TEXT", "ALTER TABLE reviews ADD COLUMN place TEXT DEFAULT 'all'",
  "ALTER TABLE reviews ADD COLUMN featured INTEGER DEFAULT 0", "ALTER TABLE reviews ADD COLUMN sort INTEGER DEFAULT 0",
  "ALTER TABLE events ADD COLUMN country TEXT", "ALTER TABLE events ADD COLUMN region TEXT", "ALTER TABLE events ADD COLUMN city TEXT",
  "ALTER TABLE events ADD COLUMN device TEXT", "ALTER TABLE events ADD COLUMN lang TEXT", "ALTER TABLE events ADD COLUMN src TEXT",
  "CREATE TABLE IF NOT EXISTS consents (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, vid TEXT, choice TEXT NOT NULL)",
  "ALTER TABLE bookings ADD COLUMN summary TEXT", "ALTER TABLE bookings ADD COLUMN summary_cards TEXT", "ALTER TABLE bookings ADD COLUMN referrer_id INTEGER", "ALTER TABLE bookings ADD COLUMN ref_rewarded INTEGER DEFAULT 0", "ALTER TABLE users ADD COLUMN ref_code TEXT",
  "CREATE UNIQUE INDEX IF NOT EXISTS uniq_ref_code ON users (ref_code)",
  "ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0", "ALTER TABLE users ADD COLUMN premium INTEGER DEFAULT 0", "ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0",
  "ALTER TABLE services ADD COLUMN kind TEXT DEFAULT 'reading'", "ALTER TABLE services ADD COLUMN sessions INTEGER DEFAULT 0",
  "ALTER TABLE slots ADD COLUMN priority INTEGER DEFAULT 0",
  "CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_slot ON bookings (date, time) WHERE status IN ('pending','confirmed')",
  "ALTER TABLE bookings ADD COLUMN meeting_link TEXT", "ALTER TABLE bookings ADD COLUMN used_credit INTEGER DEFAULT 0", "ALTER TABLE bookings ADD COLUMN kind TEXT DEFAULT 'reading'",
];

function connect(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const dir = process.env.ARCANA_DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return createClient({ url: "file:" + path.join(dir, "arcana.db").replace(/\\/g, "/") });
}

// Bump SCHEMA_VERSION whenever the schema or seed data changes. Cold starts then cost a single query once migrated.
const SCHEMA_VERSION = "v11:" + SITE.whatsappNumber;

async function init(c: Client) {
  try { const v = await c.execute("SELECT value FROM settings WHERE key='schema_version'"); if (v.rows[0]?.value === SCHEMA_VERSION) return; } catch { /* first run: tables don't exist yet */ }
  try { await c.execute("PRAGMA journal_mode = WAL"); } catch { /* not supported remotely */ }
  await c.executeMultiple(SCHEMA);
  for (const sql of MIGRATIONS) { try { await c.execute(sql); } catch { /* column already exists */ } }
  const count = async (t: string) => Number((await c.execute(`SELECT COUNT(*) AS c FROM ${t}`)).rows[0].c);
  if (!(await count("services"))) for (const [i, s] of SERVICES.entries()) await c.execute({ sql: "INSERT INTO services (id,name,price,mins,blurb,sort) VALUES (?,?,?,?,?,?)", args: [s.id, s.name, s.price, s.mins, s.blurb, i] });
  if (!(await count("slots"))) {
    for (const [i, t] of ["10:00 AM", "11:30 AM", "1:00 PM", "3:00 PM", "4:30 PM", "6:00 PM", "7:30 PM", "9:00 PM"].entries()) await c.execute({ sql: "INSERT INTO slots (time, sort) VALUES (?,?)", args: [t, i] });
    await c.execute("INSERT OR IGNORE INTO coupons (code, kind, value) VALUES ('WELCOME10','percent',10)");
  }
  const addSvc = "INSERT OR IGNORE INTO services (id,name,price,mins,blurb,sort,kind,sessions) VALUES (?,?,?,?,?,?,?,?)";
  for (const a of [
    ["video30", "Video Session · 30 min", 999, "30 min video", "A private video call. A meeting link is shared once confirmed.", 20, "video", 0],
    ["voice30", "Voice Session · 30 min", 799, "30 min audio", "An audio-only reading, from wherever you are.", 21, "voice", 0],
    ["pack3", "Package · 3 Readings", 499, "Use any time", "Three readings, bought together at a saving. Credits are added once payment is confirmed.", 30, "package", 3],
    ["pack5", "Package · 5 Readings", 799, "Use any time", "Five readings, best value. Credits are added once payment is confirmed.", 31, "package", 5],
  ] as const) await c.execute({ sql: addSvc, args: [...a] });
  await c.execute("UPDATE services SET kind='reading' WHERE kind IS NULL");
  await c.execute({ sql: "INSERT OR IGNORE INTO slots (time,sort,priority) VALUES (?,?,1)", args: ["8:00 AM", 100] });
  await c.execute({ sql: "INSERT OR IGNORE INTO slots (time,sort,priority) VALUES (?,?,1)", args: ["10:30 PM", 101] });
  if (!(await count("readers"))) await c.execute({ sql: "INSERT INTO readers (name,bio,specialties,whatsapp,verified,main,created) VALUES (?,?,?,?,1,1,?)", args: ["The Arcana Reader", "Your host. Readings are reflective conversations, not verdicts.", "Love · Career · Self-discovery", SITE.whatsappNumber, Date.now()] });
  await c.execute({ sql: "UPDATE readers SET whatsapp=? WHERE main=1", args: [SITE.whatsappNumber] }); // host reader always uses the site contact number
  await c.execute({ sql: "INSERT INTO settings (key,value) VALUES ('schema_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", args: [SCHEMA_VERSION] });
}

/** Returns a ready client (schema created, seed data present). */
export async function db(): Promise<Client> {
  if (!g.__arcana) { const client = connect(); g.__arcana = { client, ready: init(client) }; g.__arcana.ready.catch(() => { g.__arcana = undefined; }); }
  await g.__arcana.ready;
  return g.__arcana.client;
}

export const now = () => Date.now();
type Arg = string | number | null;
const plain = <T,>(rs: { columns: string[]; rows: ArrayLike<unknown>[] }): T[] => rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])) as T);

export async function rows<T = Record<string, unknown>>(sql: string, ...a: Arg[]): Promise<T[]> { return plain<T>(await (await db()).execute({ sql, args: a })); }
export async function row<T = Record<string, unknown>>(sql: string, ...a: Arg[]): Promise<T | undefined> { return (await rows<T>(sql, ...a))[0]; }
export async function run(sql: string, ...a: Arg[]) { const r = await (await db()).execute({ sql, args: a }); return { changes: r.rowsAffected, lastInsertRowid: Number(r.lastInsertRowid ?? 0) }; }
