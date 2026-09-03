"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import AppHeader from "@/components/app/AppHeader";
import {
  fetchInterviewSession,
  sendInterviewInteraction,
  evaluateInterview,
  InterviewSession,
  ConversationTurn,
} from "@/lib/api";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Bot,
  MessageSquare,
  Loader2,
  Send,
  Radio,
} from "lucide-react";

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
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

        const appId = session?.agoraAppId || process.env.NEXT_PUBLIC_AGORA_APP_ID || "8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d";
        const channel = session?.agoraChannelName || `room-${sessionId}`;
        const token = session?.agoraToken || null;

        await client.join(appId, channel, token, Math.floor(Math.random() * 10000));
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
          console.warn("Local camera/mic permission not granted, using preview fallback", mediaErr);
        }
      } catch (err) {
        console.warn("Agora RTC simulated fallback:", err);
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
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center space-y-3 text-xs text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        <p>Connecting to Agora Video Interview Room...</p>
      </div>
    );
  }

  const currentRound = session.blueprint.rounds[session.currentRoundIndex] || session.blueprint.rounds[0];
  const activePersonas = currentRound?.interviewers || [];
  const latestAiTurn = [...session.transcripts].reverse().find((t) => t.sender === "interviewer");

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col overflow-hidden selection:bg-neutral-800">
      <AppHeader />

      {/* Room Subheader */}
      <div className="h-12 px-4 md:px-6 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between z-20 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h1 className="font-semibold text-white">
            {session.company} • {session.role}
          </h1>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">
            Round {session.currentRoundIndex + 1}: {currentRound?.name}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>{agoraConnected ? "Agora Live" : "Connecting..."}</span>
          </div>

          <div className="px-2.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 font-bold">
            {formatTimer(timerSeconds)}
          </div>

          <button
            onClick={() => setShowTranscripts(!showTranscripts)}
            className={`p-1.5 rounded border text-[11px] flex items-center gap-1 transition-colors ${
              showTranscripts ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Transcript</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Interviewer Tiles */}
          <div className={`grid gap-4 flex-1 min-h-[300px] ${activePersonas.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
            {activePersonas.map((persona) => {
              const isSpeakingThisPersona = isAiSpeaking || (latestAiTurn?.interviewerName === persona.name && !submittingTurn);

              return (
                <div
                  key={persona.id}
                  className={`relative rounded-2xl bg-neutral-900/60 border overflow-hidden flex flex-col items-center justify-center p-6 text-center transition-all ${
                    isSpeakingThisPersona ? "border-neutral-500 shadow-xl" : "border-neutral-800"
                  }`}
                >
                  <div className="absolute top-3 left-3 text-[10px] font-medium text-neutral-300 bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded flex items-center gap-1.5">
                    <Bot className="w-3 h-3 text-neutral-400" />
                    <span>{persona.name} ({persona.role})</span>
                  </div>

                  <div className="relative my-3">
                    <div
                      className={`w-28 h-28 rounded-full border-2 overflow-hidden transition-all ${
                        isSpeakingThisPersona ? "border-neutral-400 scale-105" : "border-neutral-700"
                      }`}
                    >
                      <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <h3 className="font-bold text-white text-sm">{persona.name}</h3>
                  <p className="text-xs text-neutral-400 max-w-xs mt-0.5">{persona.personality}</p>
                </div>
              );
            })}
          </div>

          {/* Candidate Floating Video Tile */}
          <div className="relative h-40 md:h-48 w-full md:w-64 self-end rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl shrink-0">
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-neutral-950/80 text-[10px] font-semibold text-neutral-300">
              You (Candidate)
            </div>

            {isCameraOn ? (
              <div ref={videoElementRef} className="w-full h-full bg-neutral-950 flex items-center justify-center text-xs text-neutral-500">
                <span>Webcam Feed (Agora RTC)</span>
              </div>
            ) : (
              <div className="w-full h-full bg-neutral-950 flex flex-col items-center justify-center text-neutral-500 gap-1 text-xs">
                <VideoOff className="w-5 h-5 text-neutral-600" />
                <span>Camera Off</span>
              </div>
            )}
          </div>

          {/* Active AI Dialogue Prompt Box */}
          {latestAiTurn && (
            <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{latestAiTurn.interviewerName}</span>
                <span className="text-[10px] text-neutral-500">Asking question</span>
              </div>
              <p className="text-neutral-200 text-sm">{latestAiTurn.text}</p>
            </div>
          )}
        </div>

        {/* Transcripts Drawer */}
        {showTranscripts && (
          <aside className="w-full md:w-80 bg-neutral-900/90 border-l border-neutral-800 flex flex-col h-full z-10 text-xs">
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between font-bold text-white">
              <span>Transcript</span>
              <button onClick={() => setShowTranscripts(false)} className="text-neutral-400 hover:text-white">
                Close
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {session.transcripts.map((turn, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg space-y-1 ${
                    turn.sender === "candidate" ? "bg-neutral-800/80 text-white ml-2" : "bg-neutral-950 text-neutral-300 mr-2 border border-neutral-800"
                  }`}
                >
                  <div className="font-semibold text-[11px] flex justify-between">
                    <span>{turn.sender === "candidate" ? "You" : turn.interviewerName}</span>
                    <span className="text-neutral-500 text-[10px]">Round {turn.roundIndex + 1}</span>
                  </div>
                  <p className="leading-relaxed">{turn.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </aside>
        )}
      </div>

      {/* Toolbar & Input */}
      <footer className="p-3 bg-neutral-900 border-t border-neutral-800 space-y-2 z-20 shrink-0 text-xs">
        <form onSubmit={handleSubmitTurn} className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={candidateInput}
            onChange={(e) => setCandidateInput(e.target.value)}
            placeholder="Type your response to the interviewer..."
            disabled={submittingTurn}
            className="flex-1 px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 text-xs font-medium"
          />
          <button
            type="submit"
            disabled={!candidateInput.trim() || submittingTurn}
            className="px-4 py-2 rounded-lg bg-neutral-100 text-neutral-950 hover:bg-white font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
          >
            {submittingTurn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-950" />
            ) : (
              <>
                <span>Submit</span>
                <Send className="w-3.5 h-3.5 text-neutral-950" />
              </>
            )}
          </button>
        </form>

        <div className="max-w-4xl mx-auto flex items-center justify-between pt-1 border-t border-neutral-800/60">
          <div className="flex items-center gap-2">
            <button onClick={toggleMic} className={`p-2 rounded-lg transition-colors ${isMicOn ? "bg-neutral-800 text-white" : "bg-rose-950 text-rose-300 border border-rose-800"}`}>
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button onClick={toggleCamera} className={`p-2 rounded-lg transition-colors ${isCameraOn ? "bg-neutral-800 text-white" : "bg-rose-950 text-rose-300 border border-rose-800"}`}>
              {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsAudioMuted(!isAudioMuted)} className={`p-2 rounded-lg transition-colors ${!isAudioMuted ? "bg-neutral-800 text-white" : "bg-rose-950 text-rose-300 border border-rose-800"}`}>
              {!isAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleEndInterview}
            className="px-4 py-1.5 rounded-lg bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-200 font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave Interview</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
