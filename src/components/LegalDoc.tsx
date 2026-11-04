import Link from "next/link";
import { DOCS } from "@/data/legal";

export default function LegalDoc({ doc }: { doc: keyof typeof DOCS }) {
  const d = DOCS[doc];
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <Link href="/" className="eyebrow inline-block py-3">← THE ARCANA</Link>
      <h1 className="h-hero mt-6 text-5xl">{d.title}</h1>
      <div className="mt-8 space-y-5 font-light leading-relaxed text-ivory/85">{d.body.map((p, i) => <p key={i}>{p}</p>)}</div>
    </main>
  );
}
