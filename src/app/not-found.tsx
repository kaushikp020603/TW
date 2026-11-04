import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">The card you drew is missing</p>
      <p className="font-display mt-4 text-[clamp(5rem,20vw,11rem)] leading-none text-gold/70">404</p>
      <h1 className="h-hero mt-2 text-4xl sm:text-5xl">This page has <span className="gold-text italic">slipped through the veil</span></h1>
      <p className="mt-4 max-w-md font-light text-ivory/70">The page you were looking for doesn&apos;t exist or has moved. Let the cards guide you somewhere real.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-solid">Back home</Link>
        <Link href="/cards" className="btn">Explore the cards</Link>
        <Link href="/#book" className="btn">Book a reading</Link>
      </div>
    </main>
  );
}
