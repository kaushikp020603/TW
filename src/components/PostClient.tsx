"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";

export default function PostClient({ slug }: { slug: string }) {
  const [p, setP] = useState<{ title: string; body: string; created: number } | null | undefined>(undefined);
  useEffect(() => { fetch(`/api/site?q=post&slug=${encodeURIComponent(slug)}`).then((r) => r.json()).then((j) => setP(j.post ?? null)); }, [slug]);
  return (
    <PageShell eyebrow="Blog" title={p ? p.title : p === null ? "Not found" : "…"}>
      {p && <article className="max-w-2xl space-y-5 font-light leading-relaxed text-ivory/90">{p.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}</article>}
      {p === null && <p className="text-ivory/60">This article doesn&apos;t exist.</p>}
      <Link href="/blog" className="eyebrow mt-10 inline-block">← All articles</Link>
    </PageShell>
  );
}
