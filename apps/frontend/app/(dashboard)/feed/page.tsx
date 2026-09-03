"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import {
  fetchFeed,
  fetchInterviewTemplates,
  rateInterviewTemplate,
  voteInterviewTemplate,
  voteFeedItem,
  createPracticeSession,
  FeedItem,
  InterviewTemplate,
} from "@/lib/api";
import {
  Search,
  PlusCircle,
  ArrowRight,
  Filter,
  Loader2,
  Globe,
  Star,
  PlayCircle,
  ArrowUp,
  ArrowDown,
  MessageCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function RatingStars({ value, onRate }: { value: number; onRate?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={!onRate}
          onClick={() => onRate?.(n)}
          className={onRate ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`size-3.5 ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-neutral-600"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const topicsList = ["System Design", "Distributed Systems", "Database Concurrency", "API Design", "Idempotency", "Next.js/React", "WebSockets"];

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [items, tpls] = await Promise.all([
        fetchFeed({ query, topic: selectedTopic || undefined }),
        fetchInterviewTemplates("public"),
      ]);
      setFeedItems(items);
      setTemplates(tpls);
      setLoading(false);
    }
    load();
  }, [query, selectedTopic]);

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

  const handleRate = async (templateId: string, rating: number) => {
    const res = await rateInterviewTemplate(templateId, rating);
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, ratingAvg: res.ratingAvg, ratingCount: res.ratingCount } : t
      )
    );
  };

  const handleTemplateVote = async (templateId: string, dir: 1 | -1) => {
    const res = await voteInterviewTemplate(templateId, dir);
    if (res) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, votesUp: res.votesUp, votesDown: res.votesDown } : t
        )
      );
    }
  };

  const handleExperienceVote = async (id: string, dir: 1 | -1) => {
    const eng = await voteFeedItem(id, dir);
    if (eng) {
      setFeedItems((prev) => prev.map((f) => (f.id === id ? { ...f, engagement: eng } : f)));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24">
      <AppHeader />

      <main className="max-w-6xl mx-auto pt-8 px-4 md:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Community Intelligence
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
              Community Feed
            </h1>
            <p className="text-neutral-400 text-xs md:text-sm mt-1">
              Practice published interview loops and real experiences, rated by the
              community — the best rise to the top.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/studio/interviews">
              <Button variant="outline" className="border-neutral-800 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-800">
                <Globe className="size-4" />
                Create Interview
              </Button>
            </Link>
            <Link href="/feed/contribute">
              <Button>
                <PlusCircle className="size-4" />
                Contribute
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by company, role, or question topic..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-neutral-500 font-medium text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Topics:
            </span>
            <button
              onClick={() => setSelectedTopic(null)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                selectedTopic === null
                  ? "bg-neutral-800 border-neutral-700 text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              All
            </button>
            {topicsList.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTopic(selectedTopic === t ? null : t)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                  selectedTopic === t
                    ? "bg-neutral-800 border-neutral-700 text-white"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400 mx-auto" />
            <p className="text-neutral-500 text-xs">Loading community content...</p>
          </div>
        ) : (
          <Tabs defaultValue="interviews">
            <TabsList className="bg-neutral-900 border border-neutral-800">
              <TabsTrigger value="interviews">Published Interviews</TabsTrigger>
              <TabsTrigger value="experiences">Experiences</TabsTrigger>
            </TabsList>

            {/* Published interviews */}
            <TabsContent value="interviews" className="mt-4">
              {templates.length === 0 ? (
                <div className="py-16 text-center bg-neutral-900/40 border border-neutral-800 rounded-xl space-y-3">
                  <Globe className="size-8 text-neutral-600 mx-auto" />
                  <p className="text-neutral-400 text-xs">No published interviews yet.</p>
                  <Link href="/studio/interviews">
                    <Button size="sm">Create one now</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 p-5 rounded-xl space-y-4 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-sm">{template.title}</h3>
                            <p className="text-xs text-neutral-400">
                              {template.company} · {template.role} · {template.level}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-neutral-700 text-neutral-300 shrink-0">
                            {template.rounds.length} rounds
                          </Badge>
                        </div>

                        <p className="text-neutral-300 text-xs leading-relaxed line-clamp-2">
                          {template.description || `A ${template.company} ${template.role} interview loop by ${template.ownerName}.`}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {template.rounds.map((r, idx) => (
                            <span key={r.id} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400">
                              {idx + 1}. {r.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <RatingStars value={template.ratingAvg || 0} />
                            <span className="text-neutral-500 text-[11px]">
                              {template.ratingCount ? template.ratingAvg.toFixed(1) : "—"} ({template.ratingCount})
                            </span>
                          </div>
                          <span className="text-neutral-500 text-[11px]">{template.views} views</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => handleRate(template.id, n)}
                                className="text-[10px] text-neutral-600 hover:text-amber-400 transition-colors"
                                title={`Rate ${n}/5`}
                              >
                                {n}
                              </button>
                            ))}
                            <span className="text-[10px] text-neutral-600 ml-1">rate</span>
                          </div>
                          <Button size="sm" onClick={() => handlePractice(template)} disabled={starting === template.id}>
                            {starting === template.id ? <Loader2 className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />}
                            Practice
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Experiences */}
            <TabsContent value="experiences" className="mt-4">
              {feedItems.length === 0 ? (
                <div className="py-16 text-center bg-neutral-900/40 border border-neutral-800 rounded-xl space-y-3">
                  <p className="text-neutral-400 text-xs">No interview experiences matching query.</p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setSelectedTopic(null);
                    }}
                    className="px-3 py-1.5 rounded bg-neutral-800 text-white text-xs font-medium"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 p-5 rounded-xl space-y-4 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-sm">{item.company}</h3>
                            <p className="text-xs text-neutral-400">{item.role}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-semibold text-neutral-300">
                            {item.difficulty}
                          </span>
                        </div>

                        <p className="text-neutral-300 text-xs leading-relaxed line-clamp-3">
                          {item.summary}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {item.topics.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-neutral-400">
                          <button
                            onClick={() => handleExperienceVote(item.id, 1)}
                            className="hover:text-emerald-400 transition-colors p-0.5"
                            title="Upvote"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <span className="font-semibold tabular-nums w-5 text-center text-neutral-300">
                            {item.engagement?.net ?? item.upvotes}
                          </span>
                          <button
                            onClick={() => handleExperienceVote(item.id, -1)}
                            className="hover:text-rose-400 transition-colors p-0.5"
                            title="Downvote"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <span className="ml-1 flex items-center gap-1 text-neutral-600">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {item.engagement?.commentCount ?? 0}
                          </span>
                        </div>

                        <Link
                          href={`/feed/${item.id}`}
                          className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors flex items-center gap-1"
                        >
                          <span>Read & discuss</span>
                          <ArrowRight className="w-3 h-3 text-neutral-400" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
