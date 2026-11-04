"use client";
import { useEffect, useState } from "react";
import { isAmbientOn, onAmbient, toggleAmbient } from "@/lib/ambient";

export default function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOn(isAmbientOn()); return onAmbient(setOn); }, []);
  return (
    <button onClick={toggleAmbient} aria-pressed={on} aria-label={on ? "Turn ambient sound off" : "Turn ambient sound on"}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 text-champagne transition hover:bg-gold hover:text-midnight ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M4 9v6h4l5 4V5L8 9z" />
        {on ? <><path d="M16 9c1.5 1.5 1.5 4.5 0 6" /><path d="M19 6c3 3 3 9 0 12" /></> : <path d="M17 9l5 6M22 9l-5 6" />}
      </svg>
    </button>
  );
}
