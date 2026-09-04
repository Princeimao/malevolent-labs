"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Target,
  Compass,
  Award,
  TrendingUp,
  Plus,
  Loader2,
  ArrowRight,
  Trash2,
  PlayCircle,
  Sparkles,
  Zap,
  Layers,
  Video,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import {
  createGoal,
  deleteGoal,
  fetchGoals,
  fetchPracticeSessions,
  createPracticeSession,
  Goal,
  PracticeSession,
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ONBOARDING_OPTIONS } from "@/constants";

const goalSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  role: z.string().min(1, "Target role is required"),
  level: z.string().optional(),
  notes: z.string().optional(),
});

type GoalValues = z.infer<typeof goalSchema>;

function GoalDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (goal: Goal) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { title: "", company: "", role: "", level: "", notes: "" },
  });

  const onSubmit = async (values: GoalValues) => {
    setError("");
    setCreating(true);
    try {
      const goal = await createGoal({
        title: values.title || undefined,
        company: values.company || undefined,
        role: values.role,
        level: values.level || undefined,
        notes: values.notes || undefined,
      });
      onCreated(goal);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      setError("Could not create your goal. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a practice goal</DialogTitle>
          <DialogDescription>
            Tell us where you want to get hired — AI builds the full interview
            structure for you.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target company</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Google"
                        disabled={creating}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Leave blank for a general prep goal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target role *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. SDE / Software Engineer"
                        disabled={creating}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience level</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select level (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {ONBOARDING_OPTIONS.experienceLevels.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anything to focus on?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="e.g. I want to focus on system design and coding rounds"
                      disabled={creating}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Building your plan...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Generate Interview Plan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const load = async () => {
    const [g, s] = await Promise.all([fetchGoals(), fetchPracticeSessions()]);
    setGoals(g);
    setSessions(s);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStartGoal = async (goal: Goal) => {
    setStarting(goal.id);
    try {
      const session = await createPracticeSession({ goalId: goal.id });
      router.push(`/practice/${session.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(null);
    }
  };

  const handleQuickPractice = async () => {
    setStarting("quick");
    try {
      const session = await createPracticeSession({
        role: "Software Engineer",
      });
      router.push(`/practice/${session.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(null);
    }
  };

  const [jdCompany, setJdCompany] = useState("");
  const [jdRole, setJdRole] = useState("");
  const [jd, setJd] = useState("");

  const handleRunFromJob = async () => {
    setStarting("jd");
    try {
      const session = await createPracticeSession({
        company: jdCompany || undefined,
        role: jdRole || "Software Engineer",
        resumeText: jd || undefined,
        candidateName: user?.name,
      });
      router.push(`/practice/${session.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(null);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const passed = sessions.filter((s) => s.status === "PASSED").length;
  const avgScore = sessions.length
    ? Math.round(
        sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) /
          sessions.length,
      )
    : 0;

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-24">
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-8 space-y-10">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Candidate Workspace
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mt-1">
              Welcome back, {user?.name || "Candidate"}
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Track your goals, practice round-by-round, and build momentum
              toward your target role.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleQuickPractice}
              disabled={!!starting}
              className="border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
            >
              {starting === "quick" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Video className="size-4" />
              )}
              Quick Practice
            </Button>
            <Button onClick={() => setGoalDialogOpen(true)}>
              <Plus className="size-4" />
              Create Goal
            </Button>
          </div>
        </div>

        {/* Run an interview from a job description */}
        <Card className="border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Give an interview
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-ink mt-1">
                  Paste any job description. We'll run the interview.
                </h2>
                <p className="text-neutral-500 text-sm mt-1 max-w-2xl">
                  Drop in a real JD plus the company and role, and the AI builds
                  a matching multi-round interview — no public interview
                  required.
                </p>
              </div>
              <Button
                onClick={handleQuickPractice}
                variant="ghost"
                disabled={starting === "quick"}
                className="text-neutral-500 hover:text-ink w-fit shrink-0"
              >
                {starting === "quick" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Zap className="size-4" />
                )}
                Or try a quick round
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={jdCompany}
                onChange={(e) => setJdCompany(e.target.value)}
                placeholder="Company — e.g. Stripe (optional)"
                className="bg-white border-neutral-200 text-ink placeholder:text-neutral-400"
              />
              <Input
                value={jdRole}
                onChange={(e) => setJdRole(e.target.value)}
                placeholder="Role — e.g. Senior Backend Engineer"
                className="bg-white border-neutral-200 text-ink placeholder:text-neutral-400"
              />
            </div>
            <Textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={4}
              placeholder="Paste the job description here — responsibilities, requirements, tech stack..."
              className="bg-white border-neutral-200 text-ink placeholder:text-neutral-400"
            />
            <Button
              onClick={handleRunFromJob}
              disabled={starting === "jd"}
              size="lg"
            >
              {starting === "jd" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PlayCircle className="size-4" />
              )}
              Build my interview & start round 1
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Target,
              label: "Active goals",
              value: goals.filter((g) => g.status === "active").length,
              sub: `${goals.filter((g) => g.status === "completed").length} completed`,
            },
            {
              icon: Award,
              label: "Interviews passed",
              value: passed,
              sub: `${sessions.length} total sessions`,
            },
            {
              icon: TrendingUp,
              label: "Average score",
              value: sessions.length ? `${avgScore}%` : "—",
              sub: sessions.length ? "Across all sessions" : "No sessions yet",
            },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white border-neutral-200">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500">
                  <stat.icon className="size-4" />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-ink">{stat.value}</p>
                  <p className="text-[11px] text-neutral-400">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Goals */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">
                Your practice goals
              </h2>
              <p className="text-xs text-neutral-400">
                AI builds the interview structure for each goal. Pass rounds to
                progress.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGoalDialogOpen(true)}
              className="text-neutral-400 hover:text-ink"
            >
              <Plus className="size-4" />
              New goal
            </Button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="size-6 animate-spin text-neutral-500" />
            </div>
          ) : goals.length === 0 ? (
            <Card className="bg-neutral-50 border-dashed border-neutral-200">
              <CardContent className="p-10 text-center space-y-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-100 border border-neutral-200 mx-auto text-neutral-400">
                  <Target className="size-6" />
                </div>
                <h3 className="text-sm font-semibold text-ink">No goals yet</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Create your first goal — like "Prepare for Google SDE" — and
                  the AI will map out every round you need to pass.
                </p>
                <Button
                  onClick={() => setGoalDialogOpen(true)}
                  className="mx-auto mt-2"
                >
                  <Sparkles className="size-4" />
                  Create your first goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => {
                const progress = goal.totalRounds
                  ? Math.round((goal.completedRounds / goal.totalRounds) * 100)
                  : 0;
                return (
                  <Card key={goal.id} className="bg-white border-neutral-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="text-ink text-sm flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-neutral-300 text-neutral-500 shrink-0"
                            >
                              {goal.company || "General"}
                            </Badge>
                            <span className="truncate">{goal.role}</span>
                          </CardTitle>
                          <CardDescription className="mt-1.5 text-xs line-clamp-2 whitespace-pre-line">
                            {goal.plan.split("\n").slice(0, 3).join("\n")}
                          </CardDescription>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-neutral-400 hover:text-rose-400 transition-colors shrink-0"
                          title="Delete goal"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Progress
                            value={progress}
                            className="flex-wrap items-center gap-1.5"
                          />
                          <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                            <span>
                              {goal.completedRounds} / {goal.totalRounds} rounds
                            </span>
                            <span>{progress}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {goal.rounds.map((r, idx) => (
                          <span
                            key={r.id}
                            className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[10px] text-neutral-500"
                          >
                            {idx + 1}. {r.name}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500">
                          {goal.status === "completed"
                            ? "Completed 🎉"
                            : `${goal.rounds.length}-round structure ready`}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleStartGoal(goal)}
                          disabled={starting === goal.id}
                        >
                          {starting === goal.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <PlayCircle className="size-4" />
                          )}
                          {goal.status === "completed"
                            ? "Practice Again"
                            : "Start"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick launch cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-neutral-200 bg-white">
            <CardContent className="p-5 space-y-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-500">
                <Layers className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-ink">Build an interview</h3>
              <p className="text-xs text-neutral-500">
                Create interviewer agents and assemble a full interview loop —
                for yourself or the community.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/studio/interviews")}
                className="mt-1 border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              >
                Open Studio <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 bg-white">
            <CardContent className="p-5 space-y-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-500">
                <Compass className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-ink">Explore the feed</h3>
              <p className="text-xs text-neutral-500">
                Practice real interview loops and experiences rated by the
                community.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/feed")}
                className="mt-1 border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              >
                Browse Feed <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 bg-white">
            <CardContent className="p-5 space-y-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-500">
                <CheckCircle2 className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-ink">
                Share your experience
              </h3>
              <p className="text-xs text-neutral-500">
                Contributed a real interview? Add your questions, rounds, and
                answers to help the community.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/feed/contribute")}
                className="mt-1 border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              >
                Contribute <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Recent sessions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">
              Recent practice sessions
            </h2>
            <span className="text-[11px] text-neutral-500">
              Your session history
            </span>
          </div>

          {sessions.length === 0 ? (
            <Card className="bg-neutral-50 border-dashed border-neutral-200">
              <CardContent className="p-8 text-center text-xs text-neutral-400">
                You haven't taken a practice session yet. Create a goal or hit
                Quick Practice to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-neutral-50">
              {sessions.slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span
                      className={`flex size-8 items-center justify-center rounded-lg border ${
                        s.status === "PASSED"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : s.status === "FAILED"
                            ? "bg-rose-50 border-rose-200 text-rose-500"
                            : "bg-neutral-100 border-neutral-200 text-neutral-500"
                      }`}
                    >
                      {s.status === "PASSED" ? (
                        <CheckCircle2 className="size-4" />
                      ) : s.status === "FAILED" ? (
                        <XCircle className="size-4" />
                      ) : (
                        <Video className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {s.company} · {s.role}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {s.roundResults.length}/{s.blueprint.rounds.length}{" "}
                        rounds · {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.overallScore ? (
                      <span className="font-mono text-sm font-bold text-neutral-600">
                        {s.overallScore}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-500 uppercase">
                        In progress
                      </span>
                    )}
                    {s.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/practice/${s.id}`)}
                      >
                        Resume
                      </Button>
                    )}
                    {s.status === "PASSED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/practice/${s.id}`)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        onCreated={(goal) => setGoals((prev) => [goal, ...prev])}
      />
    </div>
  );
}
