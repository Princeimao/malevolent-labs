"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import {
  fetchInterviewSession,
  sendInterviewInteraction,
  evaluateInterview,
  InterviewSession,
} from "@/lib/api";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Bot,
  MessageSquare,
  Loader2,
  Send,
  Radio,
  Volume2,
} from "lucide-react";

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [agoraConnected, setAgoraConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [candidateInput, setCandidateInput] = useState("");
  const [submittingTurn, setSubmittingTurn] = useState(false);
  const [showTranscripts, setShowTranscripts] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Agora RTC Refs
  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoElementRef = useRef<HTMLDivElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Load session
  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;
      try {
        const data = await fetchInterviewSession(sessionId);
        if (data) {
          setSession(data);
        }
      } catch (err) {
        console.error("Failed to load interview session:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sessionId]);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.transcripts]);

  // Agora RTC initialization
  useEffect(() => {
    if (!session) return;

    let client: IAgoraRTCClient;

    async function initAgora() {
      try {
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        rtcClientRef.current = client;

        const appId =
          session?.agoraAppId || process.env.NEXT_PUBLIC_AGORA_APP_ID!;
        const channel = session?.agoraChannelName || `room-${sessionId}`;
        const token = session?.agoraToken || null;

        await client.join(
          appId,
          channel,
          token,
          Math.floor(Math.random() * 10000),
        );
        setAgoraConnected(true);

        try {
          const videoTrack = await AgoraRTC.createCameraVideoTrack();
          localVideoTrackRef.current = videoTrack;
          if (videoElementRef.current) {
            videoTrack.play(videoElementRef.current);
          }

          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          localAudioTrackRef.current = audioTrack;

          await client.publish([videoTrack, audioTrack]);
        } catch (mediaErr) {
          console.warn("Local camera/mic fallback", mediaErr);
        }
      } catch (err) {
        console.warn("Agora RTC fallback:", err);
        setAgoraConnected(true);
      }
    }

    initAgora();

    return () => {
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      }
      if (rtcClientRef.current) {
        rtcClientRef.current.leave();
      }
    };
  }, [session, sessionId]);

  const toggleMic = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(!isMicOn);
    }
    setIsMicOn(!isMicOn);
  };

  const toggleCamera = async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(!isCameraOn);
    }
    setIsCameraOn(!isCameraOn);
  };

  const handleSubmitTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!candidateInput.trim() || submittingTurn || !session) return;

    const currentInput = candidateInput.trim();
    setCandidateInput("");
    setSubmittingTurn(true);

    try {
      const res = await sendInterviewInteraction(sessionId, currentInput);

      setIsAiSpeaking(true);
      setTimeout(() => {
        setIsAiSpeaking(false);
      }, 3500);

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentRoundIndex: res.currentRoundIndex,
          transcripts: res.transcripts,
          status: res.isFinished ? "COMPLETED" : prev.status,
        };
      });

      if (res.isFinished) {
        await handleEndInterview();
      }
    } catch (err) {
      console.error("Turn error:", err);
    } finally {
      setSubmittingTurn(false);
    }
  };

  const handleEndInterview = async () => {
    try {
      await evaluateInterview(sessionId);
      router.push(`/interview/${sessionId}/report`);
    } catch (err) {
      console.error("Error evaluating interview:", err);
      router.push(`/interview/${sessionId}/report`);
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-[#202124] text-white flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <Bot className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm font-medium text-neutral-300 tracking-wide">
          Connecting to Google Meet Interview Room...
        </p>
      </div>
    );
  }

  const currentRound =
    session.blueprint.rounds[session.currentRoundIndex] ||
    session.blueprint.rounds[0];
  const activePersonas = currentRound?.interviewers || [];
  const latestAiTurn = [...session.transcripts]
    .reverse()
    .find((t) => t.sender === "interviewer");

  return (
    <div className="min-h-screen bg-[#202124] text-white font-sans flex flex-col justify-between overflow-hidden select-none">
      {/* Google Meet Header Bar */}
      <header className="h-14 px-4 md:px-6 bg-[#202124] border-b border-[#3c4043]/50 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#3c4043]/60 border border-white/10 text-xs text-neutral-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white truncate max-w-[220px] md:max-w-md">
              {session.company} • {session.role}
            </span>
          </div>

          <span className="hidden md:inline text-xs text-neutral-400 font-medium">
            Round {session.currentRoundIndex + 1}: {currentRound?.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#3c4043]/60 border border-white/10 text-xs font-mono text-neutral-200">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>{agoraConnected ? "Google Meet Live" : "Connecting..."}</span>
          </div>

          <div className="px-3 py-1 rounded-full bg-[#3c4043]/80 text-xs font-mono font-bold text-white tracking-widest border border-white/10">
            {formatTimer(timerSeconds)}
          </div>

          <button
            onClick={() => setShowTranscripts(!showTranscripts)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
              showTranscripts
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-[#3c4043] hover:bg-[#4a4e51] text-neutral-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Transcripts</span>
          </button>
        </div>
      </header>

      {/* Main Google Meet Call Canvas */}
      <main className="flex-1 flex relative overflow-hidden p-4 md:p-6 gap-4">
        <div className="flex-1 flex flex-col gap-4 relative overflow-hidden">
          {/* Interviewer Video Grid */}
          <div
            className={`grid gap-4 flex-1 items-center justify-center ${
              activePersonas.length > 1
                ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto w-full"
                : "grid-cols-1 max-w-3xl mx-auto w-full"
            }`}
          >
            {activePersonas.map((persona) => {
              const isSpeakingThisPersona =
                isAiSpeaking ||
                (latestAiTurn?.interviewerName === persona.name &&
                  !submittingTurn);

              return (
                <div
                  key={persona.id}
                  className={`relative rounded-3xl bg-[#3c4043]/30 border transition-all duration-300 flex flex-col items-center justify-center p-8 text-center min-h-[280px] md:min-h-[340px] shadow-2xl backdrop-blur-sm overflow-hidden ${
                    isSpeakingThisPersona
                      ? "border-emerald-400 ring-4 ring-emerald-500/20 shadow-emerald-500/10 scale-[1.01]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Name Tag Badge (Google Meet style) */}
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-lg bg-[#202124]/90 backdrop-blur border border-white/10 text-xs font-medium text-white flex items-center gap-2 shadow-md">
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                    <span>{persona.name}</span>
                    <span className="text-neutral-400">({persona.role})</span>
                  </div>

                  {/* Audio wave pulse indicator when speaking */}
                  {isSpeakingThisPersona && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-[11px] font-semibold">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Speaking</span>
                    </div>
                  )}

                  {/* Avatar Circle Container */}
                  <div className="relative my-4">
                    <div
                      className={`w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 transition-all duration-300 shadow-2xl ${
                        isSpeakingThisPersona
                          ? "border-emerald-400 scale-105"
                          : "border-white/20"
                      }`}
                    >
                      <img
                        src={persona.avatarUrl}
                        alt={persona.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <h2 className="font-bold text-white text-base md:text-lg tracking-tight">
                    {persona.name}
                  </h2>
                  <p className="text-xs text-neutral-400 max-w-xs mt-1 leading-relaxed">
                    {persona.personality}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Candidate Floating PIP Tile (Bottom Right of Canvas) */}
          <div className="absolute bottom-4 right-4 z-20 w-48 md:w-60 h-32 md:h-40 rounded-2xl bg-[#3c4043] border-2 border-white/20 overflow-hidden shadow-2xl transition-all">
            <div className="absolute top-2 left-2 z-10 px-2.5 py-0.5 rounded-md bg-[#202124]/80 text-[10px] font-semibold text-white border border-white/10">
              You (Candidate)
            </div>

            {isCameraOn ? (
              <div
                ref={videoElementRef}
                className="w-full h-full bg-[#1e1e1e] flex items-center justify-center text-xs text-neutral-400"
              />
            ) : (
              <div className="w-full h-full bg-[#1e1e1e] flex flex-col items-center justify-center text-neutral-400 gap-1.5 text-xs">
                <VideoOff className="w-6 h-6 text-neutral-500" />
                <span>Camera Turned Off</span>
              </div>
            )}
          </div>

          {/* Active Question Caption Card */}
          {latestAiTurn && (
            <div className="max-w-3xl mx-auto w-full p-4 rounded-2xl bg-[#202124]/95 border border-white/15 shadow-2xl flex gap-3.5 items-start z-10">
              <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                  <span>{latestAiTurn.interviewerName}</span>
                  <span className="text-[10px] text-neutral-500">
                    • Question
                  </span>
                </p>
                <p className="text-sm font-medium text-neutral-100 leading-relaxed">
                  {latestAiTurn.text}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Transcripts Drawer */}
        {showTranscripts && (
          <aside className="w-full md:w-80 bg-[#202124] border-l border-[#3c4043] flex flex-col h-full z-30 rounded-2xl shadow-2xl">
            <div className="p-4 border-b border-[#3c4043] flex items-center justify-between font-bold text-white text-sm">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Meeting Transcript
              </span>
              <button
                onClick={() => setShowTranscripts(false)}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-[#3c4043]/50"
              >
                Close
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {session.transcripts.map((turn, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl space-y-1 ${
                    turn.sender === "candidate"
                      ? "bg-blue-600/20 border border-blue-500/30 text-white ml-3"
                      : "bg-[#3c4043]/60 border border-white/10 text-neutral-200 mr-3"
                  }`}
                >
                  <div className="font-semibold text-[11px] flex justify-between">
                    <span
                      className={
                        turn.sender === "candidate"
                          ? "text-blue-300"
                          : "text-emerald-400"
                      }
                    >
                      {turn.sender === "candidate"
                        ? "You"
                        : turn.interviewerName}
                    </span>
                    <span className="text-neutral-400 text-[10px]">
                      Round {turn.roundIndex + 1}
                    </span>
                  </div>
                  <p className="leading-relaxed">{turn.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </aside>
        )}
      </main>

      {/* Google Meet Bottom Control Bar Area */}
      <footer className="p-4 bg-[#202124] border-t border-[#3c4043]/60 z-30 flex flex-col gap-3">
        {/* Response Form Bar */}
        <form
          onSubmit={handleSubmitTurn}
          className="max-w-3xl mx-auto w-full flex items-center gap-2"
        >
          <input
            type="text"
            value={candidateInput}
            onChange={(e) => setCandidateInput(e.target.value)}
            placeholder="Type your response to the interviewers..."
            disabled={submittingTurn}
            className="flex-1 px-4 py-2.5 rounded-full bg-[#3c4043]/70 border border-white/15 text-white placeholder-neutral-400 focus:outline-none focus:border-blue-400 text-xs font-medium shadow-inner"
          />
          <button
            type="submit"
            disabled={!candidateInput.trim() || submittingTurn}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-40 shadow-lg shrink-0"
          >
            {submittingTurn ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Floating Meet Control Pill Bar */}
        <div className="max-w-xl mx-auto w-full flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 mx-auto">
            {/* Mic Toggle Button */}
            <button
              onClick={toggleMic}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isMicOn
                  ? "bg-[#3c4043] hover:bg-[#4a4e51] text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isMicOn ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            {/* Camera Toggle Button */}
            <button
              onClick={toggleCamera}
              title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isCameraOn
                  ? "bg-[#3c4043] hover:bg-[#4a4e51] text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isCameraOn ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </button>

            {/* Transcript Toggle */}
            <button
              onClick={() => setShowTranscripts(!showTranscripts)}
              title="Toggle Captions / Transcripts"
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${
                showTranscripts
                  ? "bg-blue-600 text-white"
                  : "bg-[#3c4043] hover:bg-[#4a4e51] text-white"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Leave Call Button */}
            <button
              onClick={handleEndInterview}
              className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg ml-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Call</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
