import express from 'express';
import { InterviewOrchestrator, InterviewBlueprint, ConversationTurn, FinalEvaluation, RoundBlueprint, Persona } from './services/orchestrator';
import { generateAgoraToken } from './services/agoraService.js';
import { requireAuth, getTokenUser } from './middleware.js';
import { addFeedExperience, feedStore } from './services/feedStore.js';
import { SeedExperience } from './data/seedFeed.js';
import { indexQuestionsFromLists, indexExperienceQuestions, searchQuestions } from './services/questionStore.js';
import { startInterviewerAgent, stopAIAgent } from './services/agoraService.js';
import { INTERVIEW_DATASET, findDatasetInterview } from './data/interviewDataset.js';
import * as ai from './services/aiService.js';

// ---------------------------------------------------------------------------
// In-memory domain stores (PostgreSQL persistence is optional / fallback)
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
  type: RoundBlueprint['type'];
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
  mode: 'personal' | 'public';
  status: 'draft' | 'published';
  rounds: TemplateRound[];
  ratingCount: number;
  ratingTotal: number;
  views: number;
  votesUp: number;
  votesDown: number;
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
  status: 'active' | 'completed';
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
  sourceType: 'goal' | 'template' | 'generic';
  sourceId?: string;
  title: string;
  company: string;
  role: string;
  status: 'IN_PROGRESS' | 'PASSED' | 'FAILED';
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
  agents?: Array<{ interviewerIndex: number; interviewerName: string; result: any; startedAt: string }>;
  createdAt: string;
}

const agentStore: Agent[] = [];
const templateStore: InterviewTemplate[] = [];
const goalStore: Goal[] = [];
const practiceStore: PracticeSession[] = [];

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
];

function generatePlanText(company: string, role: string, rounds: RoundBlueprint[]): string {
  const lines = rounds.map(
    (r, idx) => `${idx + 1}. ${r.name} — focused on ${r.focusAreas.join(', ')} with ${r.interviewers.length} interviewer(s).`
  );
  return `AI-generated preparation plan for the ${role} role${company && company !== 'General' ? ` at ${company}` : ''}.\n\n${lines.join('\n')}\n\nYou will advance round-by-round. Pass a round to unlock the next one.`;
}

function blueprintFromTemplate(template: InterviewTemplate): InterviewBlueprint {
  const agentById = new Map(agentStore.map((a) => [a.id, a]));

  return {
    company: template.company,
    role: template.role,
    level: template.level,
    candidateName: 'Candidate',
    resumeHighlights: ['Practice session generated from a community interview template'],
    evaluationCriteria: ['Technical Ability', 'Problem Solving', 'Communication', 'Behavioral'],
    rounds: template.rounds.map((r, idx) => {
      const interviewers: Persona[] = r.agentIds
        .map((agentId) => agentById.get(agentId))
        .filter((a): a is Agent => !!a)
        .map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          avatarUrl: a.avatarUrl,
          personality: a.personality,
          style: a.style,
          focusAreas: a.focusAreas,
        }));

      if (interviewers.length === 0) {
        interviewers.push({
          id: `auto-${idx}`,
          name: r.type === 'RECRUITER' ? 'Alex Rivera' : 'Sam Chen',
          role: r.type === 'RECRUITER' ? 'Technical Recruiter' : 'Staff Engineer',
          avatarUrl: AVATARS[idx % AVATARS.length],
          personality: 'Professional, structured, and adaptive',
          style: r.type === 'RECRUITER' ? 'Conversational' : 'Deep-dive technical',
          focusAreas: r.focusAreas,
        });
      }

      return {
        id: r.id,
        name: r.name,
        type: r.type,
        interviewers,
        focusAreas: r.focusAreas,
        sampleQuestions: r.sampleQuestions,
      };
    }),
  };
}

function blueprintFromGoal(goal: Goal): InterviewBlueprint {
  return {
    company: goal.company,
    role: goal.role,
    level: goal.level,
    candidateName: 'Candidate',
    resumeHighlights: ['Personal preparation goal'],
    evaluationCriteria: ['Technical Ability', 'Problem Solving', 'Communication', 'Behavioral'],
    rounds: goal.rounds,
  };
}

