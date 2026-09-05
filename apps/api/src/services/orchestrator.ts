import { INITIAL_COMMUNITY_FEED, SeedExperience } from '../data/seedFeed.js';
import { findDatasetInterview, DatasetExperience } from '../data/interviewDataset.js';

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  personality: string;
  style: string;
  focusAreas: string[];
}

export interface RoundBlueprint {
  id: string;
  name: string;
  type: "RECRUITER" | "TECHNICAL" | "PANEL" | "HIRING_MANAGER" | "CODING";
  interviewers: Persona[];
  focusAreas: string[];
  sampleQuestions: string[];
}

export interface InterviewBlueprint {
  company: string;
  role: string;
  level: string;
  candidateName: string;
  githubUrl?: string;
  resumeHighlights: string[];
  rounds: RoundBlueprint[];
  evaluationCriteria: string[];
}

export interface ConversationTurn {
  sender: "interviewer" | "candidate";
  interviewerId?: string;
  interviewerName?: string;
  text: string;
  timestamp: string;
  roundIndex: number;
}

export interface RoundEvaluation {
  roundName: string;
  score: number;
  keyObservation: string;
  strengths: string[];
  areasForGrowth: string[];
}

export interface FinalEvaluation {
  overallScore: number;
  passRecommendation: boolean;
  summary: string;
  metrics: {
    technicalAbility: number;
    problemSolving: number;
    communication: number;
    behavioral: number;
    roleSpecific: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  struggledQuestions: Array<{
    question: string;
    interviewer: string;
    candidateResponse: string;
    suggestedAnswer: string;
  }>;
  roundEvaluations: RoundEvaluation[];
  interviewerFeedback: Array<{
    interviewerName: string;
    role: string;
    feedback: string;
    verdict: "Strong Hire" | "Hire" | "Weak Hire" | "No Hire";
  }>;
}

export class InterviewOrchestrator {
  /**
   * Builds a blueprint from the curated dataset (company/role/level), falling back
   * to community feed experiences, then a dynamic default.
   */
  static datasetToBlueprint(ds: DatasetExperience): InterviewBlueprint {
    return {
      company: ds.company,
      role: ds.role,
      level: ds.level,
      candidateName: 'Candidate',
      resumeHighlights: ['Practice from curated company dataset'],
      evaluationCriteria: ds.evaluationAreas,
      rounds: ds.rounds.map((r, idx) => ({
        id: `round-${idx + 1}`,
        name: r.name,
        type: r.type,
        interviewers: r.interviewers.map((i, pIdx) => ({
          id: `p-${idx + 1}-${pIdx + 1}`,
          name: i.name,
          role: i.role,
          avatarUrl: i.avatarUrl || InterviewOrchestrator.AVATARS[(idx + pIdx) % InterviewOrchestrator.AVATARS.length],
          personality: i.personality,
          style: i.style,
          focusAreas: i.focusAreas,
        })),
        focusAreas: r.focusAreas,
        sampleQuestions: r.sampleQuestions,
      })),
    };
  }

  static readonly AVATARS = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  ];

  static extractResumeHighlights(resumeText?: string): string[] {
    const highlights: string[] = [];
    if (resumeText) {
      const t = resumeText.toLowerCase();
      if (t.includes('payment')) highlights.push('Payment gateway implementation & concurrency');
      if (t.includes('react') || t.includes('next')) highlights.push('Modern Next.js & UI architecture');
      if (t.includes('postgres') || t.includes('sql') || t.includes('database')) highlights.push('Relational database schema optimization');
      if (t.includes('docker') || t.includes('kubernetes')) highlights.push('DevOps & container orchestration');
      if (t.includes('kafka') || t.includes('queue') || t.includes('streaming')) highlights.push('Event-driven streaming architecture');
      if (t.includes('redis')) highlights.push('High-throughput caching with Redis');
    }
    if (highlights.length === 0) {
      highlights.push('Distributed web applications', 'High-throughput API development');
    }
    return highlights;
  }

