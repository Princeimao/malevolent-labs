"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const lines = [
  "Real rounds. Real pressure.",
  "The same interviews companies",
  "actually run — simulated live.",
];

export default function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.35"],
  });

  const color = useTransform(scrollYProgress, [0, 1], ["#E9E4DB", "#1A1916"]);

  return (
    <section className="bg-paper">
      <div ref={ref} className="mx-auto max-w-6xl px-4 ">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-10 text-[11px] font-medium uppercase tracking-[0.22em] text-ink/40"
        >
          Why it feels real
        </motion.div>

        <motion.h2
          style={{ color }}
          className="max-w-4xl text-xl font-medium leading-[1.04] tracking-tight md:text-2xl lg:text-6xl"
        >
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="mt-10 max-w-xl text-base font-light leading-relaxed text-ink/55 md:text-lg"
        >
          Every loop is constructed from community-contributed experiences and
          run round-by-round by adaptive interviewer agents — so the pressure,
          pacing, and questions match what you'll actually face.
        </motion.p>
      </div>
    </section>
  );
}
