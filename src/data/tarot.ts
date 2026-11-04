export type Card = {
  id: number;
  numeral: string;
  name: string;
  keywords: string;
  upright: string;
  reversed: string;
  love: string;
  career: string;
  emblem: string; // key into emblems
};

export const MAJOR_ARCANA: Card[] = [
  { id: 0, numeral: "0", name: "The Fool", keywords: "beginnings · trust · leap", emblem: "fool",
    upright: "A fresh start and a willingness to step into the unknown. Curiosity and openness are your allies right now.",
    reversed: "Hesitation, recklessness or fear of beginning. Ask whether you are leaping blindly or avoiding a step that is ready to be taken.",
    love: "Meet new connection with openness and without a script.", career: "A new path or project invites a first step." },
  { id: 1, numeral: "I", name: "The Magician", keywords: "skill · will · focus", emblem: "magician",
    upright: "You hold more resources than you think. Focus your intention and turn an idea into action.",
    reversed: "Scattered energy or unused talent. Reflect on where effort is being diluted or where you are holding back.",
    love: "Clear, honest communication shapes what happens next.", career: "A moment to show your skills and take initiative." },
  { id: 2, numeral: "II", name: "The High Priestess", keywords: "intuition · stillness · mystery", emblem: "priestess",
    upright: "Quiet knowing. Not everything needs to be answered today; listen to what sits beneath the surface.",
    reversed: "Ignoring your inner voice, or secrets and confusion clouding clarity. Make space for silence.",
    love: "Feelings may be unspoken; pay attention to what is not being said.", career: "Observe and gather information before acting." },
  { id: 3, numeral: "III", name: "The Empress", keywords: "nurture · abundance · creativity", emblem: "empress",
    upright: "Growth through care. Creativity, comfort and nourishment are available when you tend to what matters.",
    reversed: "Neglecting your own needs or feeling creatively blocked. Reflect on what needs nurturing, including you.",
    love: "Warmth, affection and a caring bond.", career: "Creative work and steady growth are favoured." },
  { id: 4, numeral: "IV", name: "The Emperor", keywords: "structure · authority · stability", emblem: "emperor",
    upright: "Build foundations. Boundaries, planning and calm leadership create stability.",
    reversed: "Rigidity or control, or a lack of structure. Consider where firmness has become stubbornness.",
    love: "Reliability and commitment; healthy boundaries.", career: "Organise, lead and plan for the long term." },
  { id: 5, numeral: "V", name: "The Hierophant", keywords: "tradition · learning · guidance", emblem: "hierophant",
    upright: "Wisdom from tradition, teachers or shared values. Learning within a trusted framework helps.",
    reversed: "Questioning convention. You may need to find your own approach rather than follow the expected one.",
    love: "Shared values and a meaningful commitment.", career: "Mentorship, study or formal routes help." },
  { id: 6, numeral: "VI", name: "The Lovers", keywords: "choice · union · alignment", emblem: "lovers",
    upright: "A meaningful choice rooted in your values. Connection and honest alignment matter more than convenience.",
    reversed: "Misalignment or avoiding a decision. Reflect on whether your choices match what you truly value.",
    love: "Deep connection, or a choice about a relationship.", career: "Partnerships and choices that reflect your values." },
  { id: 7, numeral: "VII", name: "The Chariot", keywords: "drive · direction · willpower", emblem: "chariot",
    upright: "Momentum through discipline. Hold opposing pulls together and move with purpose.",
    reversed: "Lost direction or forced progress. Slow down and clarify where you are actually heading.",
    love: "Move forward with intention rather than drift.", career: "Strong momentum; stay focused on the goal." },
  { id: 8, numeral: "VIII", name: "Strength", keywords: "courage · patience · compassion", emblem: "strength",
    upright: "Quiet, gentle courage. Patience and compassion, including toward yourself, outlast force.",
    reversed: "Self-doubt or depleted confidence. Rebuild trust in yourself gently.",
    love: "Tenderness and patience heal tension.", career: "Steady resilience through a challenge." },
  { id: 9, numeral: "IX", name: "The Hermit", keywords: "solitude · insight · seeking", emblem: "hermit",
    upright: "A time to step back and reflect. Your own light is enough to take the next step.",
    reversed: "Isolation or avoiding reflection. Consider whether solitude has become withdrawal.",
    love: "Reflect on what you truly want before deciding.", career: "Pause, study and seek deeper understanding." },
  { id: 10, numeral: "X", name: "Wheel of Fortune", keywords: "cycles · change · timing", emblem: "wheel",
    upright: "Life moves in cycles. A turning point is near; adaptability helps you ride the change.",
    reversed: "Resisting change or feeling stuck in a loop. Look at which patterns you can influence.",
    love: "A shift in the dynamic; stay flexible.", career: "Change in circumstances; opportunity through timing." },
  { id: 11, numeral: "XI", name: "Justice", keywords: "truth · balance · accountability", emblem: "justice",
    upright: "Fairness and honest weighing of facts. Actions have consequences; clarity brings balance.",
    reversed: "Avoiding accountability or unfair judgement. Revisit the facts with honesty.",
    love: "Honesty and balance in give and take.", career: "Clear contracts, fair decisions, due process." },
  { id: 12, numeral: "XII", name: "The Hanged Man", keywords: "pause · surrender · new view", emblem: "hanged",
    upright: "Suspension and a change of perspective. Letting go of control reveals a different view.",
    reversed: "Stalling or needless sacrifice. Ask whether waiting is still serving you.",
    love: "See the situation from the other person's side.", career: "A pause before progress; reconsider your approach." },
  { id: 13, numeral: "XIII", name: "Death", keywords: "endings · renewal · release", emblem: "death",
    upright: "A chapter closing so another can begin. Transformation, not literal ending; release what has run its course.",
    reversed: "Clinging to what is over. Resistance can prolong the transition.",
    love: "An old pattern ends, making room for something truer.", career: "A role or phase concludes; renewal follows." },
  { id: 14, numeral: "XIV", name: "Temperance", keywords: "balance · patience · blending", emblem: "temperance",
    upright: "Moderation and harmony. Blend opposites patiently and trust a steady pace.",
    reversed: "Excess or imbalance. Look for where you have drifted from your centre.",
    love: "Patience and compromise nurture the bond.", career: "Steady, balanced progress; collaboration." },
  { id: 15, numeral: "XV", name: "The Devil", keywords: "attachment · shadow · habit", emblem: "devil",
    upright: "Notice what binds you: habits, fears or unhealthy attachments. Awareness is the first loosening of the chain.",
    reversed: "Breaking free and reclaiming your power. Release is possible once you see the pattern.",
    love: "Examine unhealthy patterns or possessiveness.", career: "Beware of overwork or constraints you accepted by habit." },
  { id: 16, numeral: "XVI", name: "The Tower", keywords: "upheaval · truth · rebuilding", emblem: "tower",
    upright: "Sudden change shakes what was built on shaky ground. It clears space for something more honest.",
    reversed: "Avoiding a necessary change, or recovering from upheaval. Face what needs to fall.",
    love: "Truth surfaces; rebuild on honest foundations.", career: "Disruption, then a chance to restructure." },
  { id: 17, numeral: "XVII", name: "The Star", keywords: "hope · healing · renewal", emblem: "star",
    upright: "Quiet hope after difficulty. Healing, inspiration and trust in the road ahead.",
    reversed: "Discouragement or lost faith. Small acts of self-care can rekindle hope.",
    love: "Healing and a hopeful, honest openness.", career: "Inspiration and renewed direction." },
  { id: 18, numeral: "XVIII", name: "The Moon", keywords: "dreams · illusion · intuition", emblem: "moon",
    upright: "Things are not fully clear. Trust your intuition but verify; fears can distort the picture.",
    reversed: "Confusion lifting, or fear loosening. Clarity begins to appear.",
    love: "Mixed signals or unspoken feelings; seek clarity.", career: "Uncertainty; wait for fuller information." },
  { id: 19, numeral: "XIX", name: "The Sun", keywords: "joy · clarity · vitality", emblem: "sun",
    upright: "Warmth, clarity and success. Enjoy what is going well and let yourself be seen.",
    reversed: "Dimmed enthusiasm or delayed joy. Look for the small light still available.",
    love: "Happiness, openness and warmth.", career: "Recognition and positive momentum." },
  { id: 20, numeral: "XX", name: "Judgement", keywords: "awakening · reckoning · calling", emblem: "judgement",
    upright: "A call to rise and reassess. Forgive the past and answer what is calling you.",
    reversed: "Self-doubt or ignoring the call. Reflect with kindness rather than harsh criticism.",
    love: "A moment of honest reckoning and fresh start.", career: "Reevaluate and answer a calling." },
  { id: 21, numeral: "XXI", name: "The World", keywords: "completion · wholeness · arrival", emblem: "world",
    upright: "Completion and integration. A cycle fulfilled; celebrate before beginning again.",
    reversed: "Unfinished business or a last step remaining. Close the loop to move on.",
    love: "Wholeness and a sense of arrival.", career: "Completion of a major goal; wider horizons." },
];

export type Category = "general" | "love" | "career";

export const CATEGORIES: { id: Category; label: string; hint: string }[] = [
  { id: "general", label: "General Guidance", hint: "Where am I, and what should I notice?" },
  { id: "love", label: "Love", hint: "Relationships, connection, the heart." },
  { id: "career", label: "Career", hint: "Work, purpose, decisions." },
];

// Cryptographically-random Fisher–Yates shuffle (no duplicates in a spread).
export function shuffleDeck(): { card: Card; reversed: boolean }[] {
  const rand = (n: number) => {
    const a = new Uint32Array(1);
    const lim = Math.floor(0x100000000 / n) * n;
    do crypto.getRandomValues(a); while (a[0] >= lim);
    return a[0] % n;
  };
  const deck = [...MAJOR_ARCANA];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.map((card) => ({ card, reversed: rand(4) === 0 })); // ~25% reversed
}
