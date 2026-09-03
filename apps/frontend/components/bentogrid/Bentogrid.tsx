import { Badge } from "@/components/ui/badge";
import { BENTO_DATA, DATA } from "@/constants";
import ReminderAnimation from "./ReminderAnimation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const rounds = [
  { n: "01", title: "Recruiter screen", note: "Fit, motivation, background" },
  { n: "02", title: "Technical deep-dive", note: "Architecture & trade-offs" },
  { n: "03", title: "Coding round", note: "Algorithms, clean code" },
  { n: "04", title: "Hiring manager", note: "Leadership, judgment" },
];

const Bentogrid = () => {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-4">
            <Badge
              variant="outline"
              className="h-auto rounded-full border-ink/12 px-3 py-1 text-sm font-normal text-ink/60"
            >
              The format
            </Badge>
            <h2 className="text-balance text-4xl font-medium leading-[1.06] tracking-tight text-ink md:text-5xl">
              An interview that runs the way interviews actually run.
            </h2>
          </div>
          <p className="max-w-sm text-sm font-light leading-relaxed text-ink/55 md:text-right">
            Live video, multiple rounds, progression gates, and honest verdicts
            — not a friendly chatbot Q&amp;A.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-5">
          {/* Feature carousel card */}
          <div className="col-span-12 overflow-hidden rounded-2xl border border-ink/10 bg-card md:col-span-5">
            <div className="border-b border-ink/8 bg-muted/50 px-6 py-8 md:px-8">
              <ReminderAnimation />
            </div>
            <div className="space-y-1 p-6 md:p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/40">
                Everything included
              </p>
              <h3 className="text-xl font-medium text-ink">
                One honest practice loop
              </h3>
              <p className="text-sm font-light leading-relaxed text-ink/55">
                Live video, multi-round personas, adaptive follow-ups, and a
                detailed scorecard — in a single session.
              </p>
            </div>
          </div>

          {/* Round list card */}
          <div className="col-span-12 overflow-hidden rounded-2xl border border-ink/10 bg-card md:col-span-7">
            <div className="flex h-full flex-col justify-between gap-6 p-6 md:p-8">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/40">
                  A typical loop
                </p>
                <span className="rounded-full border border-ink/12 px-3 py-1 text-xs text-ink/55">
                  45–75 min
                </span>
              </div>

              <div className="divide-y divide-ink/8">
                {rounds.map((r, i) => (
                  <div key={r.n} className="flex items-center gap-5 py-3.5">
                    <span className="w-7 text-sm font-serif italic text-ink/35">
                      {r.n}
                    </span>
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-ink">
                        {r.title}
                      </p>
                      <p className="text-xs font-light text-ink/45">{r.note}</p>
                    </div>
                    {i < rounds.length - 1 && (
                      <ArrowRight className="size-4 text-ink/25" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature tiles */}
          {BENTO_DATA.map((feat) => (
            <div
              key={feat.title}
              className="group col-span-12 overflow-hidden rounded-2xl border border-ink/10 bg-card transition-colors hover:border-ink/25 md:col-span-4"
            >
              <div className="flex h-full flex-col gap-4 p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink">
                    <feat.icon className="size-4.5" strokeWidth={1.4} />
                  </span>
                  <ArrowUpRight className="size-4 text-ink/20 transition-all group-hover:text-ink/60" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-medium text-ink">{feat.title}</h3>
                  <p className="text-sm font-light leading-relaxed text-ink/55">
                    {feat.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Bentogrid;
