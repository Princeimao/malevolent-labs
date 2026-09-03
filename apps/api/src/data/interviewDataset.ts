// Curated interview dataset (stands in for the web scraper until one is wired up).
// Keyed loosely by company + role; a general fallback always exists.

export interface DatasetInterviewer {
  name: string;
  role: string;
  avatarUrl?: string;
  personality: string;
  style: string;
  focusAreas: string[];
}

export interface DatasetRound {
  name: string;
  type: 'RECRUITER' | 'TECHNICAL' | 'PANEL' | 'HIRING_MANAGER' | 'CODING';
  durationMinutes?: number;
  focusAreas: string[];
  sampleQuestions: string[];
  interviewers: DatasetInterviewer[];
}

export interface DatasetExperience {
  id: string;
  company: string;
  role: string;
  level: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  evaluationAreas: string[];
  rounds: DatasetRound[];
}

export const INTERVIEW_DATASET: DatasetExperience[] = [
  {
    id: 'ds-google-sde',
    company: 'Google',
    role: 'Software Engineer',
    level: 'L4/L5 (Mid-Senior)',
    difficulty: 'Hard',
    evaluationAreas: ['Algorithmic Thinking', 'System Design', 'Googleyness', 'Communication'],
    rounds: [
      {
        name: 'Recruiter Screen',
        type: 'RECRUITER',
        durationMinutes: 30,
        focusAreas: ['Background', 'Motivation', 'Team preferences'],
        sampleQuestions: [
          'Tell me about your background and the projects you are most proud of.',
          'Why Google, and why this role?',
          'What kind of teams and products excite you?',
        ],
        interviewers: [
          {
            name: 'Dana Whitfield',
            role: 'Technical Recruiter',
            avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
            personality: 'Warm, structured, focused on career narrative',
            style: 'Conversational screen',
            focusAreas: ['Career Trajectory', 'Motivation'],
          },
        ],
      },
      {
        name: 'Coding & Algorithms',
        type: 'CODING',
        durationMinutes: 45,
        focusAreas: ['Data Structures', 'Complexity Analysis', 'Clean Code'],
        sampleQuestions: [
          'Design an LRU cache that supports get and put in O(1).',
          'Given an array of intervals, merge all overlapping intervals.',
          'Find the longest substring without repeating characters and justify the complexity.',
        ],
        interviewers: [
          {
            name: 'Marcus Hale',
            role: 'Software Engineer',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            personality: 'Precise, probes complexity and edge cases',
            style: 'Whiteboard coding',
            focusAreas: ['Optimal Solutions', 'Edge Cases'],
          },
        ],
      },
      {
        name: 'System Design',
        type: 'TECHNICAL',
        durationMinutes: 45,
        focusAreas: ['Scale', 'Caching', 'Consistency'],
        sampleQuestions: [
          'Design Google Docs with real-time collaboration and cursor sync.',
          'How would you design a global feed system serving millions of reads per second?',
        ],
        interviewers: [
          {
            name: 'Priya Nair',
            role: 'Staff Engineer',
            avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
            personality: 'Analytical, drives to trade-offs and failure modes',
            style: 'Deep-dive architectural',
            focusAreas: ['Scalability', 'Trade-offs'],
          },
        ],
      },
      {
        name: 'Hiring Committee / Manager',
        type: 'HIRING_MANAGER',
        durationMinutes: 30,
        focusAreas: ['Leadership', 'Conflict', 'Impact'],
        sampleQuestions: [
          'Describe a time you influenced a decision without authority.',
          'How do you handle disagreement with your manager on technical direction?',
        ],
        interviewers: [
          {
            name: 'Tom Okafor',
            role: 'Engineering Manager',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
            personality: 'Vision-oriented, evaluates ownership',
            style: 'Behavioral',
            focusAreas: ['Ownership', 'Influence'],
          },
        ],
      },
    ],
  },
  {
    id: 'ds-meta-swe',
    company: 'Meta',
    role: 'Software Engineer',
    level: 'E5 (Senior)',
    difficulty: 'Hard',
    evaluationAreas: ['Problem Solving', 'System Design', 'Behavioral', 'Speed'],
    rounds: [
      {
        name: 'Recruiter Screen',
        type: 'RECRUITER',
        durationMinutes: 30,
        focusAreas: ['Background', 'Motivation'],
        sampleQuestions: [
          'Walk me through your resume and the biggest impact you have had.',
          'Why Meta now?',
        ],
        interviewers: [
          {
            name: 'Ashley Brooks',
            role: 'Talent Partner',
            personality: 'Friendly and fast-paced',
            style: 'Conversational',
            focusAreas: ['Impact', 'Motivation'],
          },
        ],
      },
      {
        name: 'Coding Round',
        type: 'CODING',
        durationMinutes: 40,
        focusAreas: ['Data Structures', 'Graphs', 'Optimization'],
        sampleQuestions: [
          'Implement a function to serialize and deserialize a binary tree.',
          'Find the number of connected components in a grid and explain the space complexity.',
        ],
        interviewers: [
          {
            name: 'Ravi Menon',
            role: 'Software Engineer',
            personality: 'Fast, expects clean optimal code quickly',
            style: 'Whiteboard coding',
            focusAreas: ['Speed', 'Clean Code'],
          },
        ],
      },
      {
        name: 'System Design',
        type: 'TECHNICAL',
        durationMinutes: 45,
        focusAreas: ['Newsfeed scale', 'Caching', 'Notifications'],
        sampleQuestions: [
          'Design a notification system that handles 10B notifications a day.',
          'How would you architect Meta-style newsfeed ranking infrastructure?',
        ],
        interviewers: [
          {
            name: 'Linda Zhang',
            role: 'Staff Engineer',
            personality: 'Challenging, probes consistency and latency',
            style: 'Deep-dive',
            focusAreas: ['Throughput', 'Latency'],
          },
        ],
      },
      {
        name: 'Behavioral / Manager',
        type: 'HIRING_MANAGER',
        durationMinutes: 30,
        focusAreas: ['Conflict', 'Ambition', 'Cross-team'],
        sampleQuestions: [
          'Tell me about a conflict with a peer and how you resolved it.',
          'What is the most impactful thing you shipped and why was it hard?',
        ],
        interviewers: [
          {
            name: 'Chris Aldana',
            role: 'Engineering Manager',
            personality: 'Direct, evaluates candor and ownership',
            style: 'Behavioral',
            focusAreas: ['Candor', 'Ownership'],
          },
        ],
      },
    ],
  },
  {
    id: 'ds-amazon-sde',
    company: 'Amazon',
    role: 'Software Development Engineer',
    level: 'SDE II',
    difficulty: 'Hard',
    evaluationAreas: ['Leadership Principles', 'Coding', 'System Design', 'Bar Raiser'],
    rounds: [
      {
        name: 'Phone Screen',
        type: 'RECRUITER',
        durationMinutes: 45,
        focusAreas: ['Coding fundamentals', 'LP behaviors'],
        sampleQuestions: [
          'Walk me through a time you took a big risk that paid off.',
          'Solve: determine if two strings are one edit away.',
        ],
        interviewers: [
          {
            name: 'Sofia Reyes',
            role: 'SDE',
            personality: 'Evaluates coding + leadership principles together',
            style: 'Technical screen',
            focusAreas: ['Coding', 'Leadership Principles'],
          },
        ],
      },
      {
        name: 'Coding Loop',
        type: 'CODING',
        durationMinutes: 60,
        focusAreas: ['Algorithms', 'Scale', 'Amazon-scale constraints'],
        sampleQuestions: [
          'Design a rate limiter that works at Amazon scale.',
          'Implement a Least Recently Used cache with a twist: multi-threaded access.',
        ],
        interviewers: [
          {
            name: 'Ethan Cole',
            role: 'SDE III',
            personality: 'Detail-oriented, dives into bottlenecks',
            style: 'Deep coding',
            focusAreas: ['Concurrency', 'Scale'],
          },
        ],
      },
      {
        name: 'System Design + Bar Raiser',
        type: 'PANEL',
        durationMinutes: 60,
        focusAreas: ['Distributed systems', 'Bias for action'],
        sampleQuestions: [
          'Design an order fulfilment system for a peak day.',
          'How do you decide between building vs buying at scale?',
        ],
        interviewers: [
          {
            name: 'Naomi Grant',
            role: 'Principal Engineer (Bar Raiser)',
            personality: 'Tests judgment and leadership principles under pressure',
            style: 'Panel deep-dive',
            focusAreas: ['Judgment', 'Distributed Systems'],
          },
          {
            name: 'Diego Fuentes',
            role: 'SDE III',
            personality: 'Supportive but thorough',
            style: 'Panel',
            focusAreas: ['Operational Excellence'],
          },
        ],
      },
    ],
  },
  {
    id: 'ds-stripe-payments',
    company: 'Stripe',
    role: 'Payments Infrastructure Engineer',
    level: 'Senior',
    difficulty: 'Hard',
    evaluationAreas: ['Correctness', 'Distributed Transactions', 'API Design'],
    rounds: [
      {
        name: 'Recruiter Screen',
        type: 'RECRUITER',
        durationMinutes: 30,
        focusAreas: ['Background', 'Mission alignment'],
        sampleQuestions: [
          'Why payments, and why Stripe?',
          'Tell me about a system you built that required extreme correctness.',
        ],
        interviewers: [
          {
            name: 'Jess Kim',
            role: 'Technical Recruiter',
            personality: 'Sharp, commerce-savvy',
            style: 'Conversational',
            focusAreas: ['Mission', 'Correctness mindset'],
          },
        ],
      },
      {
        name: 'System Design: Payment Gateway',
        type: 'TECHNICAL',
        durationMinutes: 60,
        focusAreas: ['Idempotency', 'Deadlock prevention', 'At-least-once delivery'],
        sampleQuestions: [
          'Design a payment gateway that must never lose an order at 50k req/sec.',
          'How do you handle idempotency keys and retries without double charging?',
        ],
        interviewers: [
          {
            name: 'Marcus Vance',
            role: 'Staff Engineer',
            personality: 'Precise, probes transaction isolation and failure recovery',
            style: 'Deep technical',
            focusAreas: ['Idempotency', 'Transactions'],
          },
        ],
      },
      {
        name: 'Hiring Manager',
        type: 'HIRING_MANAGER',
        durationMinutes: 45,
        focusAreas: ['Ownership', 'Incident response'],
        sampleQuestions: [
          'Walk me through a production incident you owned end to end.',
          'How do you decide when to fix technical debt vs ship features?',
        ],
        interviewers: [
          {
            name: 'Elena Ross',
            role: 'Engineering Manager',
            personality: 'Strategic, evaluates operational maturity',
            style: 'Behavioral',
            focusAreas: ['Incident Ownership', 'Prioritization'],
          },
        ],
      },
    ],
  },
  {
    id: 'ds-general-swe',
    company: 'General',
    role: 'Software Engineer',
    level: 'Mid-Senior',
    difficulty: 'Medium',
    evaluationAreas: ['Technical Depth', 'Problem Solving', 'Communication'],
    rounds: [
      {
        name: 'Intro & Experience',
        type: 'RECRUITER',
        durationMinutes: 30,
        focusAreas: ['Experience', 'Projects'],
        sampleQuestions: [
          'Tell me about yourself and your strongest project.',
          'What kind of role and company are you targeting?',
        ],
        interviewers: [
          {
            name: 'Alex Rivera',
            role: 'Recruiter',
            personality: 'Friendly and structured',
            style: 'Conversational',
            focusAreas: ['Background'],
          },
        ],
      },
      {
        name: 'Technical Deep-Dive',
        type: 'TECHNICAL',
        durationMinutes: 45,
        focusAreas: ['Architecture', 'Scale', 'Databases'],
        sampleQuestions: [
          'Describe the architecture of a system you built — where did it break?',
          'How would you scale a relational database that is hitting its limits?',
        ],
        interviewers: [
          {
            name: 'Sam Chen',
            role: 'Staff Engineer',
            personality: 'Curious, analytical',
            style: 'Deep-dive',
            focusAreas: ['Architecture', 'Trade-offs'],
          },
        ],
      },
      {
        name: 'Hiring Manager',
        type: 'HIRING_MANAGER',
        durationMinutes: 30,
        focusAreas: ['Teamwork', 'Growth'],
        sampleQuestions: [
          'How do you handle ambiguity on a new team?',
          'What do you want to learn next in your career?',
        ],
        interviewers: [
          {
            name: 'Robin Patel',
            role: 'Engineering Manager',
            personality: 'Supportive, growth-oriented',
            style: 'Behavioral',
            focusAreas: ['Growth', 'Teamwork'],
          },
        ],
      },
    ],
  },
];

