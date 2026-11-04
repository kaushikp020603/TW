import { MAJOR_ARCANA } from "@/data/tarot";

/** Applies admin-edited card meanings (from the database) onto the in-memory deck. Returns true if anything changed. */
export async function syncCards(): Promise<boolean> {
  try {
    const j = await fetch("/api/site?q=cards").then((r) => r.json());
    let changed = false;
    for (const o of j.cards || []) {
      const c = MAJOR_ARCANA[o.id]; if (!c) continue;
      for (const k of ["keywords", "upright", "reversed", "love", "career"] as const) if (o[k] && c[k] !== o[k]) { c[k] = o[k]; changed = true; }
    }
    return changed;
  } catch { return false; }
}
