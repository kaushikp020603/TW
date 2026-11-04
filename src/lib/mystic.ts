import { MAJOR_ARCANA } from "@/data/tarot";

// ───────── Numerology (life path, birthday & personal year) ─────────
const reduce = (n: number): number => { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split("").reduce((a, c) => a + Number(c), 0); return n; };
export function lifePath(dob: string) { const [y, m, d] = dob.split("-").map(Number); return reduce(reduce(y) + reduce(m) + reduce(d)); }
export function personalYear(dob: string, year = new Date().getFullYear()) { const [, m, d] = dob.split("-").map(Number); return reduce(reduce(m) + reduce(d) + reduce(year)); }

export const NUMBERS: Record<number, { title: string; text: string; card: number }> = {
  1: { title: "The Initiator", text: "Independent and driven, you tend to lead and begin things. Your growth lies in listening as well as leading.", card: 1 },
  2: { title: "The Peacemaker", text: "Sensitive and cooperative, you notice what others feel. Your growth lies in trusting your own voice.", card: 2 },
  3: { title: "The Creator", text: "Expressive and imaginative, you bring colour to a room. Your growth lies in finishing what you begin.", card: 3 },
  4: { title: "The Builder", text: "Steady and practical, you value structure and reliability. Your growth lies in allowing flexibility.", card: 4 },
  5: { title: "The Explorer", text: "Curious and adaptable, you crave change and freedom. Your growth lies in commitment without feeling caged.", card: 10 },
  6: { title: "The Nurturer", text: "Caring and responsible, you create harmony around you. Your growth lies in caring for yourself as well.", card: 6 },
  7: { title: "The Seeker", text: "Reflective and analytical, you look for deeper meaning. Your growth lies in sharing what you discover.", card: 9 },
  8: { title: "The Achiever", text: "Ambitious and capable, you think in terms of results. Your growth lies in balancing success with meaning.", card: 11 },
  9: { title: "The Humanitarian", text: "Compassionate and idealistic, you want to serve something larger. Your growth lies in letting go gracefully.", card: 17 },
  11: { title: "The Visionary (master number)", text: "Intuitive and inspiring, you often sense what's beneath the surface. Your growth lies in grounding big ideas.", card: 2 },
  22: { title: "The Master Builder (master number)", text: "You can turn large visions into reality. Your growth lies in handling the pressure that comes with that.", card: 4 },
  33: { title: "The Master Teacher (master number)", text: "Devoted and giving, you uplift others. Your growth lies in not carrying everyone's load.", card: 3 },
};
export const YEAR_THEME: Record<number, string> = {
  1: "a year of fresh starts", 2: "a year of patience and partnership", 3: "a year of expression and joy", 4: "a year of building foundations", 5: "a year of change and movement",
  6: "a year of home, love and responsibility", 7: "a year of reflection and inner work", 8: "a year of effort and reward", 9: "a year of completion and release", 11: "a year of heightened intuition", 22: "a year of large-scale building", 33: "a year of service",
};

