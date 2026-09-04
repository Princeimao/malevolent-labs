"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RequireContributor from "@/components/app/RequireContributor";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { publishContribution, searchQuestions } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Trash2,
  Search,
  ArrowDownToLine,
  Clock,
  Gauge,
  Layers,
  PenLine,
  CheckCircle2,
} from "lucide-react";

const ROUND_TYPES = [
  "RECRUITER",
  "TECHNICAL",
  "PANEL",
  "HIRING_MANAGER",
  "CODING",
] as const;
const DIFFICULTY = ["Easy", "Medium", "Hard"];
const FORMATS = [
  "In-person",
  "Virtual video",
  "Phone",
  "Take-home + follow-up",
];
const FEELS = [
  "Supportive",
  "Fair",
  "Intense",
  "Brutal but fair",
  "Unorganized",
];

interface RoundDraft {
  key: string;
  name: string;
  type: string;
  feel: string;
  interviewerCount: number;
  sampleQuestions: string[];
}

const emptyRound = (): RoundDraft => ({
  key: Math.random().toString(36).slice(2),
  name: "",
  type: "TECHNICAL",
  feel: "",
  interviewerCount: 1,
  sampleQuestions: [],
});

function stripHtml(html: string) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").replace(/\s+/g, " ").trim();
}

