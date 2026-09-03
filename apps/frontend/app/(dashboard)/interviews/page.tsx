"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  ArrowUp,
  ArrowDown,
  PlayCircle,
  Users,
  Star,
} from "lucide-react";

import AppHeader from "@/components/app/AppHeader";
import {
  fetchInterviewTemplates,
  voteInterviewTemplate,
  createPracticeSession,
  InterviewTemplate,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEVELS = ["All levels", "Entry", "Mid-Senior", "Senior", "Staff"];

export default function InterviewsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const [starting, setStarting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const t = await fetchInterviewTemplates("public");
    setTemplates(t);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = templates
    .filter((t) => (level === "All levels" ? true : t.level === level))
    .filter((t) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.rounds.some((r) => r.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => (b.votesUp - b.votesDown) - (a.votesUp - a.votesDown));

  const handleVote = async (template: InterviewTemplate, dir: 1 | -1) => {
    const res = await voteInterviewTemplate(template.id, dir);
    if (res) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id ? { ...t, votesUp: res.votesUp, votesDown: res.votesDown } : t
        )
      );
    }
  };

  const handlePractice = async (template: InterviewTemplate) => {
    setStarting(template.id);
    try {
      const session = await createPracticeSession({ templateId: template.id });
      router.push(`/practice/${session.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Community Library
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
              Community interviews
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Full interview loops built by contributors — search by company, role,
              or level, and practice the ones the community rates highest.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search interviews, companies, roles, rounds..."
              className="bg-neutral-900 border-neutral-800 pl-10 text-white placeholder:text-neutral-600"
            />
          </div>
          <Select value={level} onValueChange={(v) => setLevel(v || "All levels")}>
            <SelectTrigger className="w-full sm:w-44 bg-neutral-900 border-neutral-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="size-6 animate-spin text-neutral-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3 rounded-2xl border border-dashed border-neutral-800">
            <Users className="size-8 text-neutral-600 mx-auto" />
            <p className="text-neutral-400 text-xs">
              {templates.length === 0
                ? "No community interviews published yet."
                : "No interviews match your filters."}
            </p>
            {templates.length === 0 && (
              <p className="text-neutral-600 text-xs max-w-sm mx-auto">
                Interviews are built by contributors. When someone publishes a
                loop, it appears here for everyone to practice.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((template) => {
              const netVotes = template.votesUp - template.votesDown;
              const rating = template.ratingCount ? template.ratingAvg : 0;
              return (
                <div
                  key={template.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition-colors hover:border-neutral-700"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Vote column */}
                    <div className="flex sm:flex-col items-center gap-1 sm:gap-0 shrink-0">
                      <button
                        onClick={() => handleVote(template, 1)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-400 transition-colors"
                        title="Upvote"
                      >
                        <ArrowUp className="size-5" />
                      </button>
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          netVotes > 0
                            ? "text-emerald-400"
                            : netVotes < 0
                              ? "text-rose-400"
                              : "text-neutral-400"
                        }`}
                      >
                        {netVotes}
                      </span>
                      <button
                        onClick={() => handleVote(template, -1)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors"
                        title="Downvote"
                      >
                        <ArrowDown className="size-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-white">{template.title}</h2>
                        <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                          {template.level}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {rating ? rating.toFixed(1) : "—"}
                          <span className="text-neutral-600">({template.ratingCount})</span>
                        </span>
                      </div>

                      <p className="text-sm text-neutral-300">
                        {template.company} · {template.role}
                        <span className="text-neutral-500"> · by {template.ownerName}</span>
                      </p>

                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                        {template.description ||
                          `A ${template.company} ${template.role} practice loop.`}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {template.rounds.map((r, idx) => (
                          <span
                            key={r.id}
                            className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400"
                          >
                            {idx + 1}. {r.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handlePractice(template)}
                        disabled={starting === template.id}
                      >
                        {starting === template.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <PlayCircle className="size-3.5" />
                        )}
                        Practice
                      </Button>
                      <span className="text-[10px] text-neutral-600">
                        {template.views} views · {template.rounds.length} rounds
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
