const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function authHeaders(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("agora_interview_token");
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export async function loginApi(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Login failed" };
  }
}

export async function signupApi(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Signup failed" };
  }
}

export async function getMeApi(token: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Authentication error" };
  }
}

export interface FeedItem {
  id: string;
  company: string;
  role: string;
  level: string;
  summary: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  upvotes: number;
  authorName: string;
  evaluationAreas: string[];
  rounds: Array<{
    name: string;
    type: string;
    interviewers: Array<{
      name: string;
      role: string;
      avatarUrl: string;
      personality: string;
      style: string;
      focusAreas: string[];
    }>;
    focusAreas: string[];
    sampleQuestions: string[];
  }>;
  engagement?: FeedEngagement;
  storyHtml?: string;
  durationMinutes?: number;
  feel?: string;
  format?: string;
}

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
  roundEvaluations: Array<{
    roundName: string;
    score: number;
    keyObservation: string;
    strengths: string[];
    areasForGrowth: string[];
  }>;
  interviewerFeedback: Array<{
    interviewerName: string;
    role: string;
    feedback: string;
    verdict: string;
  }>;
}

export interface InterviewSession {
  id: string;
  candidateName: string;
  company: string;
  role: string;
  jobDescription?: string;
  resumeText?: string;
  githubUrl?: string;
  status: "CREATED" | "IN_PROGRESS" | "COMPLETED";
  currentRoundIndex: number;
  blueprint: InterviewBlueprint;
  transcripts: ConversationTurn[];
  agoraChannelName: string;
  agoraToken?: string;
  agoraAppId?: string;
  overallScore?: number;
  evaluations?: FinalEvaluation;
}

export async function fetchFeed(params?: {
  company?: string;
  role?: string;
  topic?: string;
  query?: string;
}): Promise<FeedItem[]> {
  try {
    const url = new URL(`${API_BASE_URL}/feed`);
    if (params?.company) url.searchParams.append("company", params.company);
    if (params?.role) url.searchParams.append("role", params.role);
    if (params?.topic) url.searchParams.append("topic", params.topic);
    if (params?.query) url.searchParams.append("query", params.query);

    const res = await fetch(url.toString(), { headers: authHeaders() });
    const data = await res.json();
    return data.feed || [];
  } catch (err) {
    console.error("Error fetching feed:", err);
    return [];
  }
}

export async function fetchExperienceById(
  id: string,
): Promise<FeedItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/feed/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.experience || null;
  } catch (err) {
    console.error("Error fetching experience:", err);
    return null;
  }
}

export interface FeedComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface FeedEngagement {
  up: number;
  down: number;
  net: number;
  commentCount: number;
}

export interface FeedItemDetail {
  experience: FeedItem & { engagement?: FeedEngagement };
  comments: FeedComment[];
}

export async function fetchFeedItemDetail(
  id: string,
): Promise<FeedItemDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/feed/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!data.experience) return null;
    return { experience: data.experience, comments: data.comments || [] };
  } catch (err) {
    console.error("Error fetching experience detail:", err);
    return null;
  }
}

export async function voteFeedItem(
  id: string,
  dir: 1 | -1,
): Promise<FeedEngagement | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/feed/${id}/vote`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ dir }),
    });
    const data = await res.json();
    return data.engagement || null;
  } catch (err) {
    console.error("Error voting:", err);
    return null;
  }
}

export async function addExperienceComment(
  id: string,
  text: string,
): Promise<FeedComment[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/feed/${id}/comments`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return data.comments || [];
  } catch (err) {
    console.error("Error commenting:", err);
    return [];
  }
}

export async function voteInterviewTemplate(
  id: string,
  dir: 1 | -1,
): Promise<{ votesUp: number; votesDown: number; netVotes: number } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/interview-templates/${id}/vote`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ dir }),
    });
    const data = await res.json();
    return data || null;
  } catch (err) {
    console.error("Error voting template:", err);
    return null;
  }
}

export async function parseContribution(rawContent: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/feed/parse`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ rawContent }),
  });
  const data = await res.json();
  return data.parsedData;
}

export async function publishContribution(
  experienceData: Partial<FeedItem> & {
    storyHtml?: string;
    durationMinutes?: number;
    feel?: string;
    format?: string;
  },
): Promise<FeedItem> {
  const res = await fetch(`${API_BASE_URL}/feed/publish`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(experienceData),
  });
  const data = await res.json();
  return data.experience;
}

