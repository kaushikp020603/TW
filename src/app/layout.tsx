import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
const body = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "THE ARCANA — Cinematic Tarot Readings",
  description:
    "Step beyond the ordinary. Explore tarot symbolism, pull your cards and book a personal reading on WhatsApp. For reflection and entertainment.",
  openGraph: {
    title: "THE ARCANA — Some answers aren't found. They're revealed.",
    description: "An immersive tarot experience with personal readings.",
    images: ["/img/3.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#0B0812", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
