"use client";
import React from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { ArrowRight } from "lucide-react";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

export default function Home() {
  return (
    <section className="relative w-full text-black overflow-hidden">
      <div className="relative mx-auto flex min-h-[92svh] w-full max-w-6xl flex-col items-center px-4 pt-24 md:pt-32">
        {/* Editorial copy above the globe */}
        <div className="relative z-20 flex flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/12 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-paper/60"
          >
            Interview simulation, reimagined
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
            className="max-w-4xl text-balance text-4xl font-medium leading-[1.05] tracking-tight text-black md:text-6xl lg:text-7xl"
          >
            Practice the interview{" "}
            <span className={serif.className + " text-black/55"}>
              you're actually preparing for.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.12 }}
            className="mt-6 max-w-xl text-pretty text-base font-light leading-relaxed text-black/55 md:text-lg"
          >
            Live, multi-round interviews run by adaptive AI interviewers — built
            from real company loops, powered by Agora RTC, and refined by the
            people preparing for the same seats you are.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/80"
            >
              Start practicing
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm font-medium text-black/85 transition-colors hover:border-black/35 hover:text-black/55"
            >
              Browse community interviews
            </Link>
          </motion.div>
        </div>

        {/* Soft fade to ink so the globe dissolves into the page */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>
    </section>
  );
}
