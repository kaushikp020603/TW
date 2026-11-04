import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Journey: Tarot Journal, Timeline and Daily Reminder",
  description: "Keep a private tarot journal, see your reading timeline and recurring cards, and add a daily card reminder to your calendar.",
  alternates: { canonical: "/journey" },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
