"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  Globe,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Bot,
  Search,
  ArrowDownToLine,
} from "lucide-react";

import RequireContributor from "@/components/app/RequireContributor";
import {
  createInterviewTemplate,
  fetchInterviewTemplates,
  fetchAgents,
  publishInterviewTemplate,
  deleteInterviewTemplate,
  createPracticeSession,
  searchQuestions,
  InterviewTemplate,
  Agent,
  TemplateRound,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ROUND_TYPES = [
  "RECRUITER",
  "TECHNICAL",
  "PANEL",
  "HIRING_MANAGER",
  "CODING",
] as const;
const LEVELS = [
  { value: "Entry", label: "Entry" },
  { value: "Mid-Senior", label: "Mid-Senior" },
  { value: "Senior", label: "Senior" },
  { value: "Staff", label: "Staff / Principal" },
];

interface RoundDraft {
  key: string;
  name: string;
  type: TemplateRound["type"];
  focusAreas: string;
  sampleQuestions: string;
  agentIds: string[];
}

function emptyRound(): RoundDraft {
  return {
    key: Math.random().toString(36).slice(2),
    name: "",
    type: "TECHNICAL",
    focusAreas: "",
    sampleQuestions: "",
    agentIds: [],
  };
}

export default function StudioInterviewsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  // create form state
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("Mid-Senior");
  const [mode, setMode] = useState<"personal" | "public">("personal");
  const [description, setDescription] = useState("");
  const [rounds, setRounds] = useState<RoundDraft[]>([emptyRound()]);

  const [qSearchOpen, setQSearchOpen] = useState<string | null>(null);
  const [qSearchText, setQSearchText] = useState("");
  const [qSearchResults, setQSearchResults] = useState<any[]>([]);
  const [qSearching, setQSearching] = useState(false);

  const runQSearch = async (key: string) => {
    setQSearching(true);
    const results = await searchQuestions({
      q: qSearchText,
      company: company || undefined,
    });
    setQSearchResults(results);
    setQSearching(false);
    setQSearchOpen(key);
  };

  const importQuestion = (key: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRounds((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              sampleQuestions: [r.sampleQuestions, trimmed]
                .filter(Boolean)
                .join("\n"),
            }
          : r,
      ),
    );
  };

  const load = async () => {
    const [t, a] = await Promise.all([
      fetchInterviewTemplates("mine"),
      fetchAgents(false),
    ]);
    setTemplates(t);
    setAgents(a);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setTitle("");
    setCompany("");
    setRole("");
    setLevel("Mid-Senior");
    setMode("personal");
    setDescription("");
    setRounds([emptyRound()]);
    setError("");
    setDialogOpen(true);
  };

  const updateRound = (key: string, patch: Partial<RoundDraft>) => {
    setRounds((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

  const toggleAgent = (key: string, agentId: string) => {
    setRounds((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              agentIds: r.agentIds.includes(agentId)
                ? r.agentIds.filter((id) => id !== agentId)
                : [...r.agentIds, agentId],
            }
          : r,
      ),
    );
  };

  const handleCreate = async () => {
    if (!title.trim() || !company.trim() || !role.trim()) {
      setError("Title, company, and role are required.");
      return;
    }
    const cleanRounds = rounds
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        type: r.type,
        focusAreas: r.focusAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        sampleQuestions: r.sampleQuestions
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        agentIds: r.agentIds,
      })) as unknown as TemplateRound[];

    if (cleanRounds.length === 0) {
      setError("Add at least one round with a name.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const template = await createInterviewTemplate({
        title: title.trim(),
        company: company.trim(),
        role: role.trim(),
        level,
        description: description.trim(),
        mode,
        rounds: cleanRounds as TemplateRound[],
      });
      setTemplates((prev) => [template, ...prev]);
      setDialogOpen(false);
    } catch (err) {
      setError("Could not create the interview. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id: string) => {
    const updated = await publishInterviewTemplate(id);
    if (updated) {
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteInterviewTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
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
    <RequireContributor>
      <div className="min-h-screen bg-paper text-ink font-sans pb-24">
        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-6">
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Contributor Studio
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mt-1">
                Interview Loops
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                Assemble rounds, assign your interviewer agents, and publish for
                the community — or keep it for personal prep.
              </p>
            </div>
            <Button onClick={openCreate} className="bg-ink text-paper hover:bg-neutral-800">
              <Plus className="size-4" />
              Create Interview
            </Button>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-6 animate-spin text-neutral-500" />
            </div>
          ) : templates.length === 0 ? (
            <Card className="bg-white border-dashed border-neutral-300">
              <CardContent className="p-10 text-center space-y-3">
                <Layers className="size-10 text-neutral-400 mx-auto" />
                <h3 className="text-sm font-semibold text-ink">
                  No interviews yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Create an interview with structured rounds, assign agents to
                  each round, and publish it for the community to practice.
                </p>
                <Button onClick={openCreate} className="mx-auto bg-ink text-paper hover:bg-neutral-800">
                  <Sparkles className="size-4" />
                  Create your first interview
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const rating = template.ratingCount ? template.ratingAvg : 0;
                return (
                  <Card
                    key={template.id}
                    className="bg-white border-neutral-200 shadow-sm"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-ink text-sm flex items-center gap-2">
                            <span className="truncate">{template.title}</span>
                            {template.mode === "public" ? (
                              <Globe className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Lock className="size-3.5 text-amber-600 shrink-0" />
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5 text-neutral-500">
                            {template.company} · {template.role} ·{" "}
                            {template.level}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            template.status === "published"
                              ? "border-emerald-300 text-emerald-700 bg-emerald-50 shrink-0"
                              : "border-neutral-300 text-neutral-600 bg-neutral-50 shrink-0"
                          }
                        >
                          {template.status === "published"
                            ? "Published"
                            : "Draft"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {template.rounds.map((r, idx) => (
                          <span
                            key={r.id}
                            className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[10px] text-neutral-600"
                          >
                            {idx + 1}. {r.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                        <span>{template.rounds.length} rounds</span>
                        <span className="size-1 rounded-full bg-neutral-300" />
                        <span className="flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          {rating ? rating.toFixed(1) : "—"}
                          <span>({template.ratingCount})</span>
                        </span>
                        <span className="size-1 rounded-full bg-neutral-300" />
                        <span>{template.views} views</span>
                      </div>

                      <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePractice(template)}
                            disabled={starting === template.id}
                            className="border-neutral-300 bg-white text-ink hover:bg-neutral-100"
                          >
                            {starting === template.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="size-3.5" />
                            )}
                            Practice
                          </Button>
                          {template.mode === "public" &&
                            template.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePublish(template.id)}
                                className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Publish
                              </Button>
                            )}
                        </div>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-neutral-400 hover:text-rose-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        {/* Create dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create an interview loop</DialogTitle>
              <DialogDescription>
                Set up the interview, then add rounds and assign an interviewer
                agent to each one.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Basic info */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Basics
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Title *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Stripe Senior Payments Loop"
                      className="bg-neutral-50 border-neutral-200 text-neutral-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Company *
                    </label>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Stripe (or General)"
                      className="bg-neutral-50 border-neutral-200 text-neutral-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Target role *
                    </label>
                    <Input
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Senior Payments Engineer"
                      className="bg-neutral-50 border-neutral-200 text-neutral-900"
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
                      <SelectTrigger className="w-full bg-neutral-50 border-neutral-200 text-neutral-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Description
                  </label>
                  <Textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of the loop for candidates..."
                    className="bg-neutral-50 border-neutral-200 text-neutral-900"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Visibility
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={mode === "personal"}
                      onCheckedChange={() => setMode("personal")}
                    />
                    <span className="text-xs text-neutral-700 font-medium">Personal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={mode === "public"}
                      onCheckedChange={() => setMode("public")}
                    />
                    <span className="text-xs text-neutral-700 font-medium">Public</span>
                  </label>
                </div>
              </div>

              {/* Rounds builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Rounds
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRounds((prev) => [...prev, emptyRound()])}
                    className="border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                  >
                    <Plus className="size-3.5" />
                    Add round
                  </Button>
                </div>

                <div className="space-y-4">
                  {rounds.map((round, rIdx) => (
                    <div
                      key={round.key}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                          <span className="flex size-5 items-center justify-center rounded bg-neutral-200 text-[10px] font-bold text-neutral-700">
                            {rIdx + 1}
                          </span>
                          Round
                        </span>
                        {rounds.length > 1 && (
                          <button
                            onClick={() =>
                              setRounds((prev) =>
                                prev.filter((r) => r.key !== round.key),
                              )
                            }
                            className="text-neutral-600 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Round name *
                          </label>
                          <Input
                            value={round.name}
                            onChange={(e) =>
                              updateRound(round.key, { name: e.target.value })
                            }
                            placeholder="e.g. System Design Deep-Dive"
                            className="bg-neutral-900 border-neutral-800 text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Type
                          </label>
                          <Select
                            value={round.type}
                            onValueChange={(v) =>
                              updateRound(round.key, {
                                type: (v ||
                                  "TECHNICAL") as TemplateRound["type"],
                              })
                            }
                          >
                            <SelectTrigger className="w-full bg-neutral-900 border-neutral-800 text-white">
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
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                          Focus areas
                        </label>
                        <Input
                          value={round.focusAreas}
                          onChange={(e) =>
                            updateRound(round.key, {
                              focusAreas: e.target.value,
                            })
                          }
                          placeholder="Comma separated — e.g. Scalability, Fault Tolerance"
                          className="bg-neutral-900 border-neutral-800 text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                          Sample questions (one per line)
                        </label>
                        <Textarea
                          rows={3}
                          value={round.sampleQuestions}
                          onChange={(e) =>
                            updateRound(round.key, {
                              sampleQuestions: e.target.value,
                            })
                          }
                          placeholder={
                            "How would you design a payments system for 50k RPS?\nWalk me through a past scaling challenge."
                          }
                          className="bg-neutral-900 border-neutral-800 text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setQSearchOpen(
                              qSearchOpen === round.key ? null : round.key,
                            )
                          }
                          className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300"
                        >
                          <Search className="size-3.5" />
                          {qSearchOpen === round.key ? "Hide" : "Search"} the
                          community question database to import
                        </button>

                        {qSearchOpen === round.key && (
                          <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-2.5 shadow-sm">
                            <div className="flex gap-2">
                              <Input
                                value={qSearchText}
                                onChange={(e) => setQSearchText(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && runQSearch(round.key)
                                }
                                placeholder="Search questions (e.g. deadlock, scale, idempotency)..."
                                className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 h-8"
                              />
                              <Button
                                size="sm"
                                onClick={() => runQSearch(round.key)}
                                disabled={qSearching}
                                className="h-8 shrink-0"
                              >
                                {qSearching ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Search className="size-3.5" />
                                )}
                              </Button>
                            </div>
                            {qSearchResults.length > 0 && (
                              <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                                {qSearchResults.map((q) => (
                                  <div
                                    key={q.id}
                                    className="flex items-start gap-2 rounded-md bg-neutral-50 border border-neutral-200 px-2.5 py-1.5"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs text-neutral-800 leading-snug">
                                        {q.text}
                                      </p>
                                      <p className="text-[10px] text-neutral-500">
                                        {q.source} · {q.company || "—"} · score{" "}
                                        {(q.up || 0) - (q.down || 0)}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        importQuestion(round.key, q.text)
                                      }
                                      className="h-6 shrink-0 px-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-neutral-200"
                                    >
                                      <ArrowDownToLine className="size-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                          Interviewer agents
                        </label>
                        {agents.length === 0 ? (
                          <p className="text-xs text-neutral-500">
                            No agents available yet.{" "}
                            <a
                              href="/studio/agents"
                              className="text-indigo-600 underline underline-offset-2"
                            >
                              Create an agent first
                            </a>
                            . Without agents, an AI interviewer will be
                            auto-generated.
                          </p>
                        ) : (
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {agents.map((agent) => {
                              const checked = round.agentIds.includes(agent.id);
                              return (
                                <label
                                  key={agent.id}
                                  className={`flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                                    checked
                                      ? "border-indigo-500 bg-indigo-50/80 text-indigo-950"
                                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() =>
                                      toggleAgent(round.key, agent.id)
                                    }
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-neutral-900 truncate">
                                      {agent.name}
                                    </p>
                                    <p className="text-[10px] text-neutral-500 truncate">
                                      {agent.role}
                                    </p>
                                  </div>
                                  <Bot className="size-3.5 text-neutral-400 shrink-0" />
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating interview...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Create Interview
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireContributor>
  );
}
