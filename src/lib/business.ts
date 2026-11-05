import "server-only";
import { row, run } from "./db";

export type Business = { upiId: string; upiName: string; instagram: string; channel: string; aboutName: string; aboutBio: string; aboutSpecialties: string; aboutExperience: string };
export const BUSINESS_DEFAULT: Business = { upiId: "", upiName: "Spill the Cards", instagram: "", channel: "", aboutName: "", aboutBio: "", aboutSpecialties: "", aboutExperience: "" };
const url = (v: unknown) => { const s = String(v ?? "").trim().slice(0, 300); return /^https?:\/\//i.test(s) ? s : ""; };

export function sanitizeBusiness(raw: unknown): Business {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>; const t = (k: string, n: number) => String(r[k] ?? "").trim().slice(0, n);
  const upi = t("upiId", 60); const upiId = /^[\w.\-]{2,}@[A-Za-z][\w]{1,}$/.test(upi) ? upi : "";
  return { upiId, upiName: t("upiName", 60) || BUSINESS_DEFAULT.upiName, instagram: url(r.instagram), channel: url(r.channel), aboutName: t("aboutName", 80), aboutBio: t("aboutBio", 2500), aboutSpecialties: t("aboutSpecialties", 200), aboutExperience: t("aboutExperience", 300) };
}
export async function getBusiness(): Promise<Business> {
  const v = (await row<{ value: string }>("SELECT value FROM settings WHERE key='business'"))?.value;
  if (!v) return BUSINESS_DEFAULT; try { return sanitizeBusiness(JSON.parse(v)); } catch { return BUSINESS_DEFAULT; }
}
export async function saveBusiness(raw: unknown) {
  const b = sanitizeBusiness(raw);
  await run("INSERT INTO settings (key,value) VALUES ('business',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", JSON.stringify(b)); return b;
}