export interface BankQuestion {
  id: string;
  text: string;
  source: "seed" | "experience" | "template";
  company?: string;
  role?: string;
  up: number;
  down: number;
}

export async function searchQuestions(params: {
  q?: string;
  company?: string;
}): Promise<BankQuestion[]> {
  try {
    const url = new URL(`${API_BASE_URL}/questions`);
    if (params.q) url.searchParams.append("q", params.q);
    if (params.company) url.searchParams.append("company", params.company);
    const res = await fetch(url.toString(), { headers: authHeaders() });
    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    console.error("Error searching questions:", err);
    return [];
  }
}

export async function voteQuestion(
  text: string,
  dir: 1 | -1,
): Promise<BankQuestion | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/questions/vote`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ text, dir }),
    });
    const data = await res.json();
    return data.question || null;
  } catch (err) {
    console.error("Error voting question:", err);
    return null;
  }
}

export async function createInterviewSession(payload: {
  company: string;
  role: string;
  jobDescription?: string;
  resumeText?: string;
  githubUrl?: string;
  candidateName?: string;
}): Promise<InterviewSession> {
  const res = await fetch(`${API_BASE_URL}/interviews/create`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.session;
}

export async function fetchInterviewSession(
  id: string,
): Promise<InterviewSession | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/interviews/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.session || null;
  } catch (err) {
    console.error("Error fetching session:", err);
    return null;
  }
}

export async function sendInterviewInteraction(
  id: string,
  candidateInput: string,
): Promise<{
  nextTurn: ConversationTurn;
  activeInterviewer: Persona;
  shouldAdvanceRound: boolean;
  isFinished: boolean;
  currentRoundIndex: number;
  transcripts: ConversationTurn[];
}> {
  const res = await fetch(`${API_BASE_URL}/interviews/${id}/interact`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ candidateInput }),
  });
  const data = await res.json();
  return data;
}

export async function evaluateInterview(
  id: string,
): Promise<{ evaluation: FinalEvaluation; session: InterviewSession }> {
  const res = await fetch(`${API_BASE_URL}/interviews/${id}/evaluate`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
  const data = await res.json();
  return data;
}

// ---------------------------------------------------------------------------
// Platform domain: Agents, Interview Templates, Goals, Practice Sessions
// ---------------------------------------------------------------------------

export interface Agent {
  id: string;
  ownerId: number;
  ownerName: string;
  name: string;
  role: string;
  avatarUrl: string;
  personality: string;
  systemPrompt: string;
  behavior: string;
  style: string;
  focusAreas: string[];
  voice: string;
  isCommunity: boolean;
  createdAt: string;
}

export interface TemplateRound {
  id: string;
  name: string;
  type: RoundBlueprint["type"];
  focusAreas: string[];
  sampleQuestions: string[];
  agentIds: string[];
}

export interface InterviewTemplate {
  id: string;
  ownerId: number;
  ownerName: string;
  title: string;
  company: string;
  role: string;
  level: string;
  description: string;
  mode: "personal" | "public";
  status: "draft" | "published";
  rounds: TemplateRound[];
  ratingCount: number;
  ratingTotal: number;
  ratingAvg: number;
  views: number;
  votesUp: number;
  votesDown: number;
  netVotes: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: number;
  title: string;
  company: string;
  role: string;
  level: string;
  plan: string;
  rounds: RoundBlueprint[];
  status: "active" | "completed";
  completedRounds: number;
  totalRounds: number;
  createdAt: string;
}

export interface RoundResult {
  roundIndex: number;
  roundName: string;
  score: number;
  passed: boolean;
  keyObservation: string;
}

export interface PracticeSession {
  id: string;
  userId: number;
  sourceType: "goal" | "template" | "generic";
  sourceId?: string;
  title: string;
  company: string;
  role: string;
  status: "IN_PROGRESS" | "PASSED" | "FAILED";
  currentRoundIndex: number;
  blueprint: InterviewBlueprint;
  transcripts: ConversationTurn[];
  roundResults: RoundResult[];
  overallScore?: number;
  passRecommendation?: boolean;
  evaluation?: FinalEvaluation;
  agoraChannelName: string;
  agoraToken: string;
  agoraAppId: string;
  createdAt: string;
}

export async function createAgent(payload: {
  name: string;
  role: string;
  avatarUrl?: string;
  personality?: string;
  systemPrompt?: string;
  behavior?: string;
  style?: string;
  focusAreas?: string[];
  voice?: string;
  isCommunity?: boolean;
}): Promise<Agent> {
  const res = await fetch(`${API_BASE_URL}/agents`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.agent;
}

export async function fetchAgents(mineOnly = false): Promise<Agent[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/agents${mineOnly ? "?mine=true" : ""}`,
      { headers: authHeaders() },
    );
    const data = await res.json();
    return data.agents || [];
  } catch (err) {
    console.error("Error fetching agents:", err);
    return [];
  }
}

