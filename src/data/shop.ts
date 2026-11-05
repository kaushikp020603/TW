export type Motif = "moon" | "sun" | "star" | "lotus" | "heart" | "eye" | "crown" | "key";
export type Guidance = { title: string; message: string; motif: Motif; hue: number };
export type Product = { stock?: number | null; id: string; name: string; kind: string; price: number; blurb: string; details: string; art: Motif; active?: number; sort?: number };

/** The signature guidance deck: each card is a short message to carry through the day. */
export const GUIDANCE: Guidance[] = [
  { title: "Trust", message: "You are further along than you think. Take the next small step and let the path appear.", motif: "moon", hue: 262 },
  { title: "Release", message: "Put down what is no longer yours to carry. Lighter hands can hold new things.", motif: "lotus", hue: 292 },
  { title: "Courage", message: "Being brave is simply going on, with a trembling heart if you must.", motif: "sun", hue: 36 },
  { title: "Patience", message: "Not every season is for blooming. Roots grow quietly in the dark.", motif: "key", hue: 245 },
  { title: "Clarity", message: "Be still and the water clears. The answer is often already in the room.", motif: "eye", hue: 220 },
  { title: "Begin", message: "A perfect moment never arrives. This imperfect one will do.", motif: "star", hue: 270 },
  { title: "Rest", message: "Rest is not a reward for finishing. It is part of the work.", motif: "moon", hue: 250 },
  { title: "Worth", message: "You do not have to earn your place here. You were already invited.", motif: "crown", hue: 40 },
  { title: "Heal", message: "Be as gentle with yourself as you would be with a friend in your place.", motif: "heart", hue: 320 },
  { title: "Open", message: "Leave a window open for good news. It cannot arrive through a closed door.", motif: "key", hue: 230 },
  { title: "Choose", message: "Choose what feels like peace, not only what looks like progress.", motif: "star", hue: 280 },
  { title: "Glow", message: "Your light does not need to be loud to be seen. Let it simply be on.", motif: "sun", hue: 44 },
];

export const SEED_PRODUCTS: Product[] = [
  { id: "guidance-deck", name: "Guidance Deck · 36 Cards", kind: "guidance", price: 899, art: "moon", blurb: "Thirty-six gold-foil guidance cards, each with a short message for the day.", details: "Premium matte cards in a magnetic keepsake box, with a small guide booklet and three simple spreads." },
  { id: "pocket-tarot", name: "Pocket Tarot · Major Arcana", kind: "deck", price: 699, art: "star", blurb: "All 22 Major Arcana in our midnight purple and gold artwork, travel-sized.", details: "22 cards with keywords printed on each, a drawstring pouch and a one-page starter guide." },
  { id: "affirmation-12", name: "Affirmation Cards · 12", kind: "guidance", price: 399, art: "lotus", blurb: "A small set of twelve affirmations to keep on your desk or by your bed.", details: "Twelve postcard-sized cards printed on thick pearl paper, in a printed sleeve." },
  { id: "custom-card", name: "Your Own Custom Card", kind: "custom", price: 499, art: "crown", blurb: "A guidance card designed just for you, with your name, theme and message.", details: "Tell us the occasion and the message. We design it in the Spill the Cards style and share a preview on WhatsApp before printing." },
  { id: "digital-pack", name: "Digital Card Pack", kind: "digital", price: 149, art: "sun", blurb: "All twelve guidance cards as phone wallpapers and printable files.", details: "Delivered on WhatsApp within a day. For personal use." },
];

export const KIND_LABEL: Record<string, string> = { guidance: "Guidance cards", deck: "Tarot deck", custom: "Custom design", digital: "Digital download", print: "Print" };
