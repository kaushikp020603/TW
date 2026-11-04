import "server-only";
import { row, run, rows, now } from "./db";

// Tables whose deletions can be undone from Settings → Recently deleted, with their key column.
const PK: Record<string, string> = { posts: "id", reviews: "id", coupons: "code", announcements: "id", readings: "id", notes: "id" };

export async function trashDelete(tbl: string, key: string | number, label: string) {
  const pk = PK[tbl]; if (!pk) throw new Error("not trashable");
  const r = await row<Record<string, unknown>>(`SELECT * FROM ${tbl} WHERE ${pk}=?`, key);
  if (!r) return;
  await run("INSERT INTO trash (tbl,label,payload,deleted) VALUES (?,?,?,?)", tbl, label.slice(0, 120), JSON.stringify(r), now());
  await run(`DELETE FROM ${tbl} WHERE ${pk}=?`, key);
}
export async function restoreTrash(id: number) {
  const t = await row<{ tbl: string; payload: string }>("SELECT tbl,payload FROM trash WHERE id=?", id);
  if (!t || !PK[t.tbl]) return false;
  const obj = JSON.parse(t.payload) as Record<string, string | number | null>; const cols = Object.keys(obj).filter((c) => /^[a-z_]+$/.test(c));
  await run(`INSERT OR REPLACE INTO ${t.tbl} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`, ...cols.map((c) => obj[c]));
  await run("DELETE FROM trash WHERE id=?", id); return true;
}
export async function listTrash() {
  await run("DELETE FROM trash WHERE deleted<?", now() - 30 * 864e5); // keep 30 days
  return rows("SELECT id,tbl,label,deleted FROM trash ORDER BY deleted DESC LIMIT 100");
}
