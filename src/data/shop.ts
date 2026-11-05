export type Motif = "moon" | "sun" | "star" | "lotus" | "heart" | "eye" | "crown" | "key";
export type Guidance = { title: string; message: string; motif: Motif; hue: number };
export type Product = { stock?: number | null; id: string; name: string; kind: string; price: number; blurb: string; details: string; art?: Motif; image?: number | null; active?: number; sort?: number };

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

export const KIND_LABEL: Record<string, string> = { guidance: "Guidance cards", deck: "Tarot deck", custom: "Custom design", digital: "Digital download", print: "Print" };
