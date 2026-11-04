"use client";
import { useCallback, useEffect, useState } from "react";
import PageShell, { field } from "@/components/PageShell";
import { openAuth, useUser } from "@/lib/useUser";

type Thread = { id: number; name: string; title: string; body: string; created: number; replies: { name: string; body: string; created: number }[] };
const send = (b: object) => fetch("/api/site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ ok: r.ok, ...(await r.json()) }));

export default function Community() {
  const { user } = useUser();
  const [threads, setThreads] = useState<Thread[]>([]); const [t, setT] = useState({ title: "", body: "" }); const [msg, setMsg] = useState(""); const [reply, setReply] = useState<Record<number, string>>({});
  const load = useCallback(() => { fetch("/api/site?q=threads").then((r) => r.json()).then((j) => setThreads(j.threads || [])); }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <PageShell eyebrow="Moderated circle" title={<>The <span className="gold-text italic">community</span></>} intro="A gentle space to share reflections. Please be kind and don't share personal contact details. Every post is reviewed before it appears.">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {threads.map((th) => (
            <article key={th.id} className="glass frame p-6">
              <h2 className="font-display text-2xl text-champagne">{th.title}</h2><p className="text-xs text-ivory/50">{th.name} · {new Date(th.created).toLocaleDateString("en-IN")}</p>
              <p className="mt-3 whitespace-pre-line font-light text-ivory/90">{th.body}</p>
              {th.replies.length > 0 && <ul className="mt-4 space-y-2 border-l border-gold/30 pl-4 text-sm font-light">{th.replies.map((r, i) => <li key={i}><b className="text-lavender">{r.name}:</b> {r.body}</li>)}</ul>}
              {user ? (<form className="mt-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); const r = await send({ action: "reply", threadId: th.id, body: reply[th.id] }); setMsg(r.message || r.error); setReply({ ...reply, [th.id]: "" }); }}>
                <input className={field} placeholder="Add a kind reply…" aria-label="Reply" value={reply[th.id] || ""} onChange={(e) => setReply({ ...reply, [th.id]: e.target.value })} /><button className="btn !px-4">Reply</button></form>) : null}
            </article>))}
          {!threads.length && <p className="text-sm text-ivory/50">No posts yet. Be the first to start a conversation.</p>}
        </div>
        <aside className="glass frame h-fit space-y-3 p-6">
          <p className="eyebrow">Start a conversation</p>
          {user ? (<form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const r = await send({ action: "thread", ...t }); setMsg(r.message || r.error); if (r.ok) setT({ title: "", body: "" }); }}>
            <input className={field} placeholder="Title" aria-label="Title" required value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} />
            <textarea className={field} rows={5} placeholder="Share a reflection or question…" aria-label="Post" required value={t.body} onChange={(e) => setT({ ...t, body: e.target.value })} />
            <button className="btn btn-solid w-full">Post for review</button></form>)
            : <><p className="text-sm font-light text-ivory/70">Sign in to post and reply. This keeps the circle safe.</p><button className="btn btn-solid" onClick={() => openAuth("login")}>Sign in</button></>}
          {msg && <p role="status" className="text-xs text-champagne">{msg}</p>}
        </aside>
      </div>
    </PageShell>
  );
}
