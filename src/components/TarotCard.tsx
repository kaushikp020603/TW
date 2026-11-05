"use client";
import type { Card } from "@/data/tarot";

const G = "#d6b36d";
const C = "#ead5a0";
const L = "#c9b6df";

// Original line-art emblems (viewBox 100x100). Not derived from any deck.
const EMBLEMS: Record<string, React.ReactNode> = {
  fool: (<g><circle cx="50" cy="30" r="9" /><path d="M20 80 Q50 20 80 80" /><path d="M30 80 L50 60 L70 80" /><circle cx="50" cy="48" r="2" fill={G} /></g>),
  magician: (<g><path d="M30 38c0-8 40-8 40 0-10 8-30 8-40 0zM50 46v36M30 82h40" /><path d="M36 30l-8-10M64 30l8-10" /><circle cx="50" cy="20" r="3" fill={G} /></g>),
  priestess: (<g><circle cx="22" cy="50" r="12" /><circle cx="78" cy="50" r="12" /><circle cx="50" cy="30" r="12" /><path d="M50 42v42M36 84h28" /></g>),
  empress: (<g><circle cx="50" cy="48" r="22" /><path d="M50 26v-12M50 82v12M28 48h-12M72 48h12M34 32l-8-8M66 32l8-8M34 64l-8 8M66 64l8 8" /><circle cx="50" cy="48" r="4" fill={G} /></g>),
  emperor: (<g><path d="M24 80V34l26-16 26 16v46zM24 52h52M50 18v34" /><circle cx="50" cy="66" r="6" /></g>),
  hierophant: (<g><path d="M50 12v76M34 28h32M28 46h44M34 64h32" /><circle cx="50" cy="12" r="4" fill={G} /></g>),
  lovers: (<g><circle cx="36" cy="46" r="18" /><circle cx="64" cy="46" r="18" /><path d="M50 74c-6 8-8 14 0 18 8-4 6-10 0-18z" /></g>),
  chariot: (<g><circle cx="30" cy="72" r="14" /><circle cx="70" cy="72" r="14" /><path d="M20 58h60l-6-28H26zM50 30V16" /></g>),
  strength: (<g><path d="M20 60c0-30 60-30 60 0M30 60c0 10 40 10 40 0" /><path d="M50 30c0-12 14-12 14 0s-14 12-14 0z" /><path d="M50 24v-6M45 20l-3-4M55 20l3-4" /></g>),
  hermit: (<g><path d="M50 16v8M50 24l-18 56h36z" /><circle cx="50" cy="16" r="6" /><path d="M50 50v18" /></g>),
  wheel: (<g><circle cx="50" cy="50" r="30" /><circle cx="50" cy="50" r="8" /><path d="M50 20v60M20 50h60M29 29l42 42M71 29L29 71" /></g>),
  justice: (<g><path d="M50 14v70M24 30h52M24 30l-10 24h20zM76 30l-10 24h20zM36 86h28" /></g>),
  hanged: (<g><path d="M24 14h52M50 14v22" /><circle cx="50" cy="82" r="8" /><path d="M50 36v34M42 58l8-8 8 8" /></g>),
  death: (<g><path d="M50 50c0-30 28-30 28-4M50 50c-24 8-4 34 12 22" /><circle cx="50" cy="50" r="6" /><path d="M14 84h72" /></g>),
  temperance: (<g><path d="M22 36h22l-4 30H26zM56 64h22l-4-30H60z" /><path d="M44 46c10-14 12 10 12 0" /><path d="M50 14l8 16-16 0z" /></g>),
  devil: (<g><path d="M30 20l14 14M70 20L56 34" /><circle cx="50" cy="48" r="16" /><path d="M36 74h28M30 84h40" /><circle cx="22" cy="62" r="5" /><circle cx="78" cy="62" r="5" /></g>),
  tower: (<g><path d="M34 90V38h32v52zM28 38h44l-4-14H32z" /><path d="M50 8l-8 14h10l-6 14" stroke={C} /><path d="M20 56l-8 6M80 56l8 6" /></g>),
  star: (<g><path d="M50 10l9 24 26 2-20 17 7 25-22-14-22 14 7-25L15 36l26-2z" /><circle cx="50" cy="48" r="4" fill={G} /></g>),
  moon: (<g><path d="M62 18a32 32 0 1 0 0 64 26 26 0 1 1 0-64z" /><circle cx="34" cy="84" r="3" fill={G} /><circle cx="68" cy="84" r="3" fill={G} /><path d="M20 94h60" /></g>),
  sun: (<g><circle cx="50" cy="50" r="20" /><path d="M50 12v14M50 74v14M12 50h14M74 50h14M23 23l10 10M67 67l10 10M77 23L67 33M33 67L23 77" /><circle cx="50" cy="50" r="6" fill={G} /></g>),
  judgement: (<g><path d="M30 30l40-12v24L30 54zM30 54v14" /><path d="M20 90c8-14 16-14 24 0M44 90c8-14 16-14 24 0M60 90c8-14 16-14 24 0" /></g>),
  world: (<g><ellipse cx="50" cy="50" rx="30" ry="38" /><path d="M24 36c18 10 34 10 52 0M24 64c18-10 34-10 52 0" /><circle cx="50" cy="50" r="5" fill={G} /><circle cx="18" cy="14" r="3" /><circle cx="82" cy="14" r="3" /><circle cx="18" cy="86" r="3" /><circle cx="82" cy="86" r="3" /></g>),
};

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-full w-full ${className}`} style={{ background: "linear-gradient(160deg,#241540,#1b1240 70%)" }}>
      <div className="absolute inset-[6px] rounded-[10px] border border-gold/60" />
      <div className="absolute inset-[12px] rounded-[8px] border border-gold/25" />
      <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" fill="none" stroke={G} strokeWidth="1">
        <circle cx="50" cy="70" r="26" /><circle cx="50" cy="70" r="18" opacity=".6" />
        <path d="M50 38l7 20 21 0-17 12 6 20-17-12-17 12 6-20-17-12 21 0z" opacity=".8" />
        <path d="M50 20v10M50 110v10M22 70h10M68 70h10" />
        <circle cx="50" cy="70" r="3" fill={G} />
      </svg>
    </div>
  );
}

export function CardFace({ card, reversed = false }: { card: Card; reversed?: boolean }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between p-[9%] text-center"
      style={{ background: "linear-gradient(170deg,#2a1747 0%,#2a1c5c 55%,#1b1240 100%)" }}>
      <div className="absolute inset-[6px] rounded-[10px] border border-gold/70" />
      <div className="absolute inset-[11px] rounded-[8px] border border-gold/20" />
      <span className="font-display relative text-[clamp(.7rem,2.6vw,1.05rem)] tracking-[.3em] text-champagne">{card.numeral}</span>
      <svg viewBox="0 0 100 100" className="relative w-[68%]" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: reversed ? "rotate(180deg)" : undefined, filter: "drop-shadow(0 0 6px rgba(214,179,109,.45))" }}>
        <circle cx="50" cy="50" r="46" stroke={L} strokeOpacity=".35" strokeWidth=".8" />
        {EMBLEMS[card.emblem]}
      </svg>
      <span className="font-display relative text-[clamp(.5rem,1.9vw,.8rem)] uppercase tracking-[.1em] leading-tight text-champagne">{card.name}</span>
    </div>
  );
}

/** A flippable 3D card. `flipped` shows the face. */
export function FlipCard({ card, reversed, flipped, className = "", style }: {
  card: Card; reversed?: boolean; flipped: boolean; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={`scene3d ${className}`} style={style}>
      <div className={`flip relative h-full w-full ${flipped ? "is-flipped" : ""}`}>
        <div className="face border border-gold/50 shadow-[0_0_30px_rgba(214,179,109,.18)]"><CardBack /></div>
        <div className="face back-side border border-gold/60 shadow-[0_0_34px_rgba(214,179,109,.3)]"><CardFace card={card} reversed={reversed} /></div>
      </div>
    </div>
  );
}
