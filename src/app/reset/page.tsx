"use client";
import { useEffect, useState } from "react";
import PageShell, { field } from "@/components/PageShell";
import { openAuth } from "@/lib/useUser";

export default function ResetPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [pw, setPw] = useState(""); const [again, setAgain] = useState(""); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setToken(new URLSearchParams(location.search).get("token") || ""); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (pw !== again) return setErr("The two passwords don't match.");
    setBusy(true);
    const r = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reset", token, password: pw }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.error || "Something went wrong.");
    setDone(true);
  }
  return (
    <PageShell eyebrow="Account" title={<>Choose a new <span className="gold-text italic">password</span></>}>
      {token === null ? null : done ? (
        <div className="glass frame max-w-md space-y-4 p-8" role="status"><p className="font-display text-2xl text-champagne">Password updated ✦</p><p className="font-light text-ivory/80">You can now sign in with your new password. For safety you were signed out everywhere else.</p><button className="btn btn-solid" onClick={() => openAuth("login")}>Sign in</button></div>
      ) : !token ? (
        <div className="glass frame max-w-md space-y-4 p-8"><p className="font-light text-ivory/80">This page needs the link we sent you. If you don&apos;t have one, request a new reset.</p><button className="btn btn-solid" onClick={() => openAuth("forgot")}>Forgot password?</button></div>
      ) : (
        <form onSubmit={submit} className="glass frame max-w-md space-y-4 p-8">
          <label className="block"><span className="mb-1 block text-xs text-ivory/60">New password (8+ characters)</span><input type="password" required minLength={8} autoComplete="new-password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs text-ivory/60">Repeat new password</span><input type="password" required autoComplete="new-password" className={field} value={again} onChange={(e) => setAgain(e.target.value)} /></label>
          {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
          <button className="btn btn-solid w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
        </form>
      )}
    </PageShell>
  );
}
