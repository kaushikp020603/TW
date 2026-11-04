"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";

export default function VerifyEmail() {
  const [state, setState] = useState<"working" | "ok" | "bad">("working");
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("token");
    if (!t) { setState("bad"); return; } // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`/api/auth?verify=${encodeURIComponent(t)}`).then((r) => setState(r.ok ? "ok" : "bad")).catch(() => setState("bad"));
  }, []);
  return (
    <PageShell eyebrow="Account" title={<>Email <span className="gold-text italic">confirmation</span></>}>
      <div className="glass frame max-w-md space-y-4 p-8" role="status">
        {state === "working" && <p className="font-light text-ivory/80">Checking your link…</p>}
        {state === "ok" && <><p className="font-display text-2xl text-champagne">Email confirmed ✦</p><p className="font-light text-ivory/80">Thank you. Your account email is now verified.</p></>}
        {state === "bad" && <p className="font-light text-ivory/80">This confirmation link is invalid or has expired.</p>}
        <Link href="/" className="btn btn-solid inline-flex">Back to THE ARCANA</Link>
      </div>
    </PageShell>
  );
}