const normalize = (s: string) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

function roleMatches(entry: DatasetExperience, company: string, role: string): boolean {
  const companyMatch = !company || company.toLowerCase() === 'general' || normalize(entry.company).includes(normalize(company).split(' ')[0]) || normalize(company).includes(normalize(entry.company).split(' ')[0]);
  const tokens = normalize(role).split(' ');
  const roleText = normalize(entry.role) + ' ' + normalize(entry.level);
  const roleMatch = tokens.every((t) => t.length > 2 && roleText.includes(t)) || tokens.some((t) => ['sde', 'swe', 'engineer', 'developer'].includes(t) && roleText.includes(t));
  return companyMatch && roleMatch;
}

export function findDatasetInterview(company: string, role: string): DatasetExperience | null {
  const q = { company: company || '', role: role || '' };
  const direct = INTERVIEW_DATASET.find((e) => roleMatches(e, q.company, q.role));
  if (direct) return direct;
  // fall back to company-only match, then general
  const byCompany = INTERVIEW_DATASET.find((e) => e.id === 'ds-general-swe' ? false : normalize(e.company).includes(normalize(q.company).split(' ')[0]) || normalize(q.company).includes(normalize(e.company).split(' ')[0]));
  if (byCompany) return byCompany;
  return INTERVIEW_DATASET.find((e) => e.id === 'ds-general-swe') || null;
}
