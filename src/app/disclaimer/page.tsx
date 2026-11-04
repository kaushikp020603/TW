import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";

export const metadata: Metadata = { title: "Tarot Disclaimer", alternates: { canonical: "/disclaimer" } };

export default function Page() { return <LegalDoc doc="disclaimer" />; }
