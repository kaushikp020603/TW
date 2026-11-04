import "server-only";
import { row, run } from "./db";
import { DEFAULT_CONFIG, sanitizeConfig, type SiteConfig } from "./siteConfig";

export async function getConfig(): Promise<SiteConfig> {
  const v = (await row<{ value: string }>("SELECT value FROM settings WHERE key='site_config'"))?.value;
  if (!v) return DEFAULT_CONFIG;
  try { return sanitizeConfig(JSON.parse(v)); } catch { return DEFAULT_CONFIG; }
}
export async function saveConfig(raw: unknown): Promise<SiteConfig> {
  const cfg = sanitizeConfig(raw);
  await run("INSERT INTO settings (key,value) VALUES ('site_config',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", JSON.stringify(cfg));
  return cfg;
}
