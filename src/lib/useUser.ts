"use client";
import { useEffect, useState } from "react";

export type U = { id: number; email: string; name: string; phone: string | null } | null;
let cache: U = null;
let loaded = false;
const subs = new Set<(u: U) => void>();

export function setUser(u: U) { cache = u; loaded = true; subs.forEach((s) => s(u)); }
export async function refreshUser() {
  try { const r = await fetch("/api/auth"); setUser((await r.json()).user ?? null); } catch { setUser(null); }
}
export function useUser(): { user: U; ready: boolean } {
  const [u, setU] = useState<U>(cache);
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    const s = (x: U) => { setU(x); setReady(true); };
    subs.add(s);
    if (!loaded) refreshUser();
    return () => { subs.delete(s); };
  }, []);
  return { user: u, ready };
}
export function openAuth(mode: "login" | "register" = "login") { window.dispatchEvent(new CustomEvent("arcana:auth", { detail: { mode } })); }
