"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store";
import { setContributorMode } from "@/lib/store/authSlice";
import { useAuth } from "@/lib/auth-context";
import {
  fetchGoals,
  fetchPracticeSessions,
  fetchAgents,
  fetchInterviewTemplates,
  Goal,
  PracticeSession,
  Agent,
  InterviewTemplate,
} from "@/lib/api";
import {
  LogOut,
  Loader2,
  Sparkles,
  PenLine,
  Target,
  Award,
  Bot,
  Layers,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, logout, isAuthenticated } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    (async () => {
      const [g, s, a, t] = await Promise.all([
        fetchGoals(),
        fetchPracticeSessions(),
        fetchAgents(true),
        fetchInterviewTemplates("mine"),
      ]);
      setGoals(g);
      setSessions(s);
      setAgents(a);
      setTemplates(t);
      setLoading(false);
    })();
  }, [isAuthenticated, router]);

  const isContributor = !!user?.isContributor;
  const contributorType = user?.contributorType || null;
  const passed = sessions.filter((s) => s.status === "PASSED").length;
  const avgScore = sessions.length
    ? Math.round(
        sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) /
          sessions.length,
      )
    : 0;

  const switchMode = async (type: "creator" | "both") => {
    setBusy(type);
    await dispatch(setContributorMode(type));
    setBusy(null);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center text-xs text-neutral-400">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-24">
      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-8 space-y-8">
        <div className="border-b border-neutral-200 pb-6">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Account & Settings
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mt-1">
            Profile
          </h1>
        </div>

        {/* Identity */}
        <Card className="bg-white border-neutral-200">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-neutral-200 to-neutral-300 border border-neutral-300 text-2xl font-bold text-ink">
                {user.name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-ink">{user.name}</h2>
                  {isContributor ? (
                    <Badge className="gap-1 bg-indigo-50 border border-indigo-200 text-indigo-600">
                      <Sparkles className="size-3" />
                      Contributor
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-neutral-300 text-neutral-500"
                    >
                      Candidate
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-500">{user.email}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {user.currentRole || "No role set"} ·{" "}
                  {user.experienceLevel || "N/A"} level
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Candidate stats */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink">Candidate workspace</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-neutral-200">
              <CardContent className="p-5 flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500">
                  <Target className="size-4" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-ink">{goals.length}</p>
                  <p className="text-[11px] text-neutral-400">Practice goals</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-neutral-200">
              <CardContent className="p-5 flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500">
                  <Award className="size-4" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-ink">{passed}</p>
                  <p className="text-[11px] text-neutral-400">
                    Interviews passed
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-neutral-200">
              <CardContent className="p-5 flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500">
                  <Award className="size-4" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-ink">
                    {sessions.length ? `${avgScore}%` : "—"}
                  </p>
                  <p className="text-[11px] text-neutral-400">Average score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              >
                Dashboard <ChevronRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/interviews">
              <Button
                variant="outline"
                className="border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              >
                Community interviews <ChevronRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button
                variant="outline"
                className="border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              >
                Feed <ChevronRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Contributor section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink">Contributor workspace</h2>

          {!isContributor ? (
            <Card className="bg-white border-neutral-200">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl">
                  Contributors build the platform. As a contributor you get two
                  extra abilities — build interview loops with AI agents, and
                  share your real interview stories — all on top of your full
                  candidate workspace.
                </p>
                <Button
                  onClick={() => switchMode("both")}
                  disabled={!!busy}
                  className="h-auto gap-1.5 py-3 px-6"
                >
                  {busy === "both" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  <span className="font-semibold">Become a Contributor</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white border-neutral-200">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500">
                      <Bot className="size-4" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {agents.length}
                      </p>
                      <p className="text-[11px] text-neutral-500">My agents</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-neutral-200">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500">
                      <Layers className="size-4" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {templates.length}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        My interviews
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-neutral-200">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500">
                      <Globe className="size-4" />
                    </span>
                    <div>
                      <p className="text-[11px] text-neutral-500">
                        Contributor
                      </p>
                      <p className="text-sm font-bold text-white capitalize">
                        {contributorType || "member"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/studio/agents">
                  <Button className="gap-1.5">
                    <Bot className="size-4" /> Agent Studio
                  </Button>
                </Link>
                <Link href="/studio/interviews">
                  <Button
                    variant="outline"
                    className="gap-1.5 border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                  >
                    <Layers className="size-4" /> Interview Studio
                  </Button>
                </Link>
                <Link href="/feed/contribute">
                  <Button
                    variant="outline"
                    className="gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <PenLine className="size-4" /> Share an experience
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => switchMode("creator")}
                  disabled={busy === "none"}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  Back to candidate only
                </Button>
              </div>

              {contributorType === "sharer" && (
                <Link href="/feed/contribute">
                  <Button className="gap-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-200 hover:bg-emerald-900/60">
                    <PenLine className="size-4" /> Share your latest interview
                  </Button>
                </Link>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
