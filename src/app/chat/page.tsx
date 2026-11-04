"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import PageShell, { field } from "@/components/PageShell";
import { openAuth, useUser } from "@/lib/useUser";

type M = { id: number; sender: "user" | "reader"; text: string; created: number };
export default function Chat() {
  const { user, ready } = useUser();
  const [msgs, setMsgs] = useState<M[]>([]); const [t, setT] = useState(""); const end = useRef<HTMLDivElement>(null);
  const load = useCallback(() => { fetch("/api/site?q=chat").then((r) => r.json()).then((j) => setMsgs(j.messages || [])); }, []);
  useEffect(() => { if (!user) return; load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [user, load]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);
  async function send(e: React.FormEvent) {
    e.preventDefault(); if (!t.trim()) return;
    await fetch("/api/site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "chat_send", text: t }) }); setT(""); load();
  }
  return (
    <PageShell eyebrow="One-to-one" title={<>Ask the <span className="gold-text italic">reader</span></>} intro="A private conversation with the reader. Replies are not instant. She answers when she's available, usually within a day.">
      {!ready ? null : !user ? (
        <div className="glass frame max-w-lg p-8"><p className="font-light text-ivory/80">Sign in to start a private conversation. Only you and the reader can see these messages.</p><button className="btn btn-solid mt-5" onClick={() => openAuth("login")}>Sign in</button></div>
      ) : (
        <div className="glass frame flex h-[60vh] max-w-2xl flex-col p-4">
          <div className="flex-1 space-y-3 overflow-y-auto p-2" aria-live="polite">
            {msgs.map((m) => <p key={m.id} className={`max-w-[80%] whitespace-pre-line rounded-lg p-3 text-sm font-light ${m.sender === "user" ? "ml-auto bg-gold/20" : "bg-royal/90"}`}>{m.text}</p>)}
            {!msgs.length && <p className="text-sm text-ivory/50">Say hello. Tell her what&apos;s on your mind.</p>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-gold/20 pt-3"><input className={field} aria-label="Message" value={t} onChange={(e) => setT(e.target.value)} maxLength={800} placeholder="Type your message…" /><button className="btn !px-5">Send</button></form>
        </div>
      )}
    </PageShell>
  );
}
