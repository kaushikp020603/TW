"use client";
import { useEffect, useState } from "react";

/** "Install the app" button. Appears only when the browser says the site can be installed. */
export default function InstallButton({ className = "" }: { className?: string }) {
  const [can, setCan] = useState(false);
  useEffect(() => { const f = () => setCan(!!window.__installPrompt); f(); addEventListener("arcana:installable", f); return () => removeEventListener("arcana:installable", f); }, []);
  if (!can) return null;
  return <button className={className} onClick={async () => { const p = window.__installPrompt; if (!p) return; await p.prompt(); window.__installPrompt = undefined; setCan(false); }}>Install the app</button>;
}
