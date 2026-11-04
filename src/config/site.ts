// ───────── Single place to edit business details ─────────
/** Public address of the site (set NEXT_PUBLIC_SITE_URL in production, e.g. https://thearcana.in). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE = {
  name: "THE ARCANA",
  tagline: "Some answers aren't found. They're revealed.",
  whatsappNumber: "919027845106", // +91 90278 45106 (digits only, with country code)
  whatsappDisplay: "+91 90278 45106",
  instagram: "https://instagram.com/", // TODO: replace with the real handle
  email: "", // optional: add a contact email
};

// Illustrative prices (₹) — edit freely. Payment is handled manually over WhatsApp.
export const SERVICES = [
  { id: "one", name: "One-Card Reading", price: 99, mins: "Quick", blurb: "A single card for focused, same-day guidance." },
  { id: "three", name: "Three-Card Reading", price: 199, mins: "Past · Present · Future", blurb: "A clear story arc around one question." },
  { id: "love", name: "Love & Relationships", price: 299, mins: "Detailed", blurb: "Hearts, patterns and what to reflect on." },
  { id: "career", name: "Career & Purpose", price: 299, mins: "Detailed", blurb: "Direction, decisions and next steps." },
  { id: "growth", name: "Self-Discovery", price: 499, mins: "Detailed", blurb: "A deeper look at growth, habits and inner themes." },
  { id: "call30", name: "30-Min Personal Session", price: 799, mins: "30 min", blurb: "Live one-to-one consultation." },
  { id: "call60", name: "60-Min Personal Session", price: 1499, mins: "60 min", blurb: "An unhurried, in-depth session." },
] as const;

export const SLOT_TIMES = ["10:00 AM", "11:30 AM", "1:00 PM", "3:00 PM", "4:30 PM", "6:00 PM", "7:30 PM", "9:00 PM"];

export function waLink(text: string) {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

// Asset map (copied from the reference art in /public/img)
export const IMG = {
  stairs: "/img/1.webp",
  chamber: "/img/2.webp",
  moonReader: "/img/3.webp",
  ruins: "/img/4.webp",
  wizard: "/img/5.webp",
  hooded: "/img/6.webp",
  stairsCards: "/img/7.webp",
  garden: "/img/9.webp",
  girlHeart: "/img/10.webp",
  spiral: "/img/11.webp",
  priestess: "/img/12.webp",
  palace: "/img/13.webp",
  cardHand: "/img/14.webp",
  heartStairs: "/img/15.webp",
  watercolor: "/img/16.webp",
  lavender: "/img/17.webp",
  goldWall: "/img/18.webp",
  moonCards: "/img/19.webp",
};