export default function ContributePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("Mid-Senior");
  const [difficulty, setDifficulty] = useState("Medium");
  const [format, setFormat] = useState("Virtual video");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [topicsText, setTopicsText] = useState("");
  const [storyHtml, setStoryHtml] = useState("");
  const [rounds, setRounds] = useState<RoundDraft[]>([emptyRound()]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // per-round question bank search
  const [searchOpen, setSearchOpen] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const updateRound = (key: string, patch: Partial<RoundDraft>) =>
    setRounds((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

  const removeQuestion = (key: string, idx: number) =>
    setRounds((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              sampleQuestions: r.sampleQuestions.filter((_, i) => i !== idx),
            }
          : r,
      ),
    );

  const addQuestionText = (key: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRounds((prev) =>
      prev.map((r) =>
        r.key === key && !r.sampleQuestions.includes(trimmed)
          ? { ...r, sampleQuestions: [...r.sampleQuestions, trimmed] }
          : r,
      ),
    );
  };

  const runSearch = async (key: string) => {
    setSearching(true);
    const results = await searchQuestions({
      q: searchText,
      company: company || undefined,
    });
    setSearchResults(results);
    setSearching(false);
    setSearchOpen(key);
  };

  const publish = async () => {
    setError("");
    if (!role.trim()) return setError("Role is required.");
    const cleanRounds = rounds
      .filter((r) => r.name.trim() || r.sampleQuestions.length)
      .map((r) => ({
        name: r.name.trim() || "Untitled round",
        type: r.type,
        focusAreas: r.feel
          ? [`${r.feel} — ${r.sampleQuestions.length} questions`]
          : [],
        sampleQuestions: r.sampleQuestions,
        interviewers: Array.from({
          length: Math.max(1, r.interviewerCount || 1),
        }).map((_, i) => ({
          name: `Interviewer ${i + 1}`,
          role:
            r.type === "RECRUITER"
              ? "Recruiter"
              : r.type === "HIRING_MANAGER"
                ? "Hiring Manager"
                : r.type === "PANEL"
                  ? "Panelist"
                  : "Technical Interviewer",
          avatarUrl: "",
          personality: "",
          style: "",
          focusAreas: [],
        })),
      }));

    setPublishing(true);
    try {
      const summary = (
        stripHtml(storyHtml) ||
        `Interview experience at ${company || "a company"} for the ${role} role.`
      ).slice(0, 500);
      const exp = await publishContribution({
        company: company || "General",
        role,
        level,
        difficulty: difficulty as "Easy" | "Medium" | "Hard",
        topics: topicsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        summary,
        storyHtml,
        format,
        durationMinutes,
        feel:
          rounds
            .map((r) => r.feel)
            .filter(Boolean)
            .join(", ") || undefined,
        rounds: cleanRounds as any,
        authorName: user?.name || "Anonymous",
      });
      router.push(`/feed/${exp.id}`);
    } catch (err) {
      setError("Could not publish your experience. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-24">
      <RequireContributor>
        <main className="max-w-4xl mx-auto px-4 md:px-6 pt-8 space-y-8">
          <div className="border-b border-neutral-200 pb-6">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Experience Sharer
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mt-1 flex items-center gap-3">
              <PenLine className="size-6 text-emerald-600" />
              Share your interview story
            </h1>
            <p className="text-neutral-500 text-xs md:text-sm mt-2">
              Tell the full story — how it went, how it felt, who was in the
              room, and every question you remember. Your experience feeds the
              community question database.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Basic info */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5 shadow-sm">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Layers className="size-4 text-indigo-500" /> Interview details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Company
                </label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe"
                  className="bg-paper border-neutral-200 text-ink"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Role *
                </label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="bg-paper border-neutral-200 text-ink"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Level
                </label>
                <Select
                  value={level}
                  onValueChange={(v) => setLevel(v || "Mid-Senior")}
                >
                  <SelectTrigger className="w-full bg-paper border-neutral-200 text-ink">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Entry", "Mid-Senior", "Senior", "Staff"].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Difficulty
                </label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v || "Medium")}
                >
                  <SelectTrigger className="w-full bg-paper border-neutral-200 text-ink">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Format
                </label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v || FORMATS[1])}
                >
                  <SelectTrigger className="w-full bg-paper border-neutral-200 text-ink">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="size-3.5" /> Total duration (min)
                </label>
                <Input
                  type="number"
                  min={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="bg-paper border-neutral-200 text-ink"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Topics (comma separated)
              </label>
              <Input
                value={topicsText}
                onChange={(e) => setTopicsText(e.target.value)}
                placeholder="e.g. System Design, Concurrency, Behavioral"
                className="bg-paper border-neutral-200 text-ink"
              />
            </div>
          </section>

          {/* Rich story */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Gauge className="size-4 text-indigo-500" /> Your story
            </h2>
            <RichTextEditor
              value={storyHtml}
              onChange={setStoryHtml}
              minHeight="min-h-72"
              placeholder={
                "Write your story... e.g. how the process started, what surprised you, how each round felt, what you'd do differently. You can bold key points, add headings, lists and quotes."
              }
            />
            <p className="text-[11px] text-neutral-500">
              Tip: the plain text of your story becomes the feed summary, so
              tell it in full.
            </p>
          </section>

          {/* Rounds + questions */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">
                Rounds & questions
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRounds((prev) => [...prev, emptyRound()])}
                className="border-neutral-300 bg-white text-ink hover:bg-neutral-100"
              >
                <Plus className="size-3.5" /> Add round
              </Button>
            </div>

            <div className="space-y-4">
              {rounds.map((round, rIdx) => (
                <div
                  key={round.key}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-semibold text-ink">
                      <span className="flex size-5 items-center justify-center rounded bg-neutral-200 text-[10px] font-bold">
                        {rIdx + 1}
                      </span>
                      Round
                    </span>
                    <div className="flex items-center gap-2">
                      {rounds.length > 1 && (
                        <button
                          onClick={() =>
                            setRounds((prev) =>
                              prev.filter((r) => r.key !== round.key),
                            )
                          }
                          className="text-neutral-400 hover:text-rose-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Round name
                      </label>
                      <Input
                        value={round.name}
                        onChange={(e) =>
                          updateRound(round.key, { name: e.target.value })
                        }
                        placeholder="e.g. System Design"
                        className="bg-paper border-neutral-200 text-ink"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Type
                      </label>
                      <Select
                        value={round.type}
                        onValueChange={(v) =>
                          updateRound(round.key, { type: v || "TECHNICAL" })
                        }
                      >
                        <SelectTrigger className="w-full bg-paper border-neutral-200 text-ink">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROUND_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        How it felt
                      </label>
                      <Select
                        value={round.feel}
                        onValueChange={(v) =>
                          updateRound(round.key, { feel: v || "" })
                        }
                      >
                        <SelectTrigger className="w-full bg-paper border-neutral-200 text-ink">
                          <SelectValue placeholder="Pick a vibe (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {FEELS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        How many people sat in
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={round.interviewerCount}
                        onChange={(e) =>
                          updateRound(round.key, {
                            interviewerCount: Number(e.target.value) || 1,
                          })
                        }
                        className="bg-paper border-neutral-200 text-ink"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Questions asked
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a question, then press +"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addQuestionText(
                                round.key,
                                (e.target as HTMLInputElement).value,
                              );
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                          className="bg-paper border-neutral-200 text-ink placeholder:text-neutral-400"
                        />
                        <Button
                          size="icon"
                          onClick={(e) => {
                            const input = e.currentTarget
                              .previousElementSibling as HTMLInputElement;
                            addQuestionText(round.key, input.value);
                            input.value = "";
                          }}
                          className="shrink-0 bg-ink text-paper hover:bg-neutral-800"
                          title="Add question"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {round.sampleQuestions.length > 0 && (
                    <div className="space-y-1.5">
                      {round.sampleQuestions.map((q, qi) => (
                        <div
                          key={qi}
                          className="flex items-start gap-2 rounded-lg bg-white border border-neutral-200 px-3 py-2"
                        >
                          <span className="text-[10px] text-neutral-500 mt-0.5">
                            Q{qi + 1}.
                          </span>
                          <p className="flex-1 text-xs text-ink">{q}</p>
                          <button
                            onClick={() => removeQuestion(round.key, qi)}
                            className="text-neutral-400 hover:text-rose-500 mt-0.5"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() =>
                        setSearchOpen(
                          searchOpen === round.key ? null : round.key,
                        )
                      }
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                    >
                      <Search className="size-3.5" />{" "}
                      {searchOpen === round.key ? "Hide" : "Search"} the
                      question database
                    </button>

                    {searchOpen === round.key && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="e.g. deadlock, scale, leadership..."
                            className="bg-paper border-neutral-200 text-ink placeholder:text-neutral-400"
                          />
                          <Button
                            size="sm"
                            onClick={() => runSearch(round.key)}
                            disabled={searching}
                            className="bg-ink text-paper hover:bg-neutral-800"
                          >
                            {searching ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Search className="size-3.5" />
                            )}
                            Search
                          </Button>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="max-h-52 overflow-y-auto rounded-lg border border-neutral-200 divide-y divide-neutral-100 bg-white">
                            {searchResults.map((r) => (
                              <div
                                key={r.id}
                                className="flex items-start gap-2 px-3 py-2"
                              >
                                <div className="flex-1">
                                  <p className="text-xs text-ink">
                                    {r.text}
                                  </p>
                                  <p className="text-[10px] text-neutral-500">
                                    {r.source}{" "}
                                    {r.company ? `· ${r.company}` : ""} · ▲{" "}
                                    {r.up - r.down}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    addQuestionText(round.key, r.text)
                                  }
                                  className="shrink-0 h-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                >
                                  <ArrowDownToLine className="size-3.5" /> Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Consent */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" /> Before you
              publish
            </h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox className="mt-0.5" />
              <span className="text-xs text-neutral-600 leading-relaxed">
                I confirm this is my genuine interview experience, and I'm
                comfortable sharing it publicly to help others prepare.
                Questions I list will join the community question database where
                others can upvote and practice them.
              </span>
            </label>

            <Button
              size="lg"
              onClick={publish}
              disabled={publishing}
              className="w-full bg-ink text-paper hover:bg-neutral-800"
            >
              {publishing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="size-4" />
              )}
              {publishing
                ? "Publishing to the community..."
                : "Publish my experience"}
            </Button>
          </section>
        </main>
      </RequireContributor>
    </div>
  );
}
