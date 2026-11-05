import type { Guidance, Motif } from "@/data/shop";

function wrap(text: string, n: number) {
  const out: string[] = []; let cur = "";
  for (const w of text.split(" ")) { if ((cur + " " + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) out.push(cur);
  return out;
}

/** Hand-built SVG motifs, drawn around (0,0). */
function Motif({ m }: { m: Motif }) {
  const g = "url(#gc-gold)";
  switch (m) {
    case "moon": return <g><path d="M18 -46A48 48 0 1 0 18 46 38 38 0 1 1 18 -46z" fill={g} /><path d="M40 -30l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#fffaf0" /></g>;
    case "sun": return <g>{Array.from({ length: 16 }, (_, i) => <path key={i} d="M-3 -56L0 -74 3 -56z" fill={g} transform={`rotate(${i * 22.5})`} />)}<circle r="38" fill={g} /><circle r="30" fill="none" stroke="#2a1c5c" strokeWidth="1.5" opacity=".5" /></g>;
    case "star": return <g><path d="M0 -62L12 -12 62 0 12 12 0 62-12 12-62 0-12-12z" fill={g} /><path d="M0 -34L6 -6 34 0 6 6 0 34-6 6-34 0-6-6z" fill="#fffaf0" opacity=".85" /></g>;
    case "lotus": return <g>{[-60, -30, 0, 30, 60].map((a) => <ellipse key={a} cx="0" cy="-30" rx="13" ry="34" fill={g} opacity={a === 0 ? 1 : 0.8} transform={`rotate(${a}) translate(0 18)`} />)}<circle cy="30" r="6" fill="#fffaf0" /></g>;
    case "heart": return <g><path d="M0 50C-70 0 -40 -50 0 -20 40 -50 70 0 0 50z" fill={g} /><path d="M0 28C-34 4 -22 -20 0 -6" fill="none" stroke="#fffaf0" strokeWidth="2" opacity=".7" /></g>;
    case "eye": return <g><path d="M-62 0Q0 -58 62 0 0 58 -62 0z" fill="none" stroke={g} strokeWidth="4" /><circle r="22" fill={g} /><circle r="9" fill="#2a1c5c" /><circle cx="6" cy="-6" r="3.5" fill="#fffaf0" /></g>;
    case "crown": return <g><path d="M-56 30L-62 -30 -30 -4 0 -48 30 -4 62 -30 56 30z" fill={g} /><rect x="-56" y="34" width="112" height="9" rx="3" fill={g} />{[-62, 0, 62].map((x) => <circle key={x} cx={x} cy={x === 0 ? -52 : -34} r="6" fill="#fffaf0" />)}</g>;
    default: return <g><circle cy="-30" r="24" fill="none" stroke={g} strokeWidth="9" /><rect x="-5" y="-8" width="10" height="70" rx="3" fill={g} /><rect x="5" y="34" width="22" height="8" rx="2" fill={g} /><rect x="5" y="50" width="16" height="8" rx="2" fill={g} /></g>;
  }
}

/** A designed guidance card: royal violet face, gold double frame, motif, title and message. */
export default function GuidanceCard({ card, uid = "a", className = "" }: { card: Guidance; uid?: string; className?: string }) {
  const lines = wrap(card.message, 24);
  return (
    <svg viewBox="0 0 250 400" className={className} role="img" aria-label={`${card.title} guidance card: ${card.message}`}>
      <defs>
        <linearGradient id="gc-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6dc" /><stop offset="1" stopColor="#c79a45" /></linearGradient>
        <radialGradient id={`gc-bg-${uid}`} cx="50%" cy="38%" r="80%"><stop offset="0" stopColor={`hsl(${card.hue} 55% 34%)`} /><stop offset=".6" stopColor={`hsl(${card.hue} 55% 18%)`} /><stop offset="1" stopColor={`hsl(${card.hue} 60% 11%)`} /></radialGradient>
      </defs>
      <rect width="250" height="400" rx="16" fill={`url(#gc-bg-${uid})`} />
      <rect x="9" y="9" width="232" height="382" rx="11" fill="none" stroke="url(#gc-gold)" strokeWidth="2" />
      <rect x="16" y="16" width="218" height="368" rx="8" fill="none" stroke="#ead5a0" strokeWidth=".6" opacity=".7" />
      {[[26, 26], [224, 26], [26, 374], [224, 374]].map(([x, y]) => <path key={x + "-" + y} d={`M${x} ${y - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} fill="#ead5a0" />)}
      {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={(i * 53) % 220 + 15} cy={(i * 97) % 330 + 25} r={i % 4 === 0 ? 1.3 : 0.7} fill="#fffaf0" opacity=".5" />)}
      <g transform="translate(125 128) scale(.95)"><Motif m={card.motif} /></g>
      <path d="M70 232h110" stroke="url(#gc-gold)" strokeWidth=".8" /><path d="M121 228l4 4-4 4-4-4z" fill="#ead5a0" />
      <text x="125" y="268" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="30" fontStyle="italic" fill="#fffaf0" letterSpacing="1">{card.title}</text>
      {lines.map((l, i) => <text key={i} x="125" y={298 + i * 16} textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="10.5" fontWeight="300" fill="#e9defa">{l}</text>)}
      <text x="125" y="372" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="10" letterSpacing="3" fill="#ead5a0" opacity=".85">SPILL THE CARDS</text>
    </svg>
  );
}

export function CardFan({ art, className = "" }: { art: Motif; className?: string }) {
  const order: Motif[] = [art, "star", "moon"];
  const pick = (m: Motif, i: number) => ({ title: ["Trust", "Begin", "Rest"][i], message: "A message for you.", motif: m, hue: [262, 280, 245][i] });
  return (
    <div className={`relative mx-auto aspect-[5/4] w-full max-w-[260px] ${className}`} aria-hidden>
      {[-1, 1, 0].map((p, i) => (
        <div key={i} className="absolute bottom-0 left-1/2 w-[46%] origin-bottom overflow-hidden rounded-xl border border-gold/50 shadow-[0_10px_30px_rgba(10,4,40,.55)]" style={{ transform: `translateX(-50%) translateX(${p * 34}%) rotate(${p * 13}deg)`, zIndex: p === 0 ? 3 : 1 }}>
          <GuidanceCard card={pick(order[[1, 2, 0][i]], i)} uid={`fan${art}${i}`} />
        </div>
      ))}
    </div>
  );
}
