import { MAJOR_ARCANA, type Card } from "./tarot";
import { yesNo } from "./spreads";

export const cardSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const cardBySlug = (slug: string) => MAJOR_ARCANA.find((c) => cardSlug(c.name) === slug);
export const kw = (c: Card) => c.keywords.split(" · ");

export type CardPage = {
  title: string; description: string;
  sections: { h: string; p: string[] }[];
  faq: { q: string; a: string }[];
  prev: Card; next: Card; related: Card[];
};

/** Builds a complete, original, long-form page for a card from its data (and any admin edits). */
export function buildCardPage(c: Card): CardPage {
  const k = kw(c); const tend = yesNo({ card: c, reversed: false }); const tendRev = yesNo({ card: c, reversed: true });
  const tone = tend === "Yes" ? "generally encouraging" : tend === "No" ? "challenging, often asking for patience or release" : "mixed, asking you to look more closely";
  const prev = MAJOR_ARCANA[(c.id + 21) % 22], next = MAJOR_ARCANA[(c.id + 1) % 22];
  const related = [MAJOR_ARCANA[(c.id + 5) % 22], MAJOR_ARCANA[(c.id + 11) % 22], MAJOR_ARCANA[(c.id + 17) % 22]];
  const yn = `As a symbolic yes-or-no answer, ${c.name} leans ${tend.toLowerCase()} when upright and ${tendRev.toLowerCase()} when reversed. That is a prompt for reflection rather than a prediction, so treat it as one perspective on your question.`;
  const faq = [
    { q: `What does ${c.name} mean in tarot?`, a: `${c.name} is card ${c.numeral} of the Major Arcana. It stands for ${k.join(", ")}. ${c.upright}` },
    { q: `What does ${c.name} reversed mean?`, a: c.reversed },
    { q: `Is ${c.name} a good or bad card?`, a: `No tarot card is simply good or bad. ${c.name} is ${tone}, and its meaning depends on the question, the cards around it and whether it appears upright or reversed.` },
    { q: `What does ${c.name} mean for love?`, a: c.love },
    { q: `What does ${c.name} mean for career?`, a: c.career },
    { q: `Is ${c.name} a yes or a no?`, a: yn },
  ];
  return {
    title: `${c.name} Tarot Card Meaning: Upright, Reversed, Love and Career`,
    description: `${c.name} (${c.numeral}) tarot card meaning: ${k.join(", ")}. Upright and reversed interpretations, love, career and yes/no guidance. For reflection and entertainment.`,
    sections: [
      { h: `What is the ${c.name} card?`, p: [
        `${c.name} is card ${c.numeral} in the 22-card Major Arcana, the part of the tarot that traces the big chapters of a life, from the Fool's first step to the World's final bow. Its themes are ${k.join(", ")}.`,
        `Readers often describe this card as ${tone}. In a spread it is less a verdict than a mirror: it points at a pattern, a feeling or a choice that is worth noticing right now.` ] },
      { h: `${c.name} upright meaning`, p: [c.upright, `When it lands upright, ask where "${k[0]}" is already showing up in your life, and what it would look like to work with it rather than against it.`] },
      { h: `${c.name} reversed meaning`, p: [c.reversed, `A reversed card is not a bad omen. It often turns the energy inward, or shows where the theme of "${k[0]}" is blocked, delayed or being overdone.`] },
      { h: `${c.name} in love and relationships`, p: [c.love, `If you are single, this can describe the energy you bring to meeting people. In a relationship, it can point to something that deserves an honest, kind conversation.`] },
      { h: `${c.name} in career and money`, p: [c.career, `Treat any career reading as a prompt for planning and reflection. For major financial or legal decisions, rely on a qualified professional.`] },
      { h: `${c.name} as a yes or no`, p: [yn] },
      { h: `Questions to reflect on`, p: [`Where in my life does "${k[0]}" feel strongest right now?`, `What would "${k[Math.min(1, k.length - 1)]}" ask of me this week, in one small action?`, `If ${c.name} were advice from a wise friend, what would they say?`] },
    ],
    faq, prev, next, related,
  };
}
