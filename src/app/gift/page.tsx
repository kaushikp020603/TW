import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE, waLink } from "@/config/site";

export const metadata: Metadata = {
  title: "Gift a Tarot Reading: Gift Cards",
  description: "Give someone a personal tarot reading. Buy a THE ARCANA gift card on WhatsApp and they redeem it when booking.",
  alternates: { canonical: "/gift" },
};

const AMOUNTS = [199, 499, 799, 1499];

export default function Gift() {
  return (
    <PageShell eyebrow="Give a moment of clarity" title={<>Gift a <span className="gold-text italic">reading</span></>} intro="A thoughtful gift for a birthday, a new beginning, or just because. Choose an amount, pay by UPI on WhatsApp, and we send you a personal gift code to pass on.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {AMOUNTS.map((a) => (
          <a key={a} target="_blank" rel="noopener noreferrer" href={waLink(`Hi! I'd like to buy a THE ARCANA gift card worth ₹${a}. Please share payment details.`)} className="glass frame block p-6 text-center transition hover:-translate-y-1">
            <p className="font-display text-5xl text-gold">₹{a}</p>
            <p className="mt-2 text-xs uppercase tracking-[.2em] text-ivory/60">Gift card</p>
            <span className="btn btn-solid mt-5 w-full">Buy on WhatsApp</span>
          </a>
        ))}
      </div>
      <section className="mt-14 max-w-2xl"><h2 className="font-display text-3xl text-champagne">How it works</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 font-light text-ivory/85">
          <li>Pick an amount and message us on WhatsApp ({SITE.whatsappDisplay}).</li>
          <li>Pay by UPI and we create a one-time gift code, for example GIFT-4K7Q2M.</li>
          <li>Send the code to your friend. They enter it in the Coupon box when booking and the amount comes off their reading.</li>
        </ol>
        <p className="mt-4 text-sm font-light text-ivory/60">Each gift code can be used once. If a reading costs less than the gift amount, the remainder isn&apos;t carried over, so choose the amount to match the reading you have in mind.</p>
        <Link href="/#book" className="btn mt-6 inline-flex">See readings and prices</Link>
      </section>
    </PageShell>
  );
}
