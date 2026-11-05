import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Reading from "@/components/Reading";

export const metadata: Metadata = {
  title: "Free Tarot Card: Draw Your Card of the Day",
  description: "Draw a free daily tarot card or pick cards for love, career and general guidance, with a personal reading.",
  alternates: { canonical: "/reading" },
};

export default function ReadingPage() {
  return (
    <PageShell eyebrow="Free reading" title={<>Draw your <span className="gold-text italic">card</span></>}>
      <Reading />
    </PageShell>
  );
}
