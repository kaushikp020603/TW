export function Crescent({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs><linearGradient id="stc-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6dc" /><stop offset="1" stopColor="#d6b36d" /></linearGradient></defs>
      <path d="M26 4a17 17 0 1 0 0 32 13.5 13.5 0 1 1 0-32z" fill="url(#stc-g)" />
      <path d="M31 10l1.2 3.8L36 15l-3.8 1.2L31 20l-1.2-3.8L26 15l3.8-1.2z" fill="#fffaf0" />
    </svg>
  );
}

/** Text logo: crescent + "Spill the Cards" in the display face. */
export default function Logo({ className = "text-2xl", mark = "h-7 w-7" }: { className?: string; mark?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display leading-none tracking-[.02em] ${className}`}>
      <Crescent className={mark} />
      <span className="gold-text italic">Spill the Cards</span>
    </span>
  );
}
