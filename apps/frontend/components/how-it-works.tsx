import { Badge } from "@/components/ui/badge";
import {
  Target,
  Bot,
  PlayCircle,
  Share2,
  Flame,
  Crown,
} from "lucide-react";

const steps = [
  {
    icon: Target,
    title: "Pick your target",
    description:
      "Choose a company and role — or keep it general. The AI instantly builds the full interview structure: how many rounds, who's interviewing, and what each round covers.",
  },
  {
    icon: Bot,
    title: "Face real interviewer agents",
    description:
      "Every round is run by AI agents with distinct names, personalities, and system prompts. They adapt their follow-ups to your answers — no static scripts.",
  },
  {
    icon: PlayCircle,
    title: "Pass rounds to progress",
    description:
      "Like a real loop, you advance round-by-round. Pass a round to unlock the next one — or get honest feedback on what to improve.",
  },
  {
    icon: Share2,
    title: "Share what you learned",
    description:
      "Passed a full interview? Give us permission and we'll turn the key moments into a feed post so others can practice the exact same loop.",
  },
];

const contributorFlow = [
  {
    icon: Crown,
    title: "Create interviewer agents",
    description:
      "Build AI agents with a name, personality, system prompt, and behavior — the exact interviewer you want candidates to face.",
  },
  {
    icon: Flame,
    title: "Publish interview loops",
    description:
      "Combine your agents into rounds and publish a full interview for the community — or keep it private for your own preparation.",
  },
  {
    icon: Share2,
    title: "Go viral in the feed",
    description:
      "Community members practice your interview and rate the experience. The best loops surface to the top, YouTube-style.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-11 md:py-20">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto flex flex-col gap-14">
        {/* Candidate flow */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4 items-center justify-center max-w-3xl mx-auto">
            <Badge variant={"outline"} className="px-3 py-1 h-auto text-sm font-normal">
              For Candidates
            </Badge>
            <h2 className="text-center md:text-5xl text-3xl mx-auto font-medium">
              A real interview, run the way companies run it
            </h2>
            <p className="text-center text-muted-foreground text-base max-w-xl">
              Not just a Q&A. Multi-round loops with progression gates, adaptive
              interviewer agents, and a live video room powered by Agora RTC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-border bg-background/60 p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </span>
                  <span className="text-4xl font-bold text-foreground/5">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contributor flow */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4 items-center justify-center max-w-3xl mx-auto">
            <Badge variant={"outline"} className="px-3 py-1 h-auto text-sm font-normal">
              For Contributors
            </Badge>
            <h2 className="text-center md:text-5xl text-3xl mx-auto font-medium">
              Build interviews the community will love
            </h2>
            <p className="text-center text-muted-foreground text-base max-w-xl">
              Craft interviewer agents, assemble full interview loops, and share
              them — or contribute your own real interview experience with
              questions, rounds, and answers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contributorFlow.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-background/60 p-6 flex flex-col gap-4"
              >
                <span className="flex size-10 items-center justify-center rounded-full border border-ink/12 bg-ink text-paper">
                  <step.icon className="size-5" />
                </span>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <Badge variant={"secondary"} className="px-4 py-2 h-auto text-sm font-normal gap-2">
              <span>No limits</span>
              <span className="size-1 rounded-full bg-muted-foreground" />
              <span>Personal or public</span>
              <span className="size-1 rounded-full bg-muted-foreground" />
              <span>Any company, any role</span>
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
