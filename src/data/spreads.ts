import type { Card, Category } from "./tarot";

export type SpreadKey = "one" | "three" | "yesno" | "celtic";
export const SPREADS: Record<SpreadKey, { label: string; sub: string; positions: string[] }> = {
  one: { label: "One card", sub: "Quick guidance", positions: ["Your card"] },
  three: { label: "Three cards", sub: "Past · Present · Future", positions: ["Past", "Present", "Future"] },
  yesno: { label: "Yes / No", sub: "A simple question", positions: ["Your answer"] },
  celtic: { label: "Celtic Cross", sub: "Ten-card deep reading", positions: ["The present", "The challenge", "The foundation", "The recent past", "The crown (what you aim for)", "The near future", "You", "Your surroundings", "Hopes & fears", "The outcome"] },
};

export type Drawn = { card: Card; reversed: boolean };

// Yes/No tendency per card (symbolic, not predictive). Reversed flips yes/no.
const YES = new Set([0, 1, 3, 6, 7, 8, 10, 14, 17, 19, 20, 21]);
const NO = new Set([9, 12, 13, 15, 16]);
export function yesNo(d: Drawn): "Yes" | "No" | "Maybe" {
  const base = YES.has(d.card.id) ? "Yes" : NO.has(d.card.id) ? "No" : "Maybe";
  if (!d.reversed || base === "Maybe") return base;
  return base === "Yes" ? "No" : "Yes";
}
export const yesNoLine = (a: "Yes" | "No" | "Maybe") =>
  a === "Yes" ? "The symbolism leans toward yes: energy is supportive here. Reflect on whether you are ready to act on it."
  : a === "No" ? "The symbolism leans toward no, or not yet. Consider what this card asks you to release or wait on."
  : "The symbolism is mixed. The answer may depend on clarity you haven't reached yet. Consider what you still need to know.";

const PROMPTS: Record<Category, string[]> = {
  general: ["What is one small step that fits what these cards describe?", "Which card stirred the strongest reaction in you, and why?", "What would change if you trusted your own judgement here?"],
  love: ["What do you truly need in a relationship right now?", "Which pattern from your past would you like to do differently?", "How can you communicate this more honestly and kindly?"],
  career: ["What does success actually mean for you at this stage?", "Which skill or boundary would help you most this month?", "What is one decision you have been postponing, and what is behind that?"],
};

const lens = (c: Card, cat: Category) => (cat === "love" ? c.love : cat === "career" ? c.career : "");

/** Personalised, reflective interpretation combining question + cards + positions. Local, no AI needed. */
export function interpret(spread: SpreadKey, cat: Category, question: string, drawn: Drawn[]): string[] {
  const out: string[] = [];
  const rev = drawn.filter((d) => d.reversed).length;
  out.push(question
    ? `You asked: “${question}” The cards below don't predict an answer. They offer symbols to reflect on while you consider it.`
    : "You came with an open heart and no fixed question. The cards offer symbols to reflect on.");

  if (spread === "yesno") {
    const a = yesNo(drawn[0]);
    out.push(`${drawn[0].card.name}${drawn[0].reversed ? " (reversed)" : ""} points toward ${a.toLowerCase()}. ${yesNoLine(a)}`);
  } else if (spread === "three") {
    const [p, n, f] = drawn;
    out.push(`Past: ${p.card.name} (${p.card.keywords.split(" · ")[0]}) shows what has shaped you. Present: ${n.card.name} describes where you stand now. Future: ${f.card.name} suggests where this energy may lead if nothing changes, and a direction worth reflecting on, not a fixed outcome.`);
  } else if (spread === "celtic") {
    out.push(`At the heart of your situation is ${drawn[0].card.name}, crossed by ${drawn[1].card.name}, so the tension to notice is between "${drawn[0].card.keywords.split(" · ")[0]}" and "${drawn[1].card.keywords.split(" · ")[0]}". Beneath it lies ${drawn[2].card.name}, with ${drawn[3].card.name} fading from recent experience and ${drawn[4].card.name} in the distance as what you aim for.`);
    out.push(`Looking ahead, ${drawn[5].card.name} is the next step, and ${drawn[6].card.name} reflects how you are showing up. Others and circumstances are coloured by ${drawn[7].card.name}, your hopes and fears are held in ${drawn[8].card.name}, and the overall direction these cards point toward is ${drawn[9].card.name}.`);
  } else {
    const c = drawn[0];
    out.push(`${c.card.name}${c.reversed ? " reversed" : ""} brings the theme of ${c.card.keywords.split(" · ").join(", ")}. ${c.reversed ? c.card.reversed : c.card.upright}`);
  }

  const l = drawn.map((d) => lens(d.card, cat)).filter(Boolean);
  if (l.length && cat !== "general") out.push(`Through the lens of ${cat === "love" ? "love" : "career"}: ${l.slice(0, 3).join(" ")}`);
  if (drawn.length > 1) out.push(rev === 0 ? "All the cards fell upright, suggesting energy that is flowing and available to you."
    : rev >= drawn.length / 2 ? "Many reversed cards suggest inner reflection, resistance or timing issues. This is a moment for patience, not pressure."
    : "A mix of upright and reversed cards suggests some areas are flowing while others ask for attention.");
  out.push("Reflect on: " + PROMPTS[cat].slice(0, 2).join(" · "));
  return out;
}
