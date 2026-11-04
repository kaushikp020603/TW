import Link from "next/link";

export const metadata = { title: "You're offline", robots: { index: false } };

export default function Offline() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">No connection</p>
      <h1 className="h-hero mt-4 text-4xl sm:text-6xl">The stars are <span className="gold-text italic">out of reach</span></h1>
      <p className="mt-4 max-w-md font-light text-ivory/70">You appear to be offline. Pages you have already visited may still open. Reconnect to draw cards or book a reading.</p>
      <Link href="/" className="btn btn-solid mt-8">Try again</Link>
    </main>
  );
}