export async function deleteAgent(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/agents/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.ok;
}

export async function createInterviewTemplate(payload: {
  title: string;
  company: string;
  role: string;
  level?: string;
  description?: string;
  mode: "personal" | "public";
  rounds: TemplateRound[];
}): Promise<InterviewTemplate> {
  const res = await fetch(`${API_BASE_URL}/interview-templates`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.template;
}

export async function fetchInterviewTemplates(
  scope: "public" | "mine" = "public",
): Promise<InterviewTemplate[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/interview-templates?scope=${scope}`,
      { headers: authHeaders() },
    );
    const data = await res.json();
    return data.templates || [];
  } catch (err) {
    console.error("Error fetching templates:", err);
    return [];
  }
}

export async function fetchInterviewTemplate(
  id: string,
): Promise<InterviewTemplate | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/interview-templates/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.template || null;
  } catch (err) {
    console.error("Error fetching template:", err);
    return null;
  }
}

export async function publishInterviewTemplate(
  id: string,
): Promise<InterviewTemplate | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/interview-templates/${id}/publish`,
      {
        method: "POST",
        headers: authHeaders(),
      },
    );
    const data = await res.json();
    return data.template || null;
  } catch (err) {
    console.error("Error publishing template:", err);
    return null;
  }
}

export async function rateInterviewTemplate(
  id: string,
  rating: number,
): Promise<{ ratingAvg: number; ratingCount: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/interview-templates/${id}/rate`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    const data = await res.json();
    return { ratingAvg: data.ratingAvg, ratingCount: data.ratingCount };
  } catch (err) {
    console.error("Error rating template:", err);
    return { ratingAvg: 0, ratingCount: 0 };
  }
}

export async function deleteInterviewTemplate(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/interview-templates/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.ok;
}

export async function createGoal(payload: {
  title?: string;
  company?: string;
  role: string;
  level?: string;
  notes?: string;
}): Promise<Goal> {
  const res = await fetch(`${API_BASE_URL}/goals`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.goal;
}

export async function fetchGoals(): Promise<Goal[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/goals`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.goals || [];
  } catch (err) {
    console.error("Error fetching goals:", err);
    return [];
  }
}

export async function deleteGoal(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/goals/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.ok;
}

export async function createPracticeSession(payload: {
  goalId?: string;
  templateId?: string;
  company?: string;
  role?: string;
  resumeText?: string;
  githubUrl?: string;
  candidateName?: string;
}): Promise<PracticeSession> {
  const res = await fetch(`${API_BASE_URL}/practice-sessions`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data?.success || !data?.session) {
    throw new Error(data?.error || 'Could not start a practice session');
  }
  return data.session;
}

export async function fetchPracticeSessions(): Promise<PracticeSession[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/practice-sessions`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.sessions || [];
  } catch (err) {
    console.error("Error fetching practice sessions:", err);
    return [];
  }
}

export async function fetchPracticeSession(
  id: string,
): Promise<PracticeSession | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/practice-sessions/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.session || null;
  } catch (err) {
    console.error("Error fetching practice session:", err);
    return null;
  }
}

export async function sendPracticeInteraction(
  id: string,
  candidateInput: string,
): Promise<{
  nextTurn: ConversationTurn;
  activeInterviewer: Persona;
  currentRoundIndex: number;
  transcripts: ConversationTurn[];
}> {
  const res = await fetch(`${API_BASE_URL}/practice-sessions/${id}/interact`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ candidateInput }),
  });
  const data = await res.json();
  return data;
}

export async function evaluatePracticeRound(id: string): Promise<{
  result: RoundResult;
  sessionStatus: string;
  currentRoundIndex: number;
  roundResults: RoundResult[];
}> {
  const res = await fetch(
    `${API_BASE_URL}/practice-sessions/${id}/evaluate-round`,
    {
      method: "POST",
      headers: authHeaders(),
    },
  );
  const data = await res.json();
  return data;
}

export async function completePracticeSession(
  id: string,
): Promise<{ evaluation: FinalEvaluation; session: PracticeSession }> {
  const res = await fetch(`${API_BASE_URL}/practice-sessions/${id}/complete`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  return data;
}

export async function contributePracticeClip(
  id: string,
  title?: string,
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/practice-sessions/${id}/feed-clip`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  return data.experience;
}

