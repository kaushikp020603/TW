import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { SITE_URL } from "@/config/site";
import { MAJOR_ARCANA } from "@/data/tarot";
import { cardSlug } from "@/data/cardSeo";
import { rows } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // read the database at request time, not at build time
  const now = new Date();
  const fixed = ["", "/about", "/gift", "/cards", "/insights", "/journey", "/community", "/blog", "/readers", "/privacy", "/terms", "/disclaimer"].map((p) => ({ url: SITE_URL + p, lastModified: now, changeFrequency: (p === "" ? "weekly" : "monthly") as "weekly" | "monthly", priority: p === "" ? 1 : p === "/cards" || p === "/about" ? 0.8 : 0.5 }));
  const cards = MAJOR_ARCANA.map((c) => ({ url: `${SITE_URL}/cards/${cardSlug(c.name)}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 }));
  let posts: MetadataRoute.Sitemap = [];
  try { posts = (await rows<{ slug: string; created: number }>("SELECT slug,created FROM posts WHERE published=1")).map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.created), changeFrequency: "monthly" as const, priority: 0.6 })); } catch { /* database unavailable: static pages still listed */ }
  return [...fixed, ...cards, ...posts];
}
