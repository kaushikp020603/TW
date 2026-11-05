import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import Telemetry from "@/components/Telemetry";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { SERVICES, SITE, SITE_URL } from "@/config/site";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
const body = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-body" });

const TITLE = "Spill the Cards: Tarot Readings, Daily Card and Personal Consultations";
const DESC = "Draw a free daily tarot card, explore all 22 Major Arcana, and book a personal tarot reading on WhatsApp. Love, career and self-discovery readings, for reflection and entertainment.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Spill the Cards" },
  description: DESC,
  keywords: ["tarot reading", "online tarot", "daily tarot card", "love tarot", "career tarot", "tarot card meanings", "Major Arcana", "tarot reader India", "book tarot reading"],
  applicationName: "Spill the Cards",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Spill the Cards", title: TITLE, description: DESC, locale: "en_IN", images: [{ url: "/brand/og.jpg", alt: "Spill the Cards: an illustrated tarot reader beneath a giant moon" }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/brand/og.jpg"] },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: "Spill the Cards", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#1B1240", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService", "@id": `${SITE_URL}/#business`, name: SITE.name, url: SITE_URL, description: DESC, image: `${SITE_URL}/brand/og.jpg`,
      telephone: "+" + SITE.whatsappNumber, priceRange: "₹99 - ₹1499", areaServed: "IN", serviceType: "Tarot reading",
      hasOfferCatalog: { "@type": "OfferCatalog", name: "Tarot readings", itemListElement: SERVICES.map((s) => ({ "@type": "Offer", priceCurrency: "INR", price: s.price, itemOffered: { "@type": "Service", name: s.name, description: s.blurb } })) },
    },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE.name, inLanguage: "en-IN", publisher: { "@id": `${SITE_URL}/#business` } },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false"><filter id="stc-sharp"><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -0.45 0 -0.45 2.8 -0.45 0 -0.45 0" /></filter></svg>
        {children}
        <Suspense fallback={null}><Telemetry /><FloatingWhatsApp /></Suspense>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
