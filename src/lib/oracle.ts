import { MAJOR_ARCANA } from "@/data/tarot";

export type Lang = "en" | "hi";

export const T = {
  en: {
    title: "The Oracle", hello: "Welcome, seeker. What kind of guidance are you exploring: love, career, or something more general?",
    placeholder: "Ask about a card, or tell me what's on your mind…", send: "Ask", lang: "हिंदी",
    chips: ["Love", "Career", "General", "Explain The Moon"],
    note: "For reflection and entertainment. Not a prediction or advice.",
    love: "For matters of the heart, a **three-card spread** (Past · Present · Future) works beautifully, or a single card if you want quick focus. Use the *Love* reading in the chamber above.",
    career: "For work and direction, try a **three-card spread** to see where you've been, where you stand and what to reflect on next. Choose *Career* in the chamber above.",
    general: "For open-ended questions, a **one-card reading** gives focus; a **three-card spread** gives a story. Choose *General Guidance* in the chamber above.",
    unknown: "I can recommend a spread (try: love, career, general) or explain any Major Arcana card (try: “explain The Tower”). I can't predict the future, but I can help you reflect.",
    safety: "That's an important matter, and tarot can't give certainty about it. For health, legal or financial decisions please consult a qualified professional. I'm happy to help you reflect on how you feel about it.",
    card: (n: string, k: string, u: string, r: string) => `${n} — ${k}.\n\nUpright: ${u}\n\nReversed: ${r}`,
  },
  hi: {
    title: "ओरेकल", hello: "स्वागत है। आप किस तरह का मार्गदर्शन चाहते हैं: प्रेम, करियर, या कुछ सामान्य?",
    placeholder: "किसी कार्ड के बारे में पूछें, या अपने मन की बात बताएँ…", send: "पूछें", lang: "English",
    chips: ["प्रेम", "करियर", "सामान्य", "The Moon समझाएँ"],
    note: "यह केवल चिंतन और मनोरंजन के लिए है। भविष्यवाणी या सलाह नहीं।",
    love: "दिल के मामलों के लिए **तीन-कार्ड स्प्रेड** (अतीत · वर्तमान · भविष्य) अच्छा रहता है। ऊपर चैंबर में *Love* चुनें।",
    career: "करियर के लिए **तीन-कार्ड स्प्रेड** से देखें कि आप कहाँ थे, कहाँ हैं और आगे क्या सोचना है। ऊपर *Career* चुनें।",
    general: "सामान्य प्रश्न के लिए **एक कार्ड** फोकस देता है; **तीन कार्ड** एक कहानी। ऊपर *General Guidance* चुनें।",
    unknown: "मैं स्प्रेड सुझा सकता हूँ (प्रेम, करियर, सामान्य) या कोई कार्ड समझा सकता हूँ (जैसे “The Tower”). मैं भविष्य नहीं बता सकता, पर चिंतन में मदद कर सकता हूँ।",
    safety: "यह महत्वपूर्ण विषय है और टैरो इसमें निश्चितता नहीं दे सकता। स्वास्थ्य, कानूनी या वित्तीय निर्णयों के लिए कृपया किसी योग्य विशेषज्ञ से परामर्श करें।",
    card: (n: string, k: string, u: string, r: string) => `${n} — ${k}.\n\nसीधा: ${u}\n\nउल्टा: ${r}`,
  },
};

const SENSITIVE = /(medic|disease|cancer|pregnan|surgery|lawsuit|court|legal|invest|stock|loan|crypto|suicid|die\b|death of|divorce case)/i;

/** Local, rule-based fallback — used when no AI key is configured. */
export function localReply(input: string, lang: Lang): string {
  const t = T[lang];
  const q = input.toLowerCase();
  if (SENSITIVE.test(q)) return t.safety;
  const card = MAJOR_ARCANA.find((c) => q.includes(c.name.toLowerCase()) || q.includes(c.name.toLowerCase().replace("the ", "")));
  if (card) return t.card(card.name, card.keywords, card.upright, card.reversed);
  if (/love|relationship|heart|प्रेम|प्यार/.test(q)) return t.love;
  if (/career|job|work|business|करियर|नौकरी/.test(q)) return t.career;
  if (/general|guid|life|सामान्य/.test(q)) return t.general;
  return t.unknown;
}
