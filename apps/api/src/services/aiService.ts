import { GoogleGenAI } from '@google/genai';

/**
 * AI service (Google Gemini). Every "generation" in the platform is driven from
 * here when GEMINI_API_KEY is set:
 *   - goal / interview structure generation (grounded in dataset + community data)
 *   - adaptive interviewer replies (text transcript mode)
 *   - post-interview evaluation
 *   - raw-experience parsing
 * When no key is configured the callers fall back to the deterministic engines.
 */

const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

let client: GoogleGenAI | null = null;
function genai(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: API_KEY });
  return client;
}

export function aiEnabled(): boolean {
  return !!API_KEY;
}

export async function aiGenerate(prompt: string, maxOutputTokens = 4096): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const res = await genai().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens,
        responseMimeType: 'application/json',
      },
    });
    return res.text || null;
  } catch (err) {
    console.error('Gemini call failed:', (err as Error).message);
    return null;
  }
}

/**
 * Speech-to-text for the candidate's recorded answers using Gemini audio
 * understanding. Returns the spoken words as plain text.
 */
export async function transcribeAudio(opts: {
  audioB64: string;
  mimeType?: string;
  sampleRate?: number;
}): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const res = await genai().models.generateContent({
      model: MODEL,
      contents: [
        { text: 'Transcribe the spoken speech in this audio verbatim. Output ONLY the words that were spoken, with no commentary, timestamps, or punctuation embellishment.' },
        {
          inlineData: {
            mimeType: opts.mimeType || 'audio/webm',
            data: opts.audioB64,
          },
        },
      ],
      config: { temperature: 0, maxOutputTokens: 2048 },
    });
    const text = (res.text || '').trim();
    return text || null;
  } catch (err) {
    console.error('Gemini transcription failed:', (err as Error).message);
    return null;
  }
}

function extractJson(text: string): any | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Shared context builders
// ---------------------------------------------------------------------------

export interface GenerationContext {
  company: string;
  role: string;
  level?: string;
  notes?: string; // job description / resume / user notes
  datasetSummary: string; // what the curated dataset knows
  communitySummary: string; // relevant contributor experiences & questions
}

