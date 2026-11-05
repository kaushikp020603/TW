"use client";
import { useEffect } from "react";

/** Adds a 3D tilt and a gold sheen that follows the pointer to any element with the .tilt class (fine pointers only). */
export default function TiltInit() {
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(".tilt") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${((0.5 - y) * 7).toFixed(2)}deg`); el.style.setProperty("--ry", `${((x - 0.5) * 9).toFixed(2)}deg`);
      el.style.setProperty("--sx", `${(x * 100).toFixed(0)}%`); el.style.setProperty("--sy", `${(y * 100).toFixed(0)}%`);
    };
    const leave = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(".tilt") as HTMLElement | null;
      if (el) { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); }
    };
    document.addEventListener("pointermove", move); document.addEventListener("pointerout", leave);
    return () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerout", leave); };
  }, []);
  return null;
}