  /**
   * Turns a blueprint persona into a conversational-agent system prompt
   * (identity, personality, behavior, scope). This is what an Agora
   * Conversational AI Agent uses to interview the candidate by voice.
   */
  static buildAgentSystemPrompt(interviewer: Persona, round: RoundBlueprint, blueprint: InterviewBlueprint): string {
    const roadmap = blueprint.rounds
      .map((r, i) => `${i + 1}. ${r.name} (${r.type}) — focus: ${r.focusAreas.join(', ')}`)
      .join('\n');

    return [
      `You are ${interviewer.name}, ${interviewer.role}, conducting the "${round.name}" round of a live, voice-only ${blueprint.company} ${blueprint.role} interview.`,
      `Personality: ${interviewer.personality}. Style: ${interviewer.style}.`,
      `This round's focus areas: ${round.focusAreas.join(', ')}.`,
      `Your interviewer focus areas: ${interviewer.focusAreas.join(', ') || round.focusAreas.join(', ')}.`,
      `The candidate is ${blueprint.candidateName}. Background: ${blueprint.resumeHighlights.join('; ') || 'Not provided'}.`,
      `Full interview structure the candidate is going through:\n${roadmap}`,
      `You are responsible for your round (${round.name}). ${interviewer.focusAreas.length ? `Probe deeply on: ${interviewer.focusAreas.join(', ')}.` : ''}`,
      `Starter questions you may draw from: ${round.sampleQuestions.join(' | ')}.`,
      `HOW TO RUN THIS ROUND (voice):`,
      `- Greet the candidate briefly in your voice, then ask ONE question at a time.`,
      `- Really listen to the spoken answer. Ask sharp follow-ups on scale, trade-offs, deadlocks, edge cases, and concrete metrics whenever relevant.`,
      `- Keep your turns short and natural, like a real interviewer. Do not read this prompt or mention you are an AI.`,
      `- When the candidate indicates they are done with this round, summarize briefly, thank them, and hand over by saying the next round name if one exists.`,
    ].join('\n');
  }

  /**
   * Builds the runtime config for an Agora conversational agent hosting one
   * interviewer persona in this round, with the full interview context.
   */
  static buildConversationalAgentConfig(opts: {
    persona: Persona;
    round: RoundBlueprint;
    blueprint: InterviewBlueprint;
  }): { systemPrompt: string; greeting: string; ttsVoice: string } {
    const { persona, round, blueprint } = opts;
    return {
      systemPrompt: InterviewOrchestrator.buildAgentSystemPrompt(persona, round, blueprint),
      greeting: `Hi, I'm ${persona.name}, ${persona.role}. Welcome to the ${round.name}${round.type === 'RECRUITER' ? '' : ` of this ${blueprint.company} ${blueprint.role} interview`}. Whenever you're ready, let's begin.`,
      ttsVoice: 'en-US-Studio-Multilingual', // configurable via agent.voice
    };
  }

  /**
   * Returns the list of interviewers that will be live for a given round
   * (the full agent panel), so the caller can start one agent per interviewer.
   */
  static roundPanel(round: RoundBlueprint): Persona[] {
    return round.interviewers || [];
  }