// ───────── Zodiac ─────────
export type Element = "Fire" | "Earth" | "Air" | "Water";
export const SIGNS: { name: string; symbol: string; from: [number, number]; element: Element; ruler: string; card: number; text: string }[] = [
  { name: "Capricorn", symbol: "♑", from: [12, 22], element: "Earth", ruler: "Saturn", card: 15, text: "disciplined, ambitious and patient" },
  { name: "Aquarius", symbol: "♒", from: [1, 20], element: "Air", ruler: "Uranus", card: 17, text: "original, humane and independent" },
  { name: "Pisces", symbol: "♓", from: [2, 19], element: "Water", ruler: "Neptune", card: 18, text: "compassionate, imaginative and intuitive" },
  { name: "Aries", symbol: "♈", from: [3, 21], element: "Fire", ruler: "Mars", card: 4, text: "bold, energetic and direct" },
  { name: "Taurus", symbol: "♉", from: [4, 20], element: "Earth", ruler: "Venus", card: 5, text: "steady, sensual and loyal" },
  { name: "Gemini", symbol: "♊", from: [5, 21], element: "Air", ruler: "Mercury", card: 6, text: "curious, quick and sociable" },
  { name: "Cancer", symbol: "♋", from: [6, 21], element: "Water", ruler: "the Moon", card: 7, text: "protective, emotional and caring" },
  { name: "Leo", symbol: "♌", from: [7, 23], element: "Fire", ruler: "the Sun", card: 8, text: "warm, generous and expressive" },
  { name: "Virgo", symbol: "♍", from: [8, 23], element: "Earth", ruler: "Mercury", card: 9, text: "thoughtful, precise and helpful" },
  { name: "Libra", symbol: "♎", from: [9, 23], element: "Air", ruler: "Venus", card: 11, text: "fair-minded, graceful and diplomatic" },
  { name: "Scorpio", symbol: "♏", from: [10, 23], element: "Water", ruler: "Pluto", card: 13, text: "intense, perceptive and resilient" },
  { name: "Sagittarius", symbol: "♐", from: [11, 22], element: "Fire", ruler: "Jupiter", card: 14, text: "optimistic, adventurous and honest" },
];
export function zodiac(dob: string) {
  const [, m, d] = dob.split("-").map(Number);
  const order = [...SIGNS].sort((a, b) => a.from[0] * 100 + a.from[1] - (b.from[0] * 100 + b.from[1]));
  const v = m * 100 + d; let pick = order[order.length - 1]; // before Jan 20 → Capricorn
  for (const s of order) if (s.from[0] * 100 + s.from[1] <= v) pick = s;
  return pick;
}
const ELEMENT_FIT: Record<Element, Record<Element, number>> = {
  Fire: { Fire: 3, Air: 3, Earth: 1, Water: 1 }, Air: { Fire: 3, Air: 3, Earth: 1, Water: 2 },
  Earth: { Earth: 3, Water: 3, Fire: 1, Air: 1 }, Water: { Water: 3, Earth: 3, Fire: 1, Air: 2 },
};

export function compatibility(a: { name: string; dob: string }, b: { name: string; dob: string }) {
  const za = zodiac(a.dob), zb = zodiac(b.dob), la = lifePath(a.dob), lb = lifePath(b.dob);
  const fit = ELEMENT_FIT[za.element][zb.element];
  const diff = Math.abs(la - lb);
  const lines: string[] = [];
  lines.push(`${a.name || "You"} (${za.name}, ${za.element}) and ${b.name || "your partner"} (${zb.name}, ${zb.element}): ` +
    (fit === 3 ? "your elements tend to flow together naturally, which often brings ease and shared rhythm." : fit === 2 ? "your elements blend with a little effort, and differences can add colour." : "your elements are quite different, so patience and curiosity about each other's pace can help."));
  lines.push(`Life paths ${la} and ${lb}: ` + (diff === 0 ? "the same number suggests you understand each other's core drives, and may also mirror each other's blind spots." : diff <= 2 ? "close numbers suggest compatible outlooks." : "different numbers suggest you bring different strengths, a good balance if you respect them."));
  return { za, zb, la, lb, fit, lines, score: Math.round(55 + ((fit / 3) * 0.6 + (1 - Math.min(diff, 8) / 8) * 0.4) * 40) }; // kept in a reflective 55-95 range, never "100%"
}

// ───────── Mood-based suggestions ─────────
export const MOODS: { id: string; label: string; emoji: string; spread: "one" | "three" | "yesno" | "celtic"; category: "general" | "love" | "career"; prompt: string }[] = [
  { id: "anxious", label: "Anxious", emoji: "🌫️", spread: "one", category: "general", prompt: "What do I need to know to feel calmer right now?" },
  { id: "confused", label: "Confused", emoji: "🌀", spread: "three", category: "general", prompt: "What is the story behind where I'm standing?" },
  { id: "heartbroken", label: "Heavy-hearted", emoji: "💔", spread: "three", category: "love", prompt: "What would help my heart heal?" },
  { id: "hopeful", label: "Hopeful", emoji: "🌱", spread: "three", category: "general", prompt: "What is ready to grow in my life?" },
  { id: "restless", label: "Restless", emoji: "⚡", spread: "yesno", category: "career", prompt: "Is this the right time to make this move?" },
  { id: "curious", label: "Curious", emoji: "🔮", spread: "celtic", category: "general", prompt: "Show me the whole picture." },
];

export const cardName = (id: number) => MAJOR_ARCANA[id]?.name ?? "";
