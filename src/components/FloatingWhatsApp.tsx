"use client";
import { usePathname } from "next/navigation";
import { waLink } from "@/config/site";

/** Always-available WhatsApp shortcut (hidden in the admin portal). */
export default function FloatingWhatsApp() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <a href={waLink("Hi! I found you on THE ARCANA and have a question.")} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
      className="float-btn fixed bottom-[6.2rem] right-5 z-[65] flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-[#128c4a] text-white shadow-[0_0_24px_rgba(18,140,74,.45)] transition hover:scale-105">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 21l1.7-5A9 9 0 1 1 8 19.3z" /><path d="M9 9c0 3 3 6 6 6l1.5-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z" /></svg>
    </a>
  );
}
