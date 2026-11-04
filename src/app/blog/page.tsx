"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";

type P = { slug: string; title: string; excerpt: string; created: number };
export default function Blog() {
  const [posts, setPosts] = useState<P[] | null>(null);
  useEffect(() => { fetch("/api/site?q=blog").then((r) => r.json()).then((j) => setPosts(j.posts || [])); }, []);
  return (
    <PageShell eyebrow="Stories & guides" title={<>The <span className="gold-text italic">blog</span></>} intro="Tarot symbolism, reading guides and reflections.">
      <div className="grid gap-6 md:grid-cols-2">
        {posts?.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="glass frame block p-6 transition hover:-translate-y-1">
            <p className="text-xs text-ivory/50">{new Date(p.created).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
            <h2 className="font-display mt-1 text-2xl text-champagne">{p.title}</h2>
            <p className="mt-3 text-sm font-light text-ivory/75">{p.excerpt}…</p>
          </Link>))}
        {posts && !posts.length && <p className="text-sm text-ivory/50">No articles yet. Check back soon.</p>}
      </div>
    </PageShell>
  );
}
