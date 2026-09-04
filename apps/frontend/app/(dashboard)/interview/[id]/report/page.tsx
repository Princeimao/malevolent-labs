"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchInterviewSession,
  InterviewSession,
  FinalEvaluation,
} from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Brain,
  RotateCcw,
  Loader2,
  UserCheck,
} from "lucide-react";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;
      try {
        const data = await fetchInterviewSession(sessionId);
        if (data) {
          setSession(data);
        }
      } catch (err) {
        console.error("Failed to load evaluation:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sessionId]);

  if (loading || !session || !session.evaluations) {
    return (
      <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center space-y-3 text-xs text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        <p>Generating scorecard...</p>
      </div>
    );
  }

  const evalData: FinalEvaluation = session.evaluations;

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-24">
      <main className="max-w-4xl mx-auto pt-8 px-4 md:px-6 space-y-8">
        {/* Top Header Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
            <div>
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Evaluation Completed
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-ink mt-0.5">
                {session.company} • {session.role}
              </h1>
              <p className="text-neutral-500 text-xs mt-0.5">
                Candidate: {session.candidateName}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-neutral-50 border border-neutral-200 p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-neutral-500 font-semibold uppercase block">
                  Score
                </span>
                <span className="text-2xl font-bold text-ink font-mono">
                  {evalData.overallScore}%
                </span>
              </div>
              <div className="h-8 w-px bg-neutral-200" />
              <div>
                <span className="text-[10px] text-neutral-500 font-semibold uppercase block mb-0.5">
                  Verdict
                </span>
                {evalData.passRecommendation ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pass / Hire</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Needs Work</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-neutral-600 text-xs leading-relaxed">
            {evalData.summary}
          </p>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { name: "Technical Depth", val: evalData.metrics.technicalAbility },
            { name: "Problem Solving", val: evalData.metrics.problemSolving },
            { name: "Communication", val: evalData.metrics.communication },
            { name: "Behavioral", val: evalData.metrics.behavioral },
            { name: "Role Specific", val: evalData.metrics.roleSpecific },
          ].map((m, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white border border-neutral-200 space-y-1 text-xs shadow-sm"
            >
              <span className="text-[10px] text-neutral-500 font-semibold block">
                {m.name}
              </span>
              <div className="flex items-center justify-between font-bold text-ink font-mono">
                <span>{m.val}%</span>
                <div className="w-12 h-1.5 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
                  <div
                    className="h-full bg-ink rounded-full"
                    style={{ width: `${m.val}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Growth Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-neutral-200 p-5 rounded-2xl space-y-3 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Strengths</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              {evalData.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-neutral-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-2xl space-y-3 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Growth Areas</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              {evalData.improvementSuggestions.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-neutral-400 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Struggled Questions */}
        {evalData.struggledQuestions.length > 0 && (
          <div className="bg-white border border-neutral-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-500" />
              <span>Question Deep-Dive & Suggested Answers</span>
            </h3>

            <div className="space-y-3 text-xs">
              {evalData.struggledQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2"
                >
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>Q: {q.question}</span>
                    <span className="text-[10px] text-neutral-500 font-normal">
                      By {q.interviewer}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-neutral-200 text-neutral-600">
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase block mb-0.5">
                      Your Response:
                    </span>
                    <p>"{q.candidateResponse}"</p>
                  </div>
                  <div className="p-2.5 rounded bg-indigo-50/50 border border-indigo-100 text-indigo-950">
                    <span className="text-[10px] font-semibold text-indigo-600 uppercase block mb-0.5">
                      Ideal Answer:
                    </span>
                    <p>{q.suggestedAnswer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interviewer Feedback */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <span>Interviewer Feedback Notes</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {evalData.interviewerFeedback.map((fb, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">
                    {fb.interviewerName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-semibold text-neutral-600">
                    {fb.verdict}
                  </span>
                </div>
                <p className="text-neutral-500 text-[11px]">{fb.role}</p>
                <p className="text-neutral-600 italic pt-0.5">
                  "{fb.feedback}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/simulator">
            <button className="px-5 py-2.5 rounded-lg bg-ink text-paper hover:bg-neutral-800 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Another Simulation</span>
            </button>
          </Link>
          <Link href="/feed">
            <button className="px-5 py-2.5 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-ink font-semibold text-xs transition-colors">
              Browse Dataset
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
