"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import Film from "./Film";
import { startBooking, startReading } from "@/lib/events";

const rise = { hidden: { opacity: 0, y: 36 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] as const } } };

function Frame({ n, src, label, flip = false }: { n: number; src: string; label: string; flip?: boolean }) {
  return (
    <motion.div variants={rise} className={`relative ${flip ? "lg:order-2" : ""}`}>
      <div className="frame overflow-hidden rounded-sm border border-gold/50 shadow-[0_30px_80px_rgba(27,18,64,.35)]">
        <Film src={src} poster={`/videos/${n}.jpg`} label={label} className="film-fx aspect-video w-full bg-[#1b1240] object-cover" />
      </div>
    </motion.div>
  );
}

/** Video 2: a light, ivory band that breaks up the dark sections. */
export function MeetScene() {
  return (
    <section id="meet" className="pearl relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="meet-h">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12%" }} transition={{ staggerChildren: 0.15 }} className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <Frame n={2} src="/videos/2.mp4" label="The reader listens as a guest shares a question over the tarot table" />
        <div>
          <motion.p variants={rise} className="eyebrow">Meet your guide</motion.p>
          <motion.h2 variants={rise} id="meet-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.6rem)]">A space where your <span className="gold-text italic">questions matter.</span></motion.h2>
          <motion.p variants={rise} className="mt-5 max-w-md text-lg font-light leading-relaxed">Every story deserves to be heard. Every question deserves a moment of clarity. Your reader listens first, then lets the cards help you see your situation more calmly.</motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="btn btn-solid">Meet your reader</Link>
            <button className="btn" onClick={() => startBooking()}>Book a reading</button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/** Video 3: introduces the interactive pick-a-card experience that follows. */
export function CardsScene() {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="cards-h">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12%" }} transition={{ staggerChildren: 0.15 }} className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div className="lg:order-1">
          <motion.p variants={rise} className="eyebrow">The cards begin to speak</motion.p>
          <motion.h2 variants={rise} id="cards-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.6rem)]">Pick a card. <span className="gold-text italic">Discover a story.</span></motion.h2>
          <motion.p variants={rise} className="mt-5 max-w-md text-lg font-light leading-relaxed text-ivory/85">The cards you choose might reveal a perspective you never expected.</motion.p>
          <motion.div variants={rise} className="mt-8"><button className="btn btn-solid" onClick={() => startReading()}>Pick your card</button></motion.div>
        </div>
        <Frame n={3} src="/videos/3.mp4" label="Tarot cards rise from the table and glow with purple and gold light" flip />
      </motion.div>
    </section>
  );
}

/** Video 4: the revelation, in a light band, leading into the reading categories. */
export function RevelationScene() {
  return (
    <section id="revelation" className="pearl relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="rev-h">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12%" }} transition={{ staggerChildren: 0.15 }} className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <Frame n={4} src="/videos/4.mp4" label="A star card is revealed and a hopeful vision rises from it" />
        <div>
          <motion.p variants={rise} className="eyebrow">Every card has a story</motion.p>
          <motion.h2 variants={rise} id="rev-h" className="h-hero mt-3 text-[clamp(2rem,4.6vw,3.6rem)]">Sometimes, a little clarity <span className="gold-text italic">changes everything.</span></motion.h2>
          <motion.p variants={rise} className="mt-5 max-w-md text-lg font-light leading-relaxed">Explore the possibilities. Reflect on your journey. Find your own direction.</motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
            <button className="btn btn-solid" onClick={() => startBooking()}>Book a reading</button>
            <a href="#worlds" className="btn">See the readings</a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
