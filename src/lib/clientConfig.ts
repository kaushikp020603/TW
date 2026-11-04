import { DEFAULT_CONFIG, sanitizeConfig, type SiteConfig } from "./siteConfig";

/** Fetches the admin-controlled experience settings (music + intro). Falls back to the last known or default values. */
export async function loadConfig(): Promise<SiteConfig> {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch("/api/site?q=config", { signal: ctl.signal, cache: "no-store" }); clearTimeout(t);
    const cfg = sanitizeConfig(await r.json());
    try { sessionStorage.setItem("arcana-cfg", JSON.stringify(cfg)); } catch {}
    return cfg;
  } catch {
    try { return sanitizeConfig(JSON.parse(sessionStorage.getItem("arcana-cfg") || "null")); } catch { return DEFAULT_CONFIG; }
  }
}