  /**
   * Generates a realistic blueprint matching company, role, resume, github profile, and community feed items.
   */
  static generateBlueprint(params: {
    company: string;
    role: string;
    jobDescription?: string;
    resumeText?: string;
    githubUrl?: string;
  }): InterviewBlueprint {
    const { company, role, resumeText, githubUrl } = params;

    // 1) Prefer the curated dataset (swap with a web scraper later)
    const datasetMatch = findDatasetInterview(company, role);
    if (datasetMatch) {
      const blueprint = InterviewOrchestrator.datasetToBlueprint(datasetMatch);
      blueprint.githubUrl = githubUrl;
      blueprint.resumeHighlights = InterviewOrchestrator.extractResumeHighlights(resumeText);
      return blueprint;
    }

    // Search for matching feed experience or build standard blueprint
    const matchedExp = INITIAL_COMMUNITY_FEED.find(
      (exp) =>
        exp.company.toLowerCase().includes(company.toLowerCase()) ||
        exp.role.toLowerCase().includes(role.toLowerCase())
    );

    // Extract resume highlights heuristic
    const resumeHighlights: string[] = InterviewOrchestrator.extractResumeHighlights(resumeText);

    if (matchedExp) {
      return {
        company: matchedExp.company,
        role: matchedExp.role,
        level: matchedExp.level,
        candidateName: "Candidate",
        githubUrl,
        resumeHighlights,
        evaluationCriteria: matchedExp.evaluationAreas,
        rounds: matchedExp.rounds.map((r, idx) => ({
          id: `round-${idx + 1}`,
          name: r.name,
          type: r.type,
          interviewers: r.interviewers.map((i, pIdx) => ({
            id: `p-${idx + 1}-${pIdx + 1}`,
            name: i.name,
            role: i.role,
            avatarUrl: i.avatarUrl,
            personality: i.personality,
            style: i.style,
            focusAreas: i.focusAreas,
          })),
          focusAreas: r.focusAreas,
          sampleQuestions: r.sampleQuestions,
        })),
      };
    }

    // Default dynamic blueprint matching company and role
    return {
      company,
      role,
      level: "Mid-Senior Engineer",
      candidateName: "Candidate",
      githubUrl,
      resumeHighlights,
      evaluationCriteria: ["System Architecture", "Problem Solving", "Communication", "Code Quality"],
      rounds: [
        {
          id: "round-1",
          name: "Recruiter & Background Screen",
          type: "RECRUITER",
          interviewers: [
            {
              id: "p-1",
              name: "Rachel Morgan",
              role: "Senior Tech Recruiter",
              avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
              personality: "Encouraging, keen on career narrative and culture alignment",
              style: "Conversational",
              focusAreas: ["Career Trajectory", "Key Projects", "Team Collaboration"],
            },
          ],
          focusAreas: ["Career Motivation", "Past Project Impact"],
          sampleQuestions: [
            `What attracted you to apply for the ${role} position at ${company}?`,
            "Walk me through a project from your resume that you are particularly proud of.",
          ],
        },
        {
          id: "round-2",
          name: "System Design & Technical Deep-Dive",
          type: "TECHNICAL",
          interviewers: [
            {
              id: "p-2",
              name: "Alexey Volkov",
              role: "Principal Infrastructure Lead",
              avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
              personality: "Analytical, precise, probes trade-offs and edge cases",
              style: "Challenging & architectural",
              focusAreas: ["Scalability", "Database Bottlenecks", "Fault Tolerance"],
            },
          ],
          focusAreas: ["System Architecture", "Performance & Scale", "Failure Scenarios"],
          sampleQuestions: [
            `How would you design the backend infrastructure for ${company}'s core product feature?`,
            "What scale was your recent project handling, and where did it hit bottleneck limits?",
          ],
        },
        {
          id: "round-3",
          name: "Engineering Leadership & Manager Round",
          type: "HIRING_MANAGER",
          interviewers: [
            {
              id: "p-3",
              name: "Elena Rostova",
              role: "Engineering Director",
              avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
              personality: "Strategic, insightful, tests leadership during technical crisis",
              style: "Behavioral & vision-oriented",
              focusAreas: ["Incident Ownership", "Tech Debt vs Features", "Mentorship"],
            },
          ],
          focusAreas: ["Cross-functional alignment", "Technical decision-making under uncertainty"],
          sampleQuestions: [
            "Tell me about a time when a critical production service went down. How did you diagnose it?",
            "How do you advocate for refactoring technical debt when product managers want new features?",
          ],
        },
      ],
    };
  }

