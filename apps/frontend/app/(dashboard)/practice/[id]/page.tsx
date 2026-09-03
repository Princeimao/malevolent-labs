"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Bot,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  Share2,
  MessageSquare,
  Flag,
  Radio,
  UserPlus,
  UserMinus,
  Volume2,
} from "lucide-react";

import AppHeader from "@/components/app/AppHeader";
import {
  fetchPracticeSession,
  fetchPracticeRound,
  sendPracticeInteraction,
  evaluatePracticeRound,
  completePracticeSession,
  contributePracticeClip,
  startSessionAgent,
  stopSessionAgent,
  PracticeSession,
  PracticeRoundInfo,
  RoundResult,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

export default function PracticeRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [roundInfo, setRoundInfo] = useState<PracticeRoundInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [clipTitle, setClipTitle] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  // RTC / agent state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [agentBusy, setAgentBusy] = useState<number | null>(null);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);

  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoTrackRef = useRef<IRemoteVideoTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const videoElementRef = useRef<HTMLDivElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const leaveChannel = useCallback(async () => {
    try {
      await stopSessionAgent(sessionId);
    } catch {
      /* noop */
    }
    try {
      await localAudioTrackRef.current?.close();
      await localVideoTrackRef.current?.close();
      await remoteAudioTrackRef.current?.stop();
      remoteVideoTrackRef.current?.stop();
      await rtcClientRef.current?.leave();
    } catch {
      /* noop */
    }
    rtcClientRef.current = null;
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    remoteAudioTrackRef.current = null;
    remoteVideoTrackRef.current = null;
    setJoined(false);
  }, [sessionId]);

  useEffect(() => {
    return () => {
      leaveChannel();
    };
  }, [leaveChannel]);

  useEffect(() => {
    async function load() {
      const [s, r] = await Promise.all([
        fetchPracticeSession(sessionId),
        fetchPracticeRound(sessionId),
      ]);
      setSession(s);
      setRoundInfo(r);
      setLoading(false);
    }
    load();
  }, [sessionId]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.transcripts]);

  // ---------------------------------------------------------------- agora
  const handleRemoteUser = async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video" | "datachannel") => {
    if (mediaType === "datachannel") return;
    await rtcClientRef.current?.subscribe(user, mediaType);
    if (mediaType === "video" && user.videoTrack) {
      remoteVideoTrackRef.current = user.videoTrack;
      if (remoteVideoRef.current) user.videoTrack.play(remoteVideoRef.current);
    }
    if (mediaType === "audio" && user.audioTrack) {
      remoteAudioTrackRef.current = user.audioTrack;
      user.audioTrack.play();
    }
  };

  const joinVideo = async () => {
    if (!roundInfo) return;
    setConnecting(true);
    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      rtcClientRef.current = client;

      client.on("user-published", (user, mediaType) => handleRemoteUser(user, mediaType));
      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") remoteVideoTrackRef.current?.stop();
        if (mediaType === "audio") remoteAudioTrackRef.current?.stop();
      });
      client.on("user-joined", (user) => {
        // auto-subscribe to audio/video when agent joins
        if (user.hasAudio) handleRemoteUser(user, "audio");
        if (user.hasVideo) handleRemoteUser(user, "video");
      });
      client.on("audio-volume-indicator", (volumes: Array<{ level: number; uid: number }>) => {
        const active = volumes.some((v) => v.level > 5);
        setRemoteSpeaking(active);
      });

      await client.join(
        roundInfo.agora.appId || AGORA_APP_ID,
        roundInfo.agora.channelName,
        roundInfo.agora.token || null,
        Math.floor(1000 + Math.random() * 9000)
      );
      setJoined(true);

      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      localVideoTrackRef.current = videoTrack;
      if (videoElementRef.current) videoTrack.play(videoElementRef.current);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = audioTrack;

      await client.publish([videoTrack, audioTrack]);
    } catch (err) {
      console.warn("Could not join Agora (permissions likely blocked). Text mode still works.", err);
    } finally {
      setConnecting(false);
    }
  };

  const toggleMic = async () => {
    if (!localAudioTrackRef.current) return;
    await localAudioTrackRef.current.setEnabled(!isMicOn);
    setIsMicOn(!isMicOn);
  };
  const toggleCamera = async () => {
    if (!localVideoTrackRef.current) return;
    await localVideoTrackRef.current.setEnabled(!isCameraOn);
    setIsCameraOn(!isCameraOn);
  };

  const startAgentFor = async (speakerIndex: number) => {
    setAgentBusy(speakerIndex);
    try {
      await startSessionAgent(sessionId, speakerIndex);
      setRoundInfo((prev) =>
        prev
          ? {
              ...prev,
              speakers: prev.speakers.map((s, i) => (i === speakerIndex ? { ...s, started: true } : s)),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAgentBusy(null);
    }
  };

  const stopAllAgents = async () => {
    setAgentBusy(-1);
    await stopSessionAgent(sessionId);
    setRoundInfo((prev) =>
      prev
        ? { ...prev, speakers: prev.speakers.map((s) => ({ ...s, started: false })) }
        : prev
    );
    setAgentBusy(null);
  };

  // ---------------------------------------------------------------- transcript flow
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !session) return;
    setSubmitting(true);
    try {
      const res = await sendPracticeInteraction(session.id, text);
      setSession((prev) =>
        prev ? { ...prev, transcripts: res.transcripts, currentRoundIndex: res.currentRoundIndex } : prev
      );
      setInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluateRound = async () => {
    if (!session) return;
    setEvaluating(true);
    try {
      const res = await evaluatePracticeRound(session.id);
      setRoundResult(res.result);
      setResultOpen(true);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: res.sessionStatus as PracticeSession["status"],
              currentRoundIndex: res.currentRoundIndex,
              roundResults: res.roundResults,
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleContinue = async () => {
    setResultOpen(false);
    await leaveChannel();
    const r = await fetchPracticeRound(sessionId);
    setRoundInfo(r);
  };

  const handleComplete = async () => {
    if (!session) return;
    const { evaluation, session: updated } = await completePracticeSession(session.id);
    setSession((prev) => (prev ? { ...prev, ...updated, evaluation } : updated));
    setResultOpen(false);
    setShareOpen(true);
  };

  const handleShare = async () => {
    if (!session) return;
    setSharing(true);
    try {
      await contributePracticeClip(session.id, clipTitle || undefined);
      setShared(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-neutral-500" />
      </div>
    );
  }
  if (!session || !roundInfo) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-xs text-neutral-500">Practice session not found.</p>
      </div>
    );
  }

  const activeSpeaker =
    roundInfo.speakers.find((s) => s.interviewerIndex === 0) || roundInfo.speakers[0];
  const isPassed = session.status === "PASSED";
  const isFailed = session.status === "FAILED";
  const isFinishedFlow = isPassed || isFailed;
  const roundTurns = session.transcripts.filter((t) => t.roundIndex === session.currentRoundIndex);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-white">
                {session.company} · {session.role}
              </h1>
              <Badge
                variant="outline"
                className={
                  isPassed
                    ? "border-emerald-800 text-emerald-400 bg-emerald-950/40"
                    : isFailed
                      ? "border-rose-800 text-rose-400 bg-rose-950/40"
                      : "border-amber-800 text-amber-400 bg-amber-950/40"
                }
              >
                {isPassed ? "Passed" : isFailed ? "Failed" : "In progress"}
              </Badge>
              {joined && (
                <Badge variant="outline" className="border-emerald-800 text-emerald-400 bg-emerald-950/40 gap-1">
                  <Radio className="size-3" /> RTC live
                </Badge>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Round {roundInfo.roundIndex + 1} of {session.blueprint.rounds.length} · {roundInfo.round.name} · {roundInfo.round.type}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {session.blueprint.rounds.map((r, idx) => (
              <span
                key={r.id}
                className={`flex size-6 items-center justify-center rounded-full border text-[10px] font-bold ${
                  idx < session.roundResults.length
                    ? session.roundResults[idx]?.passed
                      ? "border-emerald-800 bg-emerald-950 text-emerald-400"
                      : "border-rose-800 bg-rose-950 text-rose-400"
                    : idx === session.currentRoundIndex
                      ? "border-neutral-600 bg-neutral-800 text-white"
                      : "border-neutral-800 bg-neutral-900 text-neutral-500"
                }`}
              >
                {idx + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Stage */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-neutral-800 bg-gradient-to-br from-neutral-800 to-neutral-950">
              {/* Remote (agent) video — plays here when an agent publishes video */}
              <div ref={remoteVideoRef} className="absolute inset-0" />

              {/* AI speaker tile shown when there's no remote video yet */}
              {!remoteVideoTrackRef.current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="size-28 overflow-hidden rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl">
                    {activeSpeaker?.avatarUrl ? (
                      <img src={activeSpeaker.avatarUrl} alt={activeSpeaker.name} className="size-28 object-cover" />
                    ) : (
                      <div className="flex size-28 items-center justify-center">
                        <Bot className="size-12 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{activeSpeaker?.name}</p>
                    <p className="text-[11px] text-neutral-400">{activeSpeaker?.role}</p>
                  </div>
                  {remoteSpeaking && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/50 px-3 py-1 text-[10px] text-emerald-300">
                      <Volume2 className="size-3 animate-pulse" /> Agent speaking
                    </span>
                  )}
                </div>
              )}

              {joined && (
                <div className="absolute bottom-3 right-3 w-40 aspect-[3/4] overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900">
                  <div ref={videoElementRef} className="h-full w-full" />
                </div>
              )}

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur border border-white/10">
                  {activeSpeaker?.name} · {activeSpeaker?.role}
                </span>
              </div>
            </div>

            {/* Speaker panel + agent controls */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-white flex items-center gap-2">
                  <Bot className="size-4 text-neutral-400" />
                  Interviewer agents in this round
                </p>
                <div className="flex items-center gap-2">
                  {joined && (
                    <Button size="sm" variant="outline" className="border-neutral-800 text-neutral-300 hover:bg-neutral-800" disabled={agentBusy === -1} onClick={stopAllAgents}>
                      {agentBusy === -1 ? <Loader2 className="size-3.5 animate-spin" /> : <UserMinus className="size-3.5" />}
                      Stop
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {roundInfo.speakers.map((speaker) => (
                  <div
                    key={speaker.interviewerIndex}
                    className="flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2"
                  >
                    <div className="size-8 overflow-hidden rounded-full bg-neutral-800">
                      {speaker.avatarUrl ? (
                        <img src={speaker.avatarUrl} alt={speaker.name} className="size-8 object-cover" />
                      ) : (
                        <div className="flex size-8 items-center justify-center">
                          <Bot className="size-4 text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">{speaker.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate max-w-40">{speaker.role}</p>
                    </div>
                    {joined ? (
                      speaker.started ? (
                        <Badge className="gap-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                          <Radio className="size-3" /> Live
                        </Badge>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 text-indigo-400 hover:text-white hover:bg-neutral-800" onClick={() => startAgentFor(speaker.interviewerIndex)} disabled={agentBusy !== null}>
                          {agentBusy === speaker.interviewerIndex ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
                          Start
                        </Button>
                      )
                    ) : (
                      <span className="text-[10px] text-neutral-600">Join RTC to enable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Transcript */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60">
              <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-white">
                  <MessageSquare className="size-3.5 text-neutral-400" />
                  Live transcript
                </span>
                <span className="text-[11px] text-neutral-500">
                  {roundTurns.length} turn{roundTurns.length === 1 ? "" : "s"} this round
                </span>
              </div>
              <div className="max-h-64 space-y-3 overflow-y-auto p-4">
                {session.transcripts.map((turn, idx) => (
                  <div key={idx} className={`flex ${turn.sender === "candidate" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        turn.sender === "candidate" ? "bg-indigo-600 text-white" : "bg-neutral-800 text-neutral-200"
                      }`}
                    >
                      {turn.sender === "interviewer" && (
                        <p className="mb-0.5 text-[11px] font-semibold text-neutral-400">{turn.interviewerName || "AI Interviewer"}</p>
                      )}
                      {turn.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-500">Current round</p>
                <h3 className="mt-1 text-sm font-bold text-white">{roundInfo.round.name}</h3>
                <p className="text-xs text-neutral-400">{roundInfo.round.type} · {roundInfo.speakers.length} interviewer(s)</p>
              </div>
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">Focus areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {roundInfo.round.focusAreas.map((f) => (
                    <Badge key={f} variant="outline" className="border-neutral-700 text-neutral-300">{f}</Badge>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-neutral-800">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">Progress</p>
                <div className="flex items-center gap-1.5 text-xs">
                  {session.blueprint.rounds.map((r, idx) => (
                    <span key={r.id} className="flex items-center gap-1 text-neutral-500">
                      {idx === session.currentRoundIndex ? (
                        <span className="font-semibold text-white">{idx + 1}</span>
                      ) : session.roundResults[idx]?.passed ? (
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-neutral-600">{idx + 1}</span>
                      )}
                      {idx < session.blueprint.rounds.length - 1 && <ChevronRight className="size-3" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Join + answer */}
            {!isFinishedFlow && (
              <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                {!joined ? (
                  <Button className="w-full" onClick={joinVideo} disabled={connecting}>
                    {connecting ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
                    Join live room (camera & mic)
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Button size="icon" variant="outline" className="rounded-full border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800" onClick={toggleMic}>
                      {isMicOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-full border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800" onClick={toggleCamera}>
                      {isCameraOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
                    </Button>
                    <Button size="icon" className="rounded-full bg-rose-600 hover:bg-rose-700" onClick={leaveChannel} title="Leave">
                      <PhoneOff className="size-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type an answer (also drives evaluation)"
                    className="border-neutral-800 bg-neutral-950 text-white placeholder:text-neutral-600"
                  />
                  <Button size="icon" onClick={handleSend} disabled={submitting || !input.trim()}>
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </div>

                <Button onClick={handleEvaluateRound} disabled={evaluating || roundTurns.length < 2} variant="secondary" className="w-full">
                  {evaluating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Evaluating round...
                    </>
                  ) : (
                    <>
                      <Flag className="size-4" /> Finish Round & Get Verdict
                    </>
                  )}
                </Button>
                {roundTurns.length < 2 && (
                  <p className="text-center text-[10px] text-neutral-500">Answer at least twice before requesting a verdict.</p>
                )}
              </div>
            )}

            {isFinishedFlow && (
              <div className={`space-y-3 rounded-2xl border p-6 text-center ${isPassed ? "border-emerald-800 bg-emerald-950/30" : "border-rose-800 bg-rose-950/30"}`}>
                {isPassed ? <Trophy className="mx-auto size-10 text-emerald-400" /> : <XCircle className="mx-auto size-10 text-rose-400" />}
                <h3 className="text-base font-bold text-white">{isPassed ? "Interview passed!" : "Interview ended"}</h3>
                <p className="text-xs leading-relaxed text-neutral-400">
                  {isPassed
                    ? "You cleared every round. Review your full scorecard below."
                    : "You didn't pass the last round. Review feedback and try again."}
                </p>
                {isPassed ? (
                  <Button className="w-full" onClick={handleComplete}>
                    <Trophy className="size-4" /> Complete & View Report
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Round verdict dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {roundResult?.passed ? <CheckCircle2 className="size-5 text-emerald-400" /> : <XCircle className="size-5 text-rose-400" />}
              Round verdict · {roundResult?.score}%
            </DialogTitle>
            <DialogDescription>{roundResult?.keyObservation}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-between">
            {roundResult?.passed ? (
              session && session.status === "PASSED" ? (
                <Button className="w-full" onClick={handleComplete}>
                  <Trophy className="size-4" /> Finish — View Full Report
                </Button>
              ) : (
                <Button className="w-full" onClick={handleContinue}>
                  Continue to Next Round
                </Button>
              )
            ) : (
              <Button className="w-full" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final report + share */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-lg">
          {session.evaluation ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="size-5 text-amber-400" /> Final scorecard · {session.overallScore}%
                </DialogTitle>
                <DialogDescription>{session.evaluation.summary}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(session.evaluation.metrics).map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                    <p className="text-[10px] capitalize text-neutral-500">
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </p>
                    <p className="text-lg font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              {session.evaluation.strengths && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-400">Strengths</p>
                  {session.evaluation.strengths.map((s) => (
                    <p key={s} className="flex gap-2 text-xs text-neutral-300">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> {s}
                    </p>
                  ))}
                </div>
              )}

              {shared ? (
                <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-center">
                  <CheckCircle2 className="mx-auto mb-1 size-6 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Shared to the feed!</p>
                  <p className="mt-1 text-xs text-neutral-400">Your interview experience is now live for the community.</p>
                  <Button className="mt-3 w-full" onClick={() => router.push("/feed")}>View Feed</Button>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="flex items-start gap-2">
                    <Share2 className="mt-0.5 size-4 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Contribute to the community feed?</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        We'll turn the key moments from your passed interview into a practice loop others can learn from. Optional.
                      </p>
                    </div>
                  </div>
                  <Input value={clipTitle} onChange={(e) => setClipTitle(e.target.value)} placeholder="Optional: title for your post" className="border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-600" />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => router.push("/dashboard")}>No, thanks</Button>
                    <Button className="flex-1" onClick={handleShare} disabled={sharing}>
                      {sharing ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />} Share to Feed
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-neutral-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
