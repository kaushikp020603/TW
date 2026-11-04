import { Suspense } from "react";
import type { Metadata } from "next";
import SummaryClient from "@/components/SummaryClient";

export const metadata: Metadata = { title: "Your reading summary", robots: { index: false, follow: false } };

async function Inner({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SummaryClient code={code} />;
}
export default function SummaryPage({ params }: { params: Promise<{ code: string }> }) {
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
