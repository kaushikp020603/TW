import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarot Community: Moderated Discussions",
  description: "A gentle, moderated community to share tarot reflections and questions.",
  alternates: { canonical: "/community" },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
