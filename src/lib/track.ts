"use client";
// Cookie-free analytics events. Respects Do Not Track. Never sends personal data.
export type EventType = "pageview" | "reading_start" | "reading_complete" | "booking_start" | "booking_submit" | "wa_click" | "share" | "signup" | "intro_skip" | "install" | "subscribe";

function send(body: object) {
  try {
    const data = JSON.stringify(body);
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", new Blob([data], { type: "application/json" }))) return;
    void fetch("/api/track", { method: "POST", body: data, headers: { "content-type": "application/json" }, keepalive: true });
  } catch { /* analytics must never break the page */ }
}
const dnt = () => typeof navigator !== "undefined" && (navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1");

export function track(type: EventType, ref?: string) {
  if (typeof window === "undefined" || dnt() || location.pathname.startsWith("/admin")) return;
  send({ type, path: location.pathname, ref });
}
export function reportError(msg: string) {
  if (typeof window === "undefined" || location.pathname.startsWith("/admin")) return;
  send({ type: "error", path: location.pathname, msg });
}
/** Fire an event only once per page visit (e.g. "booking_start"). */
const once = new Set<string>();
export function trackOnce(type: EventType) { const k = type + location.pathname; if (once.has(k)) return; once.add(k); track(type); }
