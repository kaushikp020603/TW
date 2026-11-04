// Lightweight cross-section actions (no global state library needed).
export type ReadCategory = "general" | "love" | "career";

export function goTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}
export function startReading(category?: ReadCategory) {
  window.dispatchEvent(new CustomEvent("arcana:read", { detail: { category } }));
  goTo("reading");
}
export function startBooking(serviceId?: string) {
  window.dispatchEvent(new CustomEvent("arcana:book", { detail: { serviceId } }));
  goTo("book");
}
export function openOracle() { window.dispatchEvent(new CustomEvent("arcana:oracle")); }