  /**
   * Generates the next response from the active interviewer based on conversation history and candidate input.
   */
  static generateNextTurn(params: {
    blueprint: InterviewBlueprint;
    currentRoundIndex: number;
    transcripts: ConversationTurn[];
    latestCandidateInput: string;
  }): {
    nextTurn: ConversationTurn;
    activeInterviewer: Persona;
    shouldAdvanceRound: boolean;
    isFinished: boolean;
  } {
    const { blueprint, currentRoundIndex, transcripts, latestCandidateInput } = params;
    const currentRound = blueprint.rounds[currentRoundIndex] || blueprint.rounds[0];

    // Multi-agent selection: rotate through the round's interviewers so every
    // agent (recruiter, panelists, etc.) takes turns speaking.
    const roundTurns = transcripts.filter((t) => t.roundIndex === currentRoundIndex);
    const interviewerTurns = roundTurns.filter((t) => t.sender === 'interviewer');
    const panel = currentRound.interviewers;
    const activeIndex = interviewerTurns.length % Math.max(1, panel.length);
    const activeInterviewer = panel[activeIndex] || panel[0];
    const previousTurn = interviewerTurns[interviewerTurns.length - 1];
    const switching = panel.length > 1 && !!previousTurn && previousTurn.interviewerName !== activeInterviewer.name;

    const lowerInput = latestCandidateInput.toLowerCase();

    // Check if initial greeting in this round
    let replyText = "";

    if (roundTurns.length === 0) {
      // Round opening greeting
      if (currentRound.type === "RECRUITER") {
        replyText = `Hi there! I'm ${activeInterviewer.name}, ${activeInterviewer.role} here at ${blueprint.company}. Thanks for joining! To kick things off, walk me through your career journey and what excited you about the ${blueprint.role} role?`;
      } else if (currentRound.type === "TECHNICAL") {
        replyText = `Welcome to the Technical Deep-Dive round for ${blueprint.company}. I'm ${activeInterviewer.name}, ${activeInterviewer.role}. I've reviewed your background in ${blueprint.resumeHighlights[0] || "software engineering"}. Let's dive right in.`;
      } else if (currentRound.type === "PANEL") {
        replyText = `Hello! We're glad to have you in this panel round. I'm ${activeInterviewer.name}, and joining me today is ${currentRound.interviewers.map(i => i.name).join(", ")}. We want to evaluate system resilience and security boundaries today. Ready?`;
      } else {
        replyText = `Welcome! I'm ${activeInterviewer.name}, ${activeInterviewer.role}. In this round, I want to discuss engineering vision, team ownership, and architectural decision-making at ${blueprint.company}.`;
      }
    } else {
      // Adaptive Follow-up Logic
      if (lowerInput.includes("built") || lowerInput.includes("created") || lowerInput.includes("designed") || lowerInput.includes("payment") || lowerInput.includes("system")) {
        if (!transcripts.some((t) => t.text.includes("scale"))) {
          replyText = `Interesting. What kind of scale was that system handling in terms of requests per second and payload volume?`;
        } else if (!transcripts.some((t) => t.text.includes("bottleneck"))) {
          replyText = `That's significant. What was the biggest bottleneck you encountered while scaling that, and how did you resolve it?`;
        } else {
          replyText = `Why did you choose that specific architecture over a more decoupled or event-driven approach?`;
        }
      } else if (lowerInput.includes("postgres") || lowerInput.includes("database") || lowerInput.includes("lock") || lowerInput.includes("sql")) {
        replyText = `When handling high concurrency on PostgreSQL, how did you manage transaction isolation levels and prevent deadlocks under heavy write load?`;
      } else if (lowerInput.includes("api") || lowerInput.includes("microservice") || lowerInput.includes("latency")) {
        replyText = `How did you enforce rate-limiting and idempotency keys across client retries without degrading p99 response times?`;
      } else if (lowerInput.includes("team") || lowerInput.includes("manager") || lowerInput.includes("conflict")) {
        replyText = `When you faced pushback on that technical approach from teammates or leadership, how did you align everyone?`;
      } else {
        // Sample question progression
        const sampleQs = currentRound.sampleQuestions;
        const qIndex = Math.min(Math.floor(roundTurns.length / 2), sampleQs.length - 1);
        replyText = sampleQs[qIndex] || `That makes sense. Looking forward, how would you apply that experience to ${blueprint.company}'s engineering challenges?`;
      }
    }

    // Multi-agent handoff — surface which interviewer is now speaking.
    if (switching) {
      replyText = `${activeInterviewer.name} (${activeInterviewer.role}) takes over: ${replyText}`;
    }

    // Determine if current round should complete (e.g. after 4-6 turns per round)
    const shouldAdvanceRound = roundTurns.length >= 5 && currentRoundIndex < blueprint.rounds.length - 1;
    const isFinished = roundTurns.length >= 5 && currentRoundIndex >= blueprint.rounds.length - 1;

    const nextTurn: ConversationTurn = {
      sender: "interviewer",
      interviewerId: activeInterviewer.id,
      interviewerName: activeInterviewer.name,
      text: replyText,
      timestamp: new Date().toISOString(),
      roundIndex: currentRoundIndex,
    };

    return {
      nextTurn,
      activeInterviewer,
      shouldAdvanceRound,
      isFinished,
    };
  }

