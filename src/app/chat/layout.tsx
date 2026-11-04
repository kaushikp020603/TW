import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask the Reader: Private Tarot Chat",
  description: "A private one-to-one chat with your tarot reader.",
  alternates: { canonical: "/chat" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
