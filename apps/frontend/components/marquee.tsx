"use client";

import { motion } from "motion/react";

const companies = [
  "Google",
  "Meta",
  "Amazon",
  "Microsoft",
  "Apple",
  "OpenAI",
  "Netflix",
  "Stripe",
  "Uber",
  "Airbnb",
  "NVIDIA",
  "Anthropic",
];

export default function Marquee() {
  const row = [...companies, ...companies];

  return (
    <div className="relative w-full bg-white/30 text-black">
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6"
        >
          <p className="text-center text-sm font-light tracking-wide text-paper/50 md:text-base">
            Practice interviews at the level of the{" "}
            <span className="font-bold text-black/55">world&apos;s top companies</span>
          </p>

          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max animate-marquee items-center gap-10 py-2">
              {row.map((name, idx) => (
                <div key={idx} className="flex items-center gap-10">
                  <span className="text-lg font-medium tracking-tight text-paper/40 md:text-xl">
                    {name}
                  </span>
                  <span className="size-1.5 rounded-full bg-paper/20" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