function buildSession(userId: number, opts: { sourceType: 'goal' | 'template' | 'generic'; sourceId?: string; blueprint: InterviewBlueprint; title: string; company: string; role: string }): PracticeSession {
  const sessionId = id('session');
  const channelName = `agora-${sessionId}`;
  const agora = generateAgoraToken(channelName, 0);

  const session: PracticeSession = {
    id: sessionId,
    userId,
    sourceType: opts.sourceType,
    sourceId: opts.sourceId,
    title: opts.title,
    company: opts.company,
    role: opts.role,
    status: 'IN_PROGRESS',
    currentRoundIndex: 0,
    blueprint: opts.blueprint,
    transcripts: [],
    roundResults: [],
    agoraChannelName: channelName,
    agoraToken: agora.token,
    agoraAppId: agora.appId,
    agents: [],
    createdAt: new Date().toISOString(),
  };

  const initialTurn = InterviewOrchestrator.generateNextTurn({
    blueprint: session.blueprint,
    currentRoundIndex: 0,
    transcripts: [],
    latestCandidateInput: '',
  });
  session.transcripts.push(initialTurn.nextTurn);
  practiceStore.push(session);
  return session;
}

// ---------------------------------------------------------------------------
// AI (Gemini) grounding + conversion helpers
// ---------------------------------------------------------------------------

function summarizeDataset(company: string, role: string): string {
  const match = findDatasetInterview(company, role);
  const picks = match ? [match] : INTERVIEW_DATASET.slice(0, 2);
  return picks
    .map((d) =>
      [
        `${d.company} · ${d.role} (${d.level})`,
        ...d.rounds.map(
          (r) =>
            `  - ${r.name} (${r.type}, ~${r.durationMinutes || 45}min): ${r.focusAreas.join(', ')} | Q: ${r.sampleQuestions.slice(0, 3).join(' / ')}`
        ),
      ].join('\n')
    )
    .join('\n');
}

function summarizeCommunity(company: string, role: string): string {
  const tokens = `${company} ${role}`.toLowerCase();
  const experiences = feedStore
    .filter((i) => {
      const hay = `${i.company} ${i.role}`.toLowerCase();
      return company && role ? hay.includes(company.toLowerCase()) || hay.includes(role.toLowerCase()) : true;
    })
    .slice(0, 3)
    .map((i) => `${i.company} · ${i.role} — rounds: ${(i.rounds || []).map((r) => r.name).join(', ') || 'n/a'}; sample Q: ${(i.rounds || [])[0]?.sampleQuestions?.slice(0, 2).join(' / ') || 'n/a'}`)
    .join('\n');
  void tokens;
  const questions = searchQuestions({ q: role || company, limit: 6 })
    .map((q) => `- ${q.text}`)
    .join('\n');
  return [experiences, questions].filter(Boolean).join('\n');
}

function aiBlueprint(company: string, role: string, level: string | undefined, s: ai.AiStructure): InterviewBlueprint {
  const evaluationCriteria = ['Technical Ability', 'Problem Solving', 'Communication', 'Behavioral'];
  return {
    company: company || 'General',
    role: role || 'Software Engineer',
    level: level || 'Mid-Senior',
    candidateName: 'Candidate',
    resumeHighlights: ['Profile from AI-structured generation'],
    evaluationCriteria,
    rounds: s.rounds.map((r, idx) => {
      const type = (['RECRUITER', 'TECHNICAL', 'PANEL', 'HIRING_MANAGER', 'CODING'].includes(r.type) ? r.type : 'TECHNICAL') as RoundBlueprint['type'];
      const interviewers = (r.interviewers || []).length
        ? (r.interviewers || []).map((iv, pIdx) => ({
            id: `p-${idx + 1}-${pIdx + 1}`,
            name: iv.name || `Interviewer ${pIdx + 1}`,
            role: iv.role || (type === 'RECRUITER' ? 'Recruiter' : 'Interviewer'),
            avatarUrl: AVATARS[(idx + pIdx) % AVATARS.length],
            personality: iv.personality || 'Professional and adaptive',
            style: iv.style || (type === 'RECRUITER' ? 'Conversational' : 'Deep-dive technical'),
            focusAreas: (iv.focusAreas && iv.focusAreas.length ? iv.focusAreas : r.focusAreas),
          }))
        : [{
            id: `p-${idx + 1}-1`,
            name: type === 'RECRUITER' ? 'Avery Grant' : 'Jordan Ellis',
            role: type === 'RECRUITER' ? 'Recruiter' : type === 'HIRING_MANAGER' ? 'Hiring Manager' : 'Staff Engineer',
            avatarUrl: AVATARS[idx % AVATARS.length],
            personality: 'Professional, structured, and adaptive',
            style: type === 'RECRUITER' ? 'Conversational' : 'Deep-dive technical',
            focusAreas: r.focusAreas,
          }];
      return {
        id: `round-${idx + 1}`,
        name: r.name,
        type,
        interviewers,
        focusAreas: (r.focusAreas || []).length ? r.focusAreas : ['Core competency'],
        sampleQuestions: (r.sampleQuestions || []).length ? r.sampleQuestions : ['Tell me about a recent project and the hardest problem you solved.'],
      };
    }),
  };
}