export interface PracticeRoundInfo {
  sessionId: string;
  status: string;
  roundIndex: number;
  round: {
    id: string;
    name: string;
    type: string;
    focusAreas: string[];
    sampleQuestions: string[];
    interviewers: Persona[];
  };
  company: string;
  role: string;
  speakers: Array<{
    interviewerIndex: number;
    name: string;
    role: string;
    avatarUrl: string;
    focusAreas: string[];
    started: boolean;
  }>;
  agora: { appId: string; channelName: string; token: string };
}

export async function fetchPracticeRound(
  id: string,
): Promise<PracticeRoundInfo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/practice-sessions/${id}/round`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data || null;
  } catch (err) {
    console.error("Error fetching practice round:", err);
    return null;
  }
}

export async function startSessionAgent(
  id: string,
  interviewerIndex = 0,
): Promise<any> {
  const res = await fetch(
    `${API_BASE_URL}/practice-sessions/${id}/agent/start`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ interviewerIndex }),
    },
  );
  const data = await res.json();
  if (!data?.success) throw new Error(data?.error || "Failed to start interviewer agent");
  return data.agent || null;
}

export async function stopSessionAgent(id: string): Promise<any> {
  const res = await fetch(
    `${API_BASE_URL}/practice-sessions/${id}/agent/stop`,
    {
      method: "POST",
      headers: authHeaders(),
    },
  );
  const data = await res.json();
  if (!data?.success) throw new Error(data?.error || "Failed to stop interviewer agent");
  return data;
}

export interface RoundStartResult {
  success: boolean;
  voiceMode: "live";
  agents: Array<{ interviewerIndex: number; interviewerName: string; taskId: string | null }>;
  round: { id: string; name: string; type: string };
  agora: { appId: string; channelName: string; token: string };
}

// Voice-first start: backend spins up conversational agents for the current round.
export async function startPracticeRound(id: string): Promise<RoundStartResult> {
  const res = await fetch(`${API_BASE_URL}/practice-sessions/${id}/start`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.error || "Failed to start the interview round");
  return data;
}

// Speech-to-text the candidate's recorded answer (Gemini), stored as a turn.
export async function transcribeAnswer(
  id: string,
  audioB64: string,
  mimeType = "audio/webm",
): Promise<{ text: string; transcripts: ConversationTurn[] }> {
  const res = await fetch(`${API_BASE_URL}/practice-sessions/${id}/transcribe`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ audioB64, mimeType }),
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.error || "Speech-to-text failed");
  return data;
}

export async function pushTranscript(
  id: string,
  text: string,
): Promise<ConversationTurn[]> {
  const res = await fetch(`${API_BASE_URL}/practice-sessions/${id}/transcript`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.error || "Failed to save transcript");
  return data.transcripts || [];
}

export interface DatasetPlanItem {
  id: string;
  company: string;
  role: string;
  level: string;
  difficulty: string;
  evaluationAreas: string[];
  rounds: Array<{
    name: string;
    type: string;
    durationMinutes?: number;
    focusAreas: string[];
    sampleQuestions: string[];
  }>;
}

export async function fetchDataset(params: {
  company?: string;
  role?: string;
  level?: string;
}): Promise<DatasetPlanItem[]> {
  try {
    const url = new URL(`${API_BASE_URL}/dataset`);
    if (params.company) url.searchParams.append("company", params.company);
    if (params.role) url.searchParams.append("role", params.role);
    if (params.level) url.searchParams.append("level", params.level);
    const res = await fetch(url.toString(), { headers: authHeaders() });
    const data = await res.json();
    return data.dataset || [];
  } catch (err) {
    console.error("Error fetching dataset:", err);
    return [];
  }
}