function buildContextPrompt(ctx: GenerationContext): string {
  return [
    `COMPANY: ${ctx.company || 'General'}`,
    `ROLE: ${ctx.role || 'Software Engineer'}`,
    `LEVEL: ${ctx.level || 'unspecified'}`,
    ctx.notes ? `CANDIDATE INPUT / JOB DESCRIPTION:\n${ctx.notes.slice(0, 4000)}` : '',
    `KNOWN DATASET (company-verified loops):\n${ctx.datasetSummary.slice(0, 3000) || 'none'}`,
    `COMMUNITY KNOWLEDGE (contributor experiences/questions):\n${ctx.communitySummary.slice(0, 3000) || 'none'}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// 1. Goal / interview structure generation
// ---------------------------------------------------------------------------

export interface AiRound {
  name: string;
  type: 'RECRUITER' | 'TECHNICAL' | 'PANEL' | 'HIRING_MANAGER' | 'CODING';
  durationMinutes?: number;
  focusAreas: string[];
  sampleQuestions: string[];
  interviewers: Array<{
    name: string;
    role: string;
    personality: string;
    style: string;
    focusAreas: string[];
  }>;
}

export interface AiStructure {
  plan: string;
  rounds: AiRound[];
}

const STRUCTURE_SYSTEM = `You are a senior interview-strategy engine. Given a candidate's target company/role plus the known dataset and community knowledge above, produce the full interview structure a real company would run. Respond ONLY with JSON: {"plan": "concise coaching plan in plain text", "rounds": [{"name": string, "type": "RECRUITER|TECHNICAL|PANEL|HIRING_MANAGER|CODING", "durationMinutes": number, "focusAreas": [string], "sampleQuestions": [string], "interviewers": [{"name": string, "role": string, "personality": string, "style": string, "focusAreas": [string]}]}]}. Use 3-5 realistic rounds. Prefer dataset/community facts when they exist; otherwise use your own knowledge of that company's process. No markdown.`;

export async function generateStructure(ctx: GenerationContext): Promise<AiStructure | null> {
  if (!aiEnabled()) return null;
  const text = await aiGenerate(`${STRUCTURE_SYSTEM}\n\nINPUT:\n${buildContextPrompt(ctx)}`);
  const json = extractJson(text || '');
  if (!json || !Array.isArray(json.rounds)) return null;
  return {
    plan: typeof json.plan === 'string' ? json.plan : '',
    rounds: (json.rounds as AiRound[]).filter((r) => r && r.name).slice(0, 6),
  };
}

// ---------------------------------------------------------------------------
// 2. Adaptive interviewer reply (text mode)
// ---------------------------------------------------------------------------

export async function interviewerReply(opts: {
  interviewer: { name: string; role: string; personality: string; style: string; focusAreas: string[] };
  round: { name: string; type: string; focusAreas: string[]; sampleQuestions: string[] };
  company: string;
  targetRole: string;
  resumeHighlights: string[];
  history: Array<{ sender: string; name?: string; text: string }>;
  lastCandidateAnswer: string;
}): Promise<string | null> {
  if (!aiEnabled()) return null;
  const transcript = opts.history
    .map((t) => `${t.sender === 'candidate' ? 'Candidate' : t.name || 'Interviewer'}: ${t.text}`)
    .join('\n');

  const prompt = `You are ${opts.interviewer.name}, ${opts.interviewer.role}, running the "${opts.round.name}" round of a ${opts.company} ${opts.targetRole} interview.
Personality: ${opts.interviewer.personality}. Style: ${opts.interviewer.style}. Focus areas: ${opts.interviewer.focusAreas.join(', ')}.
Candidate background: ${opts.resumeHighlights.join('; ') || 'not provided'}.
Round focus: ${opts.round.focusAreas.join(', ')}. Use starter questions like: ${opts.round.sampleQuestions.join(' | ')}.

Conversation so far:
${transcript || '(round just started)'}

You are now responding to the candidate's latest answer: "${opts.lastCandidateAnswer || '(opening - greet the candidate and ask the first question)'}".

Reply with your next spoken turn ONLY (1-4 sentences, natural, no labels, no emojis). Ask ONE question or probe ONE claim deeply. If this is the round opening, greet as this interviewer and ask the first question in your voice. Respond with JSON: {"reply": "..."}`;

  const text = await aiGenerate(prompt, 700);
  const json = extractJson(text || '');
  if (json && typeof json.reply === 'string') return json.reply.trim();
  return null;
}

// ---------------------------------------------------------------------------
// 3. Evaluation
// ---------------------------------------------------------------------------

export async function evaluatePerformance(opts: {
  company: string;
  role: string;
  rounds: Array<{ name: string; type: string; focusAreas: string[] }>;
  transcripts: Array<{ sender: string; name?: string; text: string }>;
}): Promise<{
  overallScore: number;
  passRecommendation: boolean;
  metrics: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  roundEvaluations: Array<{ roundName: string; score: number; keyObservation: string; strengths: string[]; areasForGrowth: string[] }>;
  interviewerFeedback: Array<{ interviewerName: string; role: string; feedback: string; verdict: string }>;
} | null> {
  if (!aiEnabled()) return null;
  const transcript = opts.transcripts
    .map((t) => `${t.sender === 'candidate' ? 'Candidate' : t.name || 'Interviewer'}: ${t.text}`)
    .join('\n')
    .slice(0, 12000);

  const prompt = `Evaluate this simulated interview for ${opts.company} ${opts.role}.
Rounds: ${opts.rounds.map((r, i) => `${i + 1}. ${r.name} (${r.type})`).join(' | ')}.

Transcript:
${transcript || '(no meaningful answers — candidate should not pass)'}

Respond ONLY with JSON: {"overallScore": number 0-100, "passRecommendation": boolean, "metrics": {"technicalAbility": number, "problemSolving": number, "communication": number, "behavioral": number, "roleSpecific": number}, "strengths": [string], "weaknesses": [string], "improvementSuggestions": [string], "roundEvaluations": [{"roundName": string, "score": number, "keyObservation": string, "strengths": [string], "areasForGrowth": [string]}], "interviewerFeedback": [{"interviewerName": string, "role": string, "feedback": string, "verdict": "Strong Hire|Hire|Weak Hire|No Hire"}]}.
Be fair but demanding, like a real hiring committee.`;

  const text = await aiGenerate(prompt, 3000);
  const json = extractJson(text || '');
  if (!json || typeof json.overallScore !== 'number') return null;
  return json;
}

// ---------------------------------------------------------------------------
// 4. Raw experience → structured contribution parsing
// ---------------------------------------------------------------------------

export async function parseExperience(raw: string): Promise<{
  company: string;
  role: string;
  level: string;
  summary: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: string[];
  evaluationAreas: string[];
  rounds: Array<{
    name: string;
    type: string;
    sampleQuestions: string[];
    interviewers: Array<{ name: string; role: string; focusAreas: string[] }>;
  }>;
} | null> {
  if (!aiEnabled()) return null;
  const prompt = `Parse this real interview experience into structured data. Identify the company, role, difficulty, topics, and each round with its type and the questions asked. If an interviewer name/role is mentioned capture it.

Raw experience:
${raw.slice(0, 6000)}

Respond ONLY with JSON: {"company": string, "role": string, "level": string, "summary": string (2-3 sentences), "difficulty": "Easy|Medium|Hard", "topics": [string], "evaluationAreas": [string], "rounds": [{"name": string, "type": "RECRUITER|TECHNICAL|PANEL|HIRING_MANAGER|CODING", "sampleQuestions": [string], "interviewers": [{"name": string, "role": string, "focusAreas": [string]}]}]}. Keep questions verbatim where possible.`;

  const text = await aiGenerate(prompt, 4000);
  const json = extractJson(text || '');
  if (!json) return null;
  return json;
}
