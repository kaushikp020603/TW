import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified Tarot Readers",
  description: "Meet verified tarot readers and book a session on WhatsApp, or apply to join as a reader.",
  alternates: { canonical: "/readers" },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
