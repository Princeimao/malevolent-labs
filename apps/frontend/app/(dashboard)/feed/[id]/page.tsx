"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Loader2,
  ChevronLeft,
  Send,
  Clock,
  Users,
} from "lucide-react";

import AppHeader from "@/components/app/AppHeader";
import {
  fetchFeedItemDetail,
  voteFeedItem,
  addExperienceComment,
  voteQuestion,
  createPracticeSession,
  FeedItemDetail,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export default function ExperienceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [data, setData] = useState<FeedItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [qVotes, setQVotes] = useState<Record<string, { up: number; down: number }>>({});

  const load = async () => {
    const d = await fetchFeedItemDetail(id);
    setData(d);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleVote = async (dir: 1 | -1) => {
    const eng = await voteFeedItem(id, dir);
    if (eng && data) {
      setData({ ...data, experience: { ...data.experience, engagement: eng } });
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    const comments = await addExperienceComment(id, comment.trim());
    setComment("");
    if (data) setData({ ...data, comments });
    setPosting(false);
  };

  const handleQuestionVote = async (text: string, dir: 1 | -1) => {
    const prev = qVotes[text] || { up: 0, down: 0 };
    const q = await voteQuestion(text, dir);
    if (q) {
      setQVotes((m) => ({ ...m, [text]: { up: q.up, down: q.down } }));
    } else {
      setQVotes((m) => ({
        ...m,
        [text]: dir === 1 ? { up: prev.up + 1, down: prev.down } : { up: prev.up, down: prev.down + 1 },
      }));
    }
  };

  const handlePractice = async () => {
    if (!data) return;
    setStarting(true);
    try {
      const session = await createPracticeSession({
        company: data.experience.company,
        role: data.experience.role,
      });
      router.push(`/practice/${session.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center text-xs text-neutral-500">
        Experience not found.
      </div>
    );
  }

  const exp = data.experience;
  const eng = exp.engagement || { up: 0, down: 0, net: 0, commentCount: 0 };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-8 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="size-3.5" /> Back to feed
        </button>

        {/* Story header */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className="border-neutral-700 text-neutral-300">
              {exp.company}
            </Badge>
            <Badge variant="outline" className="border-neutral-700 text-neutral-300">
              {exp.role}
            </Badge>
            <span className="text-xs text-neutral-500">{exp.difficulty}</span>
          </div>

          <h1 className="text-2xl font-bold text-white">
            {exp.company} {exp.role} — shared by {exp.authorName}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {eng.net >= 0 ? "" : ""}
              {new Date().toDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {exp.rounds.length} rounds
            </span>
            {exp.topics.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                {t}
              </span>
            ))}
          </div>

          {/* Story body */}
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-300">
            {exp.storyHtml ? (
              <div
                className="rich-content text-neutral-200"
                dangerouslySetInnerHTML={{ __html: exp.storyHtml }}
              />
            ) : (
              <p className="whitespace-pre-line">{exp.summary}</p>
            )}

            {(exp.feel || exp.durationMinutes || exp.format) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {exp.format && (
                  <Badge variant="outline" className="border-neutral-800 text-neutral-400">
                    {exp.format}
                  </Badge>
                )}
                {exp.durationMinutes && (
                  <Badge variant="outline" className="border-neutral-800 text-neutral-400">
                    ~{exp.durationMinutes} min
                  </Badge>
                )}
                {exp.feel && (
                  <Badge variant="outline" className="border-neutral-800 text-neutral-400">
                    Felt: {exp.feel}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Rounds */}
          {exp.rounds && exp.rounds.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-sm font-bold text-white">The rounds</h2>
              {exp.rounds.map((round, idx) => (
                <div key={idx} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      <span className="mr-2 text-neutral-500">{idx + 1}.</span>
                      {round.name}
                    </h3>
                    <span className="text-[10px] uppercase text-neutral-500">{round.type}</span>
                  </div>
                  {round.interviewers && round.interviewers.length > 0 && (
                    <p className="mt-2 text-[11px] text-neutral-500">
                      Interviewers: {round.interviewers.map((i) => i.name).join(", ")}
                    </p>
                  )}
                  {round.sampleQuestions && round.sampleQuestions.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {round.sampleQuestions.map((q, qi) => {
                        const v = qVotes[q] || { up: 0, down: 0 };
                        return (
                          <div key={qi} className="flex items-start gap-2">
                            <span className="text-neutral-600 shrink-0 mt-0.5 text-xs">Q{qi + 1}.</span>
                            <p className="flex-1 text-xs text-neutral-300 leading-relaxed">{q}</p>
                            <span className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handleQuestionVote(q, 1)} className="text-neutral-600 hover:text-emerald-400 transition-colors" title="Useful question">
                                <ArrowUp className="size-3.5" />
                              </button>
                              <span className="text-[10px] tabular-nums text-neutral-500 w-5 text-center">
                                {v.up - v.down > 0 ? v.up - v.down : v.up - v.down < 0 ? v.up - v.down : 0}
                              </span>
                              <button onClick={() => handleQuestionVote(q, -1)} className="text-neutral-600 hover:text-rose-400 transition-colors" title="Not useful">
                                <ArrowDown className="size-3.5" />
                              </button>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Engagement */}
          <div className="mt-8 flex items-center justify-between border-t border-neutral-800 pt-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleVote(1)}
                className="p-2 rounded-lg text-neutral-400 hover:text-emerald-400 transition-colors"
              >
                <ArrowUp className="size-5" />
              </button>
              <span className={`text-sm font-bold tabular-nums ${eng.net > 0 ? "text-emerald-400" : eng.net < 0 ? "text-rose-400" : "text-neutral-400"}`}>
                {eng.net}
              </span>
              <button
                onClick={() => handleVote(-1)}
                className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors"
              >
                <ArrowDown className="size-5" />
              </button>
              <span className="ml-3 flex items-center gap-1.5 text-neutral-500 text-xs">
                <MessageSquare className="size-4" /> {data.comments.length} comments
              </span>
            </div>
            <Button size="sm" onClick={handlePractice} disabled={starting}>
              {starting ? <Loader2 className="size-3.5 animate-spin" /> : <></>}
              Practice this loop
            </Button>
          </div>
        </div>

        {/* Comments */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">
            Discussion ({data.comments.length})
          </h2>

          <div className="flex gap-2">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              placeholder={`Comment as ${user?.name || "you"}...`}
              className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600"
            />
            <Button size="icon" onClick={handleComment} disabled={posting || !comment.trim()}>
              {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>

          {data.comments.length === 0 ? (
            <p className="text-xs text-neutral-600 py-2">
              No comments yet. Start the discussion.
            </p>
          ) : (
            <div className="space-y-3">
              {data.comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex size-5 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-bold text-white">
                      {c.authorName?.[0] || "?"}
                    </span>
                    <span className="font-semibold text-white">{c.authorName}</span>
                    <span className="text-neutral-600 text-[10px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
