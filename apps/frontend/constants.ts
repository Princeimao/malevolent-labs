import {
  Video,
  UserCheck,
  Brain,
  TrendingUp,
  Award,
  ShieldCheck,
  Building2,
  Code2,
  LineChart,
  Mic,
} from "lucide-react";

export const PLATFORM_NAME = "Agora Interview";
export const PLATFORM_TAGLINE =
  "Practice the interview you're actually preparing for.";

export const navigationData = [
  {
    title: "Simulator",
    href: "/simulator",
  },
  {
    title: "Community Feed",
    href: "/feed",
  },
  {
    title: "Contribute",
    href: "/feed/contribute",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
  },
];

export const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Simulator", href: "/simulator" },
  { label: "Community Feed", href: "/feed" },
  { label: "Contribute Experience", href: "/feed/contribute" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Sign In", href: "/login" },
  { label: "Create Account", href: "/signup" },
  { label: "Get Onboarded", href: "/onboarding" },
];

export const FAQ_DATA = [
  {
    question: "How does the AI Interview Simulator work?",
    answer:
      "The platform uses community-contributed interview experiences to construct dynamic, company-specific multi-round interview loops. Based on your resume, GitHub, and target role, realistic AI interviewer personas conduct adaptive technical and recruiter rounds in a live video room.",
  },
  {
    question: "What kinds of interviews can I practice?",
    answer:
      "You can practice Recruiter screens, Technical deep-dives, Coding rounds, System Design, Panel interviews, and Hiring Manager rounds. During onboarding you pick the interview types and target roles you care about so your sessions are tailored to the interview you're actually preparing for.",
  },
  {
    question: "Do the interviewers ask static questions?",
    answer:
      "No. The Interview Orchestrator generates adaptive follow-ups based on your answers. If you mention building a payment gateway, it will probe request scale, database deadlock handling, and architectural trade-offs instead of reading a script.",
  },
  {
    question: "Do I need a camera or microphone?",
    answer:
      "Agora RTC powers a real-time video room with webcam and microphone controls, but the simulator also supports audio-only and text answers. You can mute your mic, hide your camera, and still complete a full loop.",
  },
  {
    question: "How does the Community Feed help me prepare?",
    answer:
      "Candidates share real interview notes. Our AI parses them into structured rounds and questions, and after community review the dataset becomes available to practice as realistic simulations. You can browse by company, role, and topic.",
  },
  {
    question: "What happens after I finish a simulation?",
    answer:
      "You receive a comprehensive scorecard with an overall score, pass/fail recommendation, metric breakdowns (technical ability, problem solving, communication, behavioral, role-specific), strengths, weaknesses, struggled questions with suggested answers, and per-round interviewer feedback.",
  },
  {
    question: "Is an account required to use the platform?",
    answer:
      "Yes. Signing up is free and only takes an email and password — no third-party OAuth. After signup you complete a short onboarding so every simulation is personalized to your experience level, current role, and target companies.",
  },
];

export const DATA = [
  {
    id: "1",
    title: "Live Video Interview Room",
    description:
      "Agora RTC-powered video & audio with webcam publishing and mic controls.",
    icon: Video,
  },
  {
    id: "2",
    title: "Multi-Round Personas",
    description:
      "Recruiter, Technical, Panel, and Hiring Manager rounds with distinct styles.",
    icon: UserCheck,
  },
  {
    id: "3",
    title: "Adaptive Probing Engine",
    description:
      "AI probes scale, bottlenecks, deadlocks, and trade-off choices in real time.",
    icon: Brain,
  },
  {
    id: "4",
    title: "Resume & GitHub Context",
    description:
      "Incorporates your projects and repo architecture into every question.",
    icon: Code2,
  },
  {
    id: "5",
    title: "Post-Round Scorecard",
    description:
      "Deep metric breakdowns, struggled-question analysis, and interviewer verdicts.",
    icon: Award,
  },
  {
    id: "6",
    title: "Community Dataset Flywheel",
    description:
      "Real interview loops contributed by candidates, parsed and ready to practice.",
    icon: TrendingUp,
  },
];

export const BENTO_DATA = [
  {
    icon: Mic,
    title: "Live Agora Video Room",
    description:
      "Practice in a real-time video room with webcam publishing, active-speaker detection, and multi-interviewer panel tiles — just like the real thing.",
    gradient: "from-sky-500/20 to-indigo-500/20",
  },
  {
    icon: Building2,
    title: "Company-Specific Loops",
    description:
      "Constructed from real community experiences at Stripe, Google, Meta, and more. Pick your target company and practice the exact style of interview they run.",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: LineChart,
    title: "Detailed Scorecards",
    description:
      "Get an overall score, pass/fail recommendation, and per-metric feedback on technical depth, problem solving, communication, and role-specific skills.",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
];

export const ONBOARDING_OPTIONS = {
  currentRoles: [
    { value: "software-engineer", label: "Software Engineer" },
    { value: "frontend-engineer", label: "Frontend Engineer" },
    { value: "backend-engineer", label: "Backend Engineer" },
    { value: "fullstack-engineer", label: "Full-Stack Engineer" },
    { value: "data-engineer", label: "Data Engineer" },
    { value: "ml-engineer", label: "ML / AI Engineer" },
    { value: "devops-engineer", label: "DevOps / SRE" },
    { value: "student", label: "Student / Fresh Graduate" },
    { value: "job-seeker", label: "Job Seeker" },
    { value: "other", label: "Other" },
  ],
  experienceLevels: [
    { value: "entry", label: "Entry (0–2 years)" },
    { value: "mid", label: "Mid (2–5 years)" },
    { value: "senior", label: "Senior (5–8 years)" },
    { value: "staff", label: "Staff / Principal (8+ years)" },
  ],
  interviewTypes: [
    { value: "recruiter", label: "Recruiter Screen" },
    { value: "behavioral", label: "Behavioral / Leadership" },
    { value: "coding", label: "Coding & Data Structures" },
    { value: "system-design", label: "System Design" },
    { value: "technical-deep-dive", label: "Technical Deep-Dive" },
    { value: "panel", label: "Panel Interview" },
    { value: "hiring-manager", label: "Hiring Manager" },
  ],
  weeklyGoals: [
    { value: "casual", label: "Casual — 1 session a week" },
    { value: "steady", label: "Steady — 2–3 sessions a week" },
    { value: "intense", label: "Intense — 4+ sessions a week" },
  ],
};
