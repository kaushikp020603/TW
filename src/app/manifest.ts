import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spill the Cards: Tarot Readings", short_name: "Spill the Cards", description: "Draw your daily card, explore the tarot and book a personal reading.",
    start_url: "/", scope: "/", display: "standalone", orientation: "portrait", background_color: "#1B1240", theme_color: "#1B1240", categories: ["lifestyle", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Draw today's card", short_name: "Daily card", url: "/reading" },
      { name: "Book a reading", short_name: "Book", url: "/#book" },
      { name: "Card meanings", short_name: "Cards", url: "/cards" },
    ],
  };
}
