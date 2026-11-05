"use client";
// Visitor choice about optional analytics (location, language, campaign source). Stored only in this browser.
export type Consent = "all" | "essential" | null;
const KEY = "stc-consent";
export function getConsent(): Consent {
  try { const v = localStorage.getItem(KEY); return v === "all" || v === "essential" ? v : null; } catch { return null; }
}
export function setConsent(v: "all" | "essential") {
  try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
  window.dispatchEvent(new Event("stc:consent"));
}
