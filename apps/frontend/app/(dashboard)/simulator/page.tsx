"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "@/components/app/AppHeader";
import { createInterviewSession, InterviewSession } from "@/lib/api";
import {
  Building2,
  Briefcase,
  GitBranch,
  User,
  ArrowRight,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";

function SimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [company, setCompany] = useState(searchParams.get("company") || "Stripe");
  const [role, setRole] = useState(searchParams.get("role") || "Senior Payments Infrastructure Engineer");
  const [candidateName, setCandidateName] = useState("Alex Rivera");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState(
    "Led backend infrastructure scaling payment idempotency gateway handling 50k req/sec on PostgreSQL & Redis. Debugged memory leaks and database deadlock contention under extreme concurrency."
  );
  const [githubUrl, setGithubUrl] = useState("https://github.com/example/payments-engine");

  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);

  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role) return;

    setIsLoading(true);
    try {
      const createdSession = await createInterviewSession({
        company,
        role,
        candidateName,
        jobDescription,
        resumeText,
        githubUrl,
      });
      setSession(createdSession);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (session) {
      router.push(`/interview/${session.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24 selection:bg-neutral-800">
      <AppHeader />

      <main className="max-w-5xl mx-auto pt-10 px-4 space-y-8">
        {/* Page Header */}
        <div className="border-b border-neutral-800 pb-6">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Simulator Engine
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Configure Interview Simulation
          </h1>
          <p className="text-neutral-400 text-xs md:text-sm mt-1">
            Build a multi-round video interview blueprint matching target company requirements, candidate resume, and code repos.
          </p>
        </div>

        {/* Input Form & Blueprint Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <form
            onSubmit={handleGenerateBlueprint}
            className="lg:col-span-6 bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl space-y-5 shadow-2xl"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800/80 pb-3">
              Target Role & Profile
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Target Company *
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe, Google, OpenAI"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Target Role *
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Payments Infrastructure Engineer"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Candidate Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Resume Highlights / Projects
                </label>
                <textarea
                  rows={3}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste resume achievements..."
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  GitHub Profile / Repo URL
                </label>
                <div className="relative">
                  <GitBranch className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-neutral-100 text-neutral-950 hover:bg-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Constructing Blueprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-neutral-950" />
                  <span>Generate Interview Blueprint</span>
                </>
              )}
            </button>
          </form>

          {/* Blueprint Preview */}
          <div className="lg:col-span-6 space-y-4">
            {!session ? (
              <div className="bg-neutral-900/40 border border-dashed border-neutral-800 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Interview Blueprint Preview</h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Fill out the parameters on the left to synthesize target interviewer personas and rounds.
                </p>
              </div>
            ) : (
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Generated Blueprint
                    </span>
                    <h3 className="text-base font-bold text-white">{session.blueprint.company} • {session.blueprint.role}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-xs border border-neutral-700 font-mono">
                    {session.blueprint.rounds.length} Rounds
                  </span>
                </div>

                {/* Rounds List */}
                <div className="space-y-3">
                  {session.blueprint.rounds.map((round, rIdx) => (
                    <div key={round.id} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-neutral-800 text-white font-mono text-[11px] font-bold flex items-center justify-center">
                            {rIdx + 1}
                          </span>
                          <h4 className="font-bold text-white">{round.name}</h4>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                          {round.type}
                        </span>
                      </div>

                      {/* Personas */}
                      <div className="space-y-1.5 pt-1">
                        {round.interviewers.map((persona) => (
                          <div key={persona.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                            <img src={persona.avatarUrl} alt={persona.name} className="w-8 h-8 rounded-full object-cover border border-neutral-700" />
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-semibold text-white truncate">{persona.name}</h5>
                              <p className="text-[10px] text-neutral-400 truncate">{persona.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStartInterview}
                  className="w-full py-3 rounded-lg bg-neutral-100 text-neutral-950 hover:bg-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Launch Agora Live Room</span>
                  <ArrowRight className="w-4 h-4 text-neutral-950" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center text-xs text-neutral-400">Loading simulator...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
