import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarot Blog: Guides, Symbolism and Reflections",
  description: "Tarot symbolism, reading guides and reflections from THE ARCANA.",
  alternates: { canonical: "/blog" },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
