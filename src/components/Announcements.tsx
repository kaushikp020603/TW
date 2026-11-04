"use client";
import { useEffect, useState } from "react";

export default function Announcements() {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { if (sessionStorage.getItem("arcana-notice-x")) setHidden(true); } catch {}
    fetch("/api/site?q=announce").then((r) => r.json()).then((j) => setItems(j.items || [])).catch(() => {});
  }, []);
  if (hidden || !items.length) return null;
  return (
    <div role="status" className="fixed bottom-0 left-0 right-24 z-[64] flex items-center gap-3 bg-gradient-to-r from-gold to-champagne px-4 py-2.5 text-sm font-medium text-midnight sm:right-28">
      <span aria-hidden>✦</span><p className="flex-1">{items[0].text}</p>
      <button aria-label="Dismiss announcement" className="px-2 text-lg leading-none" onClick={() => { setHidden(true); try { sessionStorage.setItem("arcana-notice-x", "1"); } catch {} }}>×</button>
    </div>
  );
}
