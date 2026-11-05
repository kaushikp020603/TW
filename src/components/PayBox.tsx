"use client";
import { useEffect, useState } from "react";
import { SITE, waLink } from "@/config/site";

type Biz = { upiId: string; upiName: string };
let cache: Biz | null = null;

/** UPI payment helper: QR code, copy UPI ID, open the UPI app, and tell the reader you've paid. Shown only when a UPI ID is set in Admin → Settings. */
export default function PayBox({ amount, code, service }: { amount: number; code: string; service: string }) {
  const [biz, setBiz] = useState<Biz | null>(cache); const [qr, setQr] = useState(""); const [copied, setCopied] = useState(false);
  useEffect(() => { if (cache) return; fetch("/api/site?q=business").then((r) => r.json()).then((b) => { cache = { upiId: b.upiId || "", upiName: b.upiName || SITE.name }; setBiz(cache); }).catch(() => {}); }, []);
  const link = biz?.upiId ? `upi://pay?pa=${encodeURIComponent(biz.upiId)}&pn=${encodeURIComponent(biz.upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent("ARCANA " + code)}` : "";
  useEffect(() => { let live = true; if (!link) return; import("qrcode").then((q) => q.toDataURL(link, { margin: 1, width: 240, color: { dark: "#2a1c5c", light: "#fffaf0" } })).then((u) => live && setQr(u)).catch(() => {}); return () => { live = false; }; }, [link]);
  if (!biz?.upiId || amount <= 0) return null;
  return (
    <div className="mt-6 rounded-2xl border border-gold/30 bg-midnight/90 p-5" aria-label="Pay with UPI">
      <p className="eyebrow">Pay by UPI · ₹{amount.toLocaleString("en-IN")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-5">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`UPI QR code to pay ₹${amount}`} width={150} height={150} className="rounded-lg border border-gold/40" />
        )}
        <div className="min-w-0 flex-1 space-y-3 text-sm font-light text-ivory/80">
          <p>Scan with any UPI app, or pay to <b className="break-all text-champagne">{biz.upiId}</b>. Put <b>ARCANA {code}</b> in the note.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn !py-2" onClick={async () => { try { await navigator.clipboard.writeText(biz.upiId); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} }}>{copied ? "Copied ✓" : "Copy UPI ID"}</button>
            <a className="btn !py-2 md:hidden" href={link}>Open UPI app</a>
            <a className="btn btn-solid !py-2" target="_blank" rel="noopener noreferrer" href={waLink(`Hi! I've paid ₹${amount} for my ${service} (Ref ${code}). Please confirm. Thank you!`)}>I&apos;ve paid. Tell the reader</a>
          </div>
        </div>
      </div>
    </div>
  );
}
