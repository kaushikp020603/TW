import { Suspense } from "react";
import PostClient from "@/components/PostClient";

async function Inner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PostClient slug={slug} />;
}
export default function Post({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
