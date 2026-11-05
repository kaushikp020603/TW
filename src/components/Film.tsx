"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Lazy cinematic video: never autoplays with sound, loads only when near the viewport,
 * plays while visible and pauses when off-screen, shows the poster for reduced-motion users
 * and falls back to the poster image if the file is missing or fails to load.
 */
export default function Film({ src, poster, label, className = "", eager = false }: { src: string; poster: string; label: string; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, [bad]);
  if (bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt={label} className={className} loading="lazy" />;
  }
  return (
    <video ref={ref} src={src} poster={poster} muted loop playsInline preload={eager ? "auto" : "none"} aria-label={label}
      className={className} onError={() => setBad(true)} disablePictureInPicture />
  );
}