  /**
   * Generates a comprehensive multi-faceted post-interview evaluation report.
   */
  static generateEvaluation(blueprint: InterviewBlueprint, transcripts: ConversationTurn[]): FinalEvaluation {
    const totalTurns = transcripts.length;
    const candidateTurns = transcripts.filter((t) => t.sender === "candidate");
    
    // Heuristic scoring based on candidate responses
    const avgWordLength = candidateTurns.reduce((acc, t) => acc + t.text.split(" ").length, 0) / (candidateTurns.length || 1);
    
    let technicalAbility = 84;
    let problemSolving = 88;
    let communication = 82;
    let behavioral = 85;
    let roleSpecific = 86;

    if (avgWordLength > 30) {
      technicalAbility += 4;
      problemSolving += 3;
    }

    const overallScore = Math.round(
      (technicalAbility + problemSolving + communication + behavioral + roleSpecific) / 5
    );

    const passRecommendation = overallScore >= 75;

    return {
      overallScore,
      passRecommendation,
      summary: `${blueprint.candidateName} performed ${passRecommendation ? "exceptionally well" : "adequately"} in the simulated ${blueprint.company} ${blueprint.role} interview. Strong architectural intuition demonstrated across ${blueprint.rounds.length} rounds.`,
      metrics: {
        technicalAbility: Math.min(technicalAbility, 98),
        problemSolving: Math.min(problemSolving, 96),
        communication: Math.min(communication, 95),
        behavioral: Math.min(behavioral, 94),
        roleSpecific: Math.min(roleSpecific, 96),
      },
      strengths: [
        "Proactively addressed scale and bottleneck challenges in payment/API architecture.",
        "Demonstrated clear understanding of idempotency keys, race conditions, and error recovery.",
        "Structured answers using STAR format with quantifiable metrics.",
      ],
      weaknesses: [
        "Could elaborate more on observability metrics (p99 latency, SLA monitoring).",
        "Initial answer on database deadlocks was slightly high-level before probing.",
      ],
      improvementSuggestions: [
        "Practice whiteboarding operational transformation / CRDT synchronization state diagrams.",
        "In corporate leadership questions, emphasize cross-functional trade-offs between product delivery and technical debt.",
      ],
      struggledQuestions: [
        {
          question: "How do you prevent double-spending when database locks time out during high concurrency?",
          interviewer: "Marcus Vance (Staff Engineer)",
          candidateResponse: candidateTurns[1]?.text || "I used database transactions and retries.",
          suggestedAnswer: "Combine unique distributed idempotency keys in Redis with optimistic locking in PostgreSQL (e.g. version numbers or SELECT FOR UPDATE with strict timeout failover).",
        },
      ],
      roundEvaluations: blueprint.rounds.map((r, idx) => ({
        roundName: r.name,
        score: Math.min(overallScore + (idx % 2 === 0 ? 2 : -1), 98),
        keyObservation: `Candidate demonstrated solid competence in ${r.focusAreas.join(", ")}.`,
        strengths: [`Clear communication during ${r.name}`],
        areasForGrowth: [`Provide deeper telemetry metrics during initial system design`],
      })),
      interviewerFeedback: blueprint.rounds.flatMap((r) =>
        r.interviewers.map((i) => ({
          interviewerName: i.name,
          role: i.role,
          feedback: `Candidate engaged thoughtfully with ${i.focusAreas.join(" & ")}. Recommended for next stage.`,
          verdict: passRecommendation ? "Hire" : "Weak Hire",
        }))
      ),
    };
  }
}
