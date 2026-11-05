import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import ShopClient from "@/components/ShopClient";

export const metadata: Metadata = {
  title: "Card Shop: Tarot and Guidance Cards",
  description: "Beautifully designed guidance cards, pocket tarot decks and custom cards by Spill the Cards. Order on WhatsApp.",
  alternates: { canonical: "/shop" },
};

export default function Shop() {
  return (
    <PageShell eyebrow="The card shop" title={<>Cards to <span className="gold-text italic">keep close</span></>} intro="Guidance decks, pocket tarot and cards designed just for you. Choose what you like, send the order on WhatsApp, and we take care of the rest.">
      <ShopClient />
    </PageShell>
  );
}
