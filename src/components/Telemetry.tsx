"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { reportError, track } from "@/lib/track";

declare global { interface Window { __installPrompt?: Event & { prompt: () => Promise<void> } } }

/** Page views, WhatsApp clicks, error reporting, text-size preference and service-worker registration. */
export default function Telemetry() {
  const path = usePathname();
  useEffect(() => { if (!path.startsWith("/admin")) track("pageview", document.referrer || undefined); }, [path]);

  useEffect(() => {
    try { if (localStorage.getItem("arcana-text") === "large") document.documentElement.dataset.text = "large"; } catch {}
    const onErr = (e: ErrorEvent) => { if (e.message && !/ResizeObserver|Script error/i.test(e.message)) reportError(`${e.message} @ ${(e.filename || "").split("/").pop()}:${e.lineno}`); };
    const onRej = (e: PromiseRejectionEvent) => { const m = String((e.reason && (e.reason.message || e.reason)) || ""); if (m && !/AbortError|NotAllowedError|play\(\)/i.test(m)) reportError("Unhandled: " + m); };
    const onClick = (e: MouseEvent) => { const a = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null; if (a && /wa\.me|api\.whatsapp\.com/.test(a.href)) track("wa_click"); };
    const onPrompt = (e: Event) => { e.preventDefault(); window.__installPrompt = e as Window["__installPrompt"]; window.dispatchEvent(new Event("arcana:installable")); };
    const onInstalled = () => { track("install"); window.__installPrompt = undefined; window.dispatchEvent(new Event("arcana:installable")); };
    addEventListener("error", onErr); addEventListener("unhandledrejection", onRej); document.addEventListener("click", onClick);
    addEventListener("beforeinstallprompt", onPrompt); addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => { removeEventListener("error", onErr); removeEventListener("unhandledrejection", onRej); document.removeEventListener("click", onClick); removeEventListener("beforeinstallprompt", onPrompt); removeEventListener("appinstalled", onInstalled); };
  }, []);
  return null;
}
