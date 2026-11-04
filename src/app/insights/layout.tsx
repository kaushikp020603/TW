import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Stars: Numerology, Zodiac and Tarot Compatibility",
  description: "Free numerology life-path number, zodiac sign with tarot card, and a two-person compatibility reading. For reflection and entertainment.",
  alternates: { canonical: "/insights" },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
