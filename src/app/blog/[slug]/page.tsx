import { Suspense } from "react";
import type { Metadata } from "next";
import { row } from "@/lib/db";
import PostClient from "@/components/PostClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await row<{ title: string; body: string }>("SELECT title,body FROM posts WHERE slug=? AND published=1", slug);
    if (p) return { title: p.title, description: p.body.replace(/\s+/g, " ").slice(0, 155), alternates: { canonical: `/blog/${slug}` }, openGraph: { type: "article", title: p.title } };
  } catch { /* fall through */ }
  return { title: "Article" };
}

async function Inner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PostClient slug={slug} />;
}
export default function Post({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
