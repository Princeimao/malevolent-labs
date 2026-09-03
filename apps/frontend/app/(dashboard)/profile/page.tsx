"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store";
import { setContributorMode } from "@/lib/store/authSlice";
import { useAuth } from "@/lib/auth-context";
import AppHeader from "@/components/app/AppHeader";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    ? Math.round(sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / sessions.length)
    : 0;

  const switchMode = async (type: "creator" | "sharer" | "none") => {
    setBusy(type);
    await dispatch(setContributorMode(type));
    setBusy(null);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center text-xs text-neutral-400">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-8 space-y-8">
        <div className="border-b border-neutral-800 pb-6">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Account & Settings
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">Profile</h1>
        </div>

        {/* Identity */}
        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-800 border border-neutral-600 text-2xl font-bold text-white">
                {user.name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{user.name}</h2>
                  {isContributor ? (
                    <Badge className="gap-1 bg-indigo-950/70 border border-indigo-800 text-indigo-300">
                      <Sparkles className="size-3" />
                      {contributorType === "creator" ? "Interview Creator" : "Experience Sharer"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-neutral-700 text-neutral-400">
                      Candidate
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-400">{user.email}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {user.currentRole || "No role set"} · {user.experienceLevel || "N/A"} level
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="border-rose-900 bg-rose-950/40 text-rose-300 hover:bg-rose-950 hover:text-rose-200"
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Candidate stats */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Candidate workspace</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-5 flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300">
                  <Target className="size-4" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white">{goals.length}</p>
                  <p className="text-[11px] text-neutral-500">Practice goals</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-5 flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300">
                  <Award className="size-4" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white">{passed}</p>
                  <p className="text-[11px] text-neutral-500">Interviews passed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-5 flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300">
                  <Award className="size-4" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white">{sessions.length ? `${avgScore}%` : "—"}</p>
                  <p className="text-[11px] text-neutral-500">Average score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard">
              <Button variant="outline" className="border-neutral-800 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-800">
                Dashboard <ChevronRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/interviews">
              <Button variant="outline" className="border-neutral-800 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-800">
                Community interviews <ChevronRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" className="border-neutral-800 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-800">
                Feed <ChevronRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Contributor section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Contributor workspace</h2>

          {!isContributor ? (
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
                  Contributors build the platform. As an <span className="text-white font-medium">Interview Creator</span> you
                  craft agents and publish full interviews. As an{" "}
                  <span className="text-white font-medium">Experience Sharer</span> you feed the database with your real
                  interview stories. Candidates keep a focused workspace — this is entirely optional.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={() => switchMode("creator")} disabled={!!busy} className="h-auto flex-col gap-1.5 py-4 bg-indigo-950/50 border border-indigo-900 text-indigo-200 hover:bg-indigo-900/50">
                    {busy === "creator" ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-5" />}
                    <span className="text-white font-semibold">Become a Creator</span>
                  </Button>
                  <Button onClick={() => switchMode("sharer")} disabled={!!busy} className="h-auto flex-col gap-1.5 py-4 bg-emerald-950/50 border border-emerald-900 text-emerald-200 hover:bg-emerald-900/50">
                    {busy === "sharer" ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-5" />}
                    <span className="text-white font-semibold">Become a Sharer</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-neutral-900/60 border-neutral-800">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300">
                      <Bot className="size-4" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-white">{agents.length}</p>
                      <p className="text-[11px] text-neutral-500">My agents</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-neutral-900/60 border-neutral-800">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300">
                      <Layers className="size-4" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-white">{templates.length}</p>
                      <p className="text-[11px] text-neutral-500">My interviews</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-neutral-900/60 border-neutral-800">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300">
                      <Globe className="size-4" />
                    </span>
                    <div>
                      <p className="text-[11px] text-neutral-500">Contributor</p>
                      <p className="text-sm font-bold text-white capitalize">{contributorType || "member"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/studio/agents">
                  <Button className="gap-1.5"><Bot className="size-4" /> Agent Studio</Button>
                </Link>
                <Link href="/studio/interviews">
                  <Button variant="outline" className="gap-1.5 border-neutral-800 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-800">
                    <Layers className="size-4" /> Interview Studio
                  </Button>
                </Link>
                {contributorType !== "sharer" && (
                  <Button variant="ghost" onClick={() => switchMode("sharer")} disabled={busy === "sharer"} className="text-emerald-400 hover:text-emerald-300">
                    <PenLine className="size-4" /> Switch to Sharer
                  </Button>
                )}
                {contributorType !== "creator" && (
                  <Button variant="ghost" onClick={() => switchMode("creator")} disabled={busy === "creator"} className="text-indigo-400 hover:text-indigo-300">
                    <Bot className="size-4" /> Switch to Creator
                  </Button>
                )}
                <Button variant="ghost" onClick={() => switchMode("none")} disabled={busy === "none"} className="text-neutral-500 hover:text-neutral-300">
                  Back to candidate
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