function goalFromStructure(g: Goal, s: ai.AiStructure): Goal {
  const rounds = s.rounds.map((r, idx) => ({
    id: `round-${idx + 1}`,
    name: r.name,
    type: (['RECRUITER', 'TECHNICAL', 'PANEL', 'HIRING_MANAGER', 'CODING'].includes(r.type) ? r.type : 'TECHNICAL') as RoundBlueprint['type'],
    interviewers: (r.interviewers || []).map((iv, pIdx) => ({
      id: `p-${idx + 1}-${pIdx + 1}`,
      name: iv.name || `Interviewer ${pIdx + 1}`,
      role: iv.role || 'Interviewer',
      avatarUrl: AVATARS[(idx + pIdx) % AVATARS.length],
      personality: iv.personality || 'Professional and adaptive',
      style: iv.style || 'Adaptive',
      focusAreas: iv.focusAreas?.length ? iv.focusAreas : r.focusAreas,
    })),
    focusAreas: r.focusAreas || [],
    sampleQuestions: r.sampleQuestions || [],
  }));
  return {
    ...g,
    plan: s.plan || g.plan,
    rounds,
    totalRounds: rounds.length,
  };
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Round evaluation heuristic
// ---------------------------------------------------------------------------

function evaluateRound(session: PracticeSession): RoundResult {
  const roundIndex = session.currentRoundIndex;
  const round = session.blueprint.rounds[roundIndex];
  const roundTurns = session.transcripts.filter((t) => t.roundIndex === roundIndex);
  const candidateTurns = roundTurns.filter((t) => t.sender === 'candidate');

  const avgWords =
    candidateTurns.reduce((acc, t) => acc + t.text.split(/\s+/).length, 0) / (candidateTurns.length || 1);
  const depthWords = candidateTurns.reduce((acc, t) => acc + t.text.split(/\s+/).length, 0);

  let score = 60;
  if (avgWords > 12) score += 12;
  if (avgWords > 22) score += 8;
  if (depthWords > 60) score += 8;
  if (candidateTurns.length >= 2) score += 6;
  if (candidateTurns.length >= 4) score += 4;

  // signals of depth
  const joined = candidateTurns.map((t) => t.text.toLowerCase()).join(' ');
  if (/scale|scalability|req\/sec|throughput|latency|p99/.test(joined)) score += 4;
  if (/trade[- ]?off|pros and cons|alternative|consideration/.test(joined)) score += 3;
  if (/idempoten|deadlock|race|isolation|lock|transaction/.test(joined)) score += 3;

  score = Math.max(40, Math.min(score, 98));
  const passed = score >= 70;

  const result: RoundResult = {
    roundIndex,
    roundName: round.name,
    score,
    passed,
    keyObservation: passed
      ? `Strong performance in ${round.focusAreas.join(', ')} — candidate communicated depth and trade-offs.`
      : `Below the passing bar for ${round.focusAreas.join(', ')} — more structure and depth needed.`,
  };

  session.roundResults[roundIndex] = result;

  if (passed) {
    if (roundIndex >= session.blueprint.rounds.length - 1) {
      session.status = 'PASSED';
    } else {
      session.currentRoundIndex = roundIndex + 1;
      const nextTurn = InterviewOrchestrator.generateNextTurn({
        blueprint: session.blueprint,
        currentRoundIndex: roundIndex + 1,
        transcripts: session.transcripts,
        latestCandidateInput: '',
      });
      session.transcripts.push(nextTurn.nextTurn);
    }
  } else {
    session.status = 'FAILED';
  }

  return result;
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerPlatformRoutes(app: express.Express) {
  // ---- Agents -------------------------------------------------------------
  app.post('/api/agents', requireAuth, (req, res) => {
    try {
      const user = getTokenUser(req);
      const { name, role, avatarUrl, personality, systemPrompt, behavior, style, focusAreas, voice, isCommunity } = req.body;
      if (!name || !role) {
        return res.status(400).json({ success: false, error: 'Agent name and role are required' });
      }
      const agent: Agent = {
        id: id('agent'),
        ownerId: user.id,
        ownerName: user.name,
        name,
        role,
        avatarUrl: avatarUrl || AVATARS[agentStore.length % AVATARS.length],
        personality: personality || 'Professional and adaptive',
        systemPrompt: systemPrompt || '',
        behavior: behavior || '',
        style: style || 'Adaptive',
        focusAreas: Array.isArray(focusAreas) ? focusAreas : [],
        voice: voice || 'default',
        isCommunity: !!isCommunity,
        createdAt: new Date().toISOString(),
      };
      agentStore.unshift(agent);
      res.json({ success: true, agent });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/agents', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const { mine } = req.query;
    let items = agentStore;
    if (mine === 'true') {
      items = items.filter((a) => a.ownerId === user.id);
    } else {
      items = items.filter((a) => a.ownerId === user.id || a.isCommunity);
    }
    res.json({ success: true, agents: items });
  });

  app.get('/api/agents/:id', requireAuth, (req, res) => {
    const agent = agentStore.find((a) => a.id === req.params.id);
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
    res.json({ success: true, agent });
  });

  app.delete('/api/agents/:id', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const idx = agentStore.findIndex((a) => a.id === req.params.id && a.ownerId === user.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Agent not found' });
    const [removed] = agentStore.splice(idx, 1);
    res.json({ success: true, agent: removed });
  });

  // ---- Interview Templates ------------------------------------------------
  app.post('/api/interview-templates', requireAuth, (req, res) => {
    try {
      const user = getTokenUser(req);
      const { title, company, role, level, description, mode, rounds } = req.body;
      if (!title || !company || !role) {
        return res.status(400).json({ success: false, error: 'Title, company, and role are required' });
      }

      const template: InterviewTemplate = {
        id: id('template'),
        ownerId: user.id,
        ownerName: user.name,
        title,
        company,
        role,
        level: level || 'Mid-Senior',
        description: description || '',
        mode: mode === 'public' ? 'public' : 'personal',
        status: 'draft',
        rounds: Array.isArray(rounds)
          ? rounds.map((r: any) => ({
              id: r.id || id('round'),
              name: r.name || 'Untitled round',
              type: r.type || 'TECHNICAL',
              focusAreas: Array.isArray(r.focusAreas) ? r.focusAreas : [],
              sampleQuestions: Array.isArray(r.sampleQuestions) ? r.sampleQuestions : [],
              agentIds: Array.isArray(r.agentIds) ? r.agentIds : [],
            }))
          : [],
        ratingCount: 0,
        ratingTotal: 0,
        views: 0,
        votesUp: 0,
        votesDown: 0,
        createdAt: new Date().toISOString(),
      };
      templateStore.unshift(template);
      indexQuestionsFromLists(
        template.rounds.flatMap((r) => r.sampleQuestions),
        'template',
        template.company,
        template.role
      );
      res.json({ success: true, template });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/interview-templates', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const { scope } = req.query;
    let items = templateStore;
    if (scope === 'mine') {
      items = items.filter((t) => t.ownerId === user.id);
    } else {
      items = items.filter((t) => t.mode === 'public' && t.status === 'published');
    }
    res.json({ success: true, templates: items });
  });

  app.get('/api/interview-templates/:id', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const template = templateStore.find((t) => t.id === req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    if (template.ownerId !== user.id && !(template.mode === 'public' && template.status === 'published')) {
      return res.status(403).json({ success: false, error: 'Template is private' });
    }
    template.views += 1;
    res.json({ success: true, template });
  });

  app.post('/api/interview-templates/:id/publish', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const template = templateStore.find((t) => t.id === req.params.id && t.ownerId === user.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    if (template.mode !== 'public') return res.status(400).json({ success: false, error: 'Only public templates can be published' });
    template.status = 'published';
    res.json({ success: true, template });
  });

  app.post('/api/interview-templates/:id/rate', requireAuth, (req, res) => {
    const { rating } = req.body;
    const value = Number(rating);
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }
    const template = templateStore.find((t) => t.id === req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    template.ratingTotal += value;
    template.ratingCount += 1;
    res.json({ success: true, ratingAvg: template.ratingTotal / template.ratingCount, ratingCount: template.ratingCount });
  });

  app.post('/api/interview-templates/:id/vote', requireAuth, (req, res) => {
    const { dir } = req.body || {};
    const template = templateStore.find((t) => t.id === req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    if (dir === 1) template.votesUp += 1;
    else if (dir === -1) template.votesDown += 1;
    else return res.status(400).json({ success: false, error: 'dir must be 1 (up) or -1 (down)' });
    res.json({ success: true, votesUp: template.votesUp, votesDown: template.votesDown, netVotes: template.votesUp - template.votesDown });
  });

  app.delete('/api/interview-templates/:id', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const idx = templateStore.findIndex((t) => t.id === req.params.id && t.ownerId === user.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Template not found' });
    const [removed] = templateStore.splice(idx, 1);
    res.json({ success: true, template: removed });
  });

  // ---- Goals ---------------------------------------------------------------
  app.post('/api/goals', requireAuth, async (req, res) => {
    try {
      const user = getTokenUser(req);
      const { title, company, role, level, notes } = req.body;
      if (!role) {
        return res.status(400).json({ success: false, error: 'Target role is required' });
      }

      const companyName = company || 'General';
      let blueprint = InterviewOrchestrator.generateBlueprint({
        company: companyName,
        role,
        jobDescription: notes,
        resumeText: notes,
      });

      // LLM-first: ground in dataset + community knowledge, then generate a
      // bespoke structure from Gemini when a key is configured.
      const structure = await ai.generateStructure({
        company: companyName,
        role,
        level,
        notes,
        datasetSummary: summarizeDataset(companyName, role),
        communitySummary: summarizeCommunity(companyName, role),
      });
      if (structure && structure.rounds.length) {
        blueprint = aiBlueprint(companyName, role, level, structure);
      }

      const goal: Goal = {
        id: id('goal'),
        userId: user.id,
        title: title || `Prepare for ${companyName} ${role}`,
        company: companyName,
        role,
        level: level || blueprint.level || 'Mid-Senior',
        plan: structure?.plan || generatePlanText(companyName, role, blueprint.rounds),
        rounds: blueprint.rounds,
        status: 'active',
        completedRounds: 0,
        totalRounds: blueprint.rounds.length,
        createdAt: new Date().toISOString(),
      };
      const finalGoal = structure && structure.rounds.length ? goalFromStructure(goal, structure) : goal;
      goalStore.unshift(finalGoal);
      res.json({ success: true, goal: finalGoal, ai: ai.aiEnabled() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/goals', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const goals = goalStore
      .filter((g) => g.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ success: true, goals });
  });

  app.get('/api/goals/:id', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const goal = goalStore.find((g) => g.id === req.params.id && g.userId === user.id);
    if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });
    res.json({ success: true, goal });
  });

  app.delete('/api/goals/:id', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const idx = goalStore.findIndex((g) => g.id === req.params.id && g.userId === user.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Goal not found' });
    const [removed] = goalStore.splice(idx, 1);
    res.json({ success: true, goal: removed });
  });

  // ---- Practice Sessions ---------------------------------------------------
  app.post('/api/practice-sessions', requireAuth, async (req, res) => {
    try {
      const user = getTokenUser(req);
      const { goalId, templateId, company, role, resumeText, jobDescription, githubUrl, candidateName } = req.body;

      if (goalId) {
        const goal = goalStore.find((g) => g.id === goalId && g.userId === user.id);
        if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });
        const session = buildSession(user.id, {
          sourceType: 'goal',
          sourceId: goal.id,
          blueprint: blueprintFromGoal(goal),
          title: goal.title,
          company: goal.company,
          role: goal.role,
        });
        return res.json({ success: true, session });
      }

      if (templateId) {
        const template = templateStore.find((t) => t.id === templateId);
        if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
        if (template.ownerId !== user.id && !(template.mode === 'public' && template.status === 'published')) {
          return res.status(403).json({ success: false, error: 'Template is private' });
        }
        const session = buildSession(user.id, {
          sourceType: 'template',
          sourceId: template.id,
          blueprint: blueprintFromTemplate(template),
          title: template.title,
          company: template.company,
          role: template.role,
        });
        return res.json({ success: true, session });
      }

      // Generic / free-form (JD import, quick practice): ask Gemini to tailor a
      // real structure from the dataset + community database before falling back.
      const companyName = company || 'General';
      const roleName = role || 'Software Engineer';
      const notes = resumeText || jobDescription || '';
      let blueprint = InterviewOrchestrator.generateBlueprint({
        company: companyName,
        role: roleName,
        resumeText: notes,
        githubUrl,
      });

      const structure = await ai.generateStructure({
        company: companyName,
        role: roleName,
        notes,
        datasetSummary: summarizeDataset(companyName, roleName),
        communitySummary: summarizeCommunity(companyName, roleName),
      });
      if (structure && structure.rounds.length) {
        blueprint = aiBlueprint(companyName, roleName, blueprint.level, structure);
      }
      if (candidateName) blueprint.candidateName = candidateName;

      const session = buildSession(user.id, {
        sourceType: 'generic',
        blueprint,
        title: `${companyName} ${roleName}`,
        company: companyName,
        role: roleName,
      });
      res.json({ success: true, session, ai: ai.aiEnabled() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/practice-sessions', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const sessions = practiceStore
      .filter((s) => s.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ success: true, sessions });
  });

  app.get('/api/practice-sessions/:id', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const session = practiceStore.find((s) => s.id === req.params.id && s.userId === user.id);
    if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });
    res.json({ success: true, session });
  });

  app.post('/api/practice-sessions/:id/interact', requireAuth, async (req, res) => {
    const user = getTokenUser(req);
    const session = practiceStore.find((s) => s.id === req.params.id && s.userId === user.id);
    if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });
    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: 'Session is not in progress' });
    }

    const { candidateInput } = req.body;
    if (candidateInput && typeof candidateInput === 'string' && candidateInput.trim().length > 0) {
      session.transcripts.push({
        sender: 'candidate',
        text: candidateInput.trim(),
        timestamp: new Date().toISOString(),
        roundIndex: session.currentRoundIndex,
      });
    }

    const turnResult = InterviewOrchestrator.generateNextTurn({
      blueprint: session.blueprint,
      currentRoundIndex: session.currentRoundIndex,
      transcripts: session.transcripts,
      latestCandidateInput: candidateInput || '',
    });

    // LLM-first replies: let Gemini speak as the active interviewer.
    if (ai.aiEnabled() && turnResult.activeInterviewer) {
      const round = session.blueprint.rounds[session.currentRoundIndex];
      const aiReply = await ai.interviewerReply({
        interviewer: turnResult.activeInterviewer,
        round,
        company: session.company,
        targetRole: session.role,
        resumeHighlights: session.blueprint.resumeHighlights,
        history: session.transcripts.slice(-12).map((t) => ({ sender: t.sender, name: t.interviewerName, text: t.text })),
        lastCandidateAnswer: candidateInput || '',
      });
      if (aiReply) turnResult.nextTurn.text = aiReply;
    }

    session.transcripts.push(turnResult.nextTurn);

    res.json({
      success: true,
      nextTurn: turnResult.nextTurn,
      activeInterviewer: turnResult.activeInterviewer,
      currentRoundIndex: session.currentRoundIndex,
      transcripts: session.transcripts,
      ai: ai.aiEnabled(),
    });
  });

  app.post('/api/practice-sessions/:id/evaluate-round', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const session = practiceStore.find((s) => s.id === req.params.id && s.userId === user.id);
    if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });
    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: 'Session is not in progress' });
    }

    const result = evaluateRound(session);
    res.json({
      success: true,
      result,
      sessionStatus: session.status,
      currentRoundIndex: session.currentRoundIndex,
      roundResults: session.roundResults,
    });
  });

  app.post('/api/practice-sessions/:id/complete', requireAuth, async (req, res) => {
    const user = getTokenUser(req);
    const session = practiceStore.find((s) => s.id === req.params.id && s.userId === user.id);
    if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });

    let evaluation = InterviewOrchestrator.generateEvaluation(session.blueprint, session.transcripts);

    // LLM-first hiring-committee evaluation.
    if (ai.aiEnabled()) {
      const aiEval = await ai.evaluatePerformance({
        company: session.company,
        role: session.role,
        rounds: session.blueprint.rounds.map((r) => ({ name: r.name, type: r.type, focusAreas: r.focusAreas })),
        transcripts: session.transcripts.map((t) => ({ sender: t.sender, name: t.interviewerName, text: t.text })),
      });
      if (aiEval) {
        evaluation = {
          overallScore: aiEval.overallScore,
          passRecommendation: aiEval.passRecommendation,
          summary: `${session.company} ${session.role} simulation (${session.blueprint.rounds.length} rounds) — evaluated by AI hiring committee.`,
          metrics: {
            technicalAbility: aiEval.metrics?.technicalAbility ?? aiEval.overallScore,
            problemSolving: aiEval.metrics?.problemSolving ?? aiEval.overallScore,
            communication: aiEval.metrics?.communication ?? aiEval.overallScore,
            behavioral: aiEval.metrics?.behavioral ?? aiEval.overallScore,
            roleSpecific: aiEval.metrics?.roleSpecific ?? aiEval.overallScore,
          },
          strengths: aiEval.strengths || [],
          weaknesses: aiEval.weaknesses || [],
          improvementSuggestions: aiEval.improvementSuggestions || [],
          struggledQuestions: [],
          roundEvaluations: aiEval.roundEvaluations || session.blueprint.rounds.map((r) => ({ roundName: r.name, score: aiEval.overallScore, keyObservation: '', strengths: [], areasForGrowth: [] })),
          interviewerFeedback: aiEval.interviewerFeedback || session.blueprint.rounds.flatMap((r) => r.interviewers.map((i) => ({ interviewerName: i.name, role: i.role, feedback: '', verdict: aiEval.passRecommendation ? 'Hire' : 'Weak Hire' as any }))),
        };
      }
    }

    session.evaluation = evaluation;
    session.overallScore = evaluation.overallScore;
    session.passRecommendation = evaluation.passRecommendation;
    if (session.status === 'IN_PROGRESS') {
      session.status = session.passRecommendation ? 'PASSED' : 'FAILED';
    }

    // Update goal progress
    if (session.sourceType === 'goal' && session.sourceId) {
      const goal = goalStore.find((g) => g.id === session.sourceId && g.userId === user.id);
      if (goal) {
        const passed = session.status === 'PASSED';
        goal.completedRounds = passed ? goal.totalRounds : Math.max(0, (goal.completedRounds || 0));
        if (passed) goal.status = 'completed';
      }
    }

    res.json({ success: true, evaluation, session, ai: ai.aiEnabled() });
  });

  app.post('/api/practice-sessions/:id/feed-clip', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const session = practiceStore.find((s) => s.id === req.params.id && s.userId === user.id);
    if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });
    if (session.status !== 'PASSED') {
      return res.status(400).json({ success: false, error: 'Only passed sessions can be contributed to the feed' });
    }
    if (session.sourceType === 'template' && session.sourceId) {
      const template = templateStore.find((t) => t.id === session.sourceId);
      if (template) template.views += 1;
    }

    const clip: SeedExperience = {
      id: `exp-${Date.now()}`,
      company: session.company,
      role: session.role,
      level: session.blueprint.level,
      summary:
        (req.body?.title as string) ||
        `A ${session.company} ${session.role} simulation that passed all ${session.blueprint.rounds.length} rounds, shared by ${user.name}.`,
      difficulty: 'Hard',
      topics: session.blueprint.rounds.flatMap((r) => r.focusAreas.slice(0, 2)),
      upvotes: 0,
      authorName: user.name,
      evaluationAreas: session.blueprint.evaluationCriteria,
      rounds: session.blueprint.rounds.map((r) => ({
        name: r.name,
        type: r.type,
        interviewers: r.interviewers.map((i) => ({
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

    addFeedExperience(clip);
    indexExperienceQuestions(clip);

    res.json({ success: true, experience: clip, feedCount: feedStore.length });
  });

  // ---- Dataset (curated "database" until the web scraper lands) ------------

  app.get('/api/dataset', (req, res) => {
    const { company, role, level } = req.query;
    const qCompany = (company as string || '').trim().toLowerCase();
    const qRole = (role as string || '').trim().toLowerCase();
    const qLevel = (level as string || '').trim().toLowerCase();

    let items = INTERVIEW_DATASET;
    if (qCompany && qCompany !== 'general') items = items.filter((d) => d.company.toLowerCase().includes(qCompany));
    if (qRole) items = items.filter((d) => d.role.toLowerCase().includes(qRole) || d.level.toLowerCase().includes(qRole));
    if (qLevel) items = items.filter((d) => d.level.toLowerCase().includes(qLevel));

    res.json({
      success: true,
      count: items.length,
      dataset: items.map((d) => ({
        id: d.id,
        company: d.company,
        role: d.role,
        level: d.level,
        difficulty: d.difficulty,
        evaluationAreas: d.evaluationAreas,
        rounds: d.rounds.map((r) => ({ name: r.name, type: r.type, durationMinutes: r.durationMinutes, focusAreas: r.focusAreas, sampleQuestions: r.sampleQuestions, interviewers: r.interviewers })),
      })),
    });
  });

  // ---- Round + live agent controls for a practice session ------------------

  app.get('/api/practice-sessions/:id/round', requireAuth, (req, res) => {
    const user = getTokenUser(req);
    const session = practiceStore.find((s) => s.id === req.params.id && s.userId === user.id);
    if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });

    const round = session.blueprint.rounds[session.currentRoundIndex];
    if (!round) return res.status(404).json({ success: false, error: 'Round not found' });

    // Fresh RTC credentials for the current round
    const credentials = generateAgoraToken(session.agoraChannelName, 0);

    res.json({
      success: true,
      sessionId: session.id,
      status: session.status,
      roundIndex: session.currentRoundIndex,
      round: {
        id: round.id,
        name: round.name,
        type: round.type,
        focusAreas: round.focusAreas,
        sampleQuestions: round.sampleQuestions,
        interviewers: round.interviewers,
      },
      company: session.company,
      role: session.role,
      speakers: round.interviewers.map((i, idx) => ({
        interviewerIndex: idx,
        name: i.name,
        role: i.role,
        avatarUrl: i.avatarUrl,
        focusAreas: i.focusAreas,
        started: !!session.agents?.some((a) => a.interviewerIndex === idx),
      })),
      agora: {
        appId: credentials.appId,
        channelName: session.agoraChannelName,
        token: credentials.token,
      },
    });
  });

  app.post('/api/practice-sessions/:id/agent/start', requireAuth, async (req, res) => {
    try {
      const user = getTokenUser(req);
      const session = practiceStore.find((s) => s.id === req.params.id && s.userId === user.id);
      if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });

      const round = session.blueprint.rounds[session.currentRoundIndex];
      const requestedIndex = Number(req.body?.interviewerIndex ?? 0);
      const persona = round?.interviewers?.[requestedIndex] || round?.interviewers?.[0];

      if (!persona) {
        return res.status(404).json({ success: false, error: 'No interviewer available for this round' });
      }

      const config = InterviewOrchestrator.buildConversationalAgentConfig({
        persona,
        round,
        blueprint: session.blueprint,
      });

      const result = await startInterviewerAgent({
        channelName: session.agoraChannelName,
        interviewerName: persona.name,
        interviewerRole: persona.role,
        systemPrompt: config.systemPrompt,
        greeting: config.greeting,
        ttsVoice: config.ttsVoice,
      });

      const entry = {
        interviewerIndex: requestedIndex || 0,
        interviewerName: persona.name,
        result,
        startedAt: new Date().toISOString(),
      };
      session.agents = [...(session.agents || []).filter((a) => a.interviewerIndex !== entry.interviewerIndex), entry];

      res.json({ success: true, agent: entry, round: { id: round.id, name: round.name, type: round.type } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/practice-sessions/:id/agent/stop', requireAuth, async (req, res) => {
    try {
      const user = getTokenUser(req);
      const session = practiceStore.find((s) => s.id === req.params.id && s.userId === user.id);
      if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });

      const result = await stopAIAgent(session.agoraChannelName);
      session.agents = [];
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
