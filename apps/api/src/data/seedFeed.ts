export interface SeedRound {
  name: string;
  type: "RECRUITER" | "TECHNICAL" | "PANEL" | "HIRING_MANAGER" | "CODING";
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
}

export interface SeedExperience {
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
  rounds: SeedRound[];
}

export const INITIAL_COMMUNITY_FEED: SeedExperience[] = [
  {
    id: "stripe-backend-lead",
    company: "Stripe",
    role: "Senior Payments Infrastructure Engineer",
    level: "L5 / Senior",
    summary: "Real interview experience covering idempotent payment APIs, distributed transactions, database deadlock resolution under extreme concurrency, and live coding.",
    difficulty: "Hard",
    topics: ["Distributed Systems", "Database Concurrency", "API Design", "Idempotency"],
    upvotes: 142,
    authorName: "Alex Rivera (ex-Fintech Lead)",
    evaluationAreas: ["System Scalability", "Edge Case Handling", "API Ergonomics", "Communication Clarity"],
    rounds: [
      {
        name: "Recruiter Screen",
        type: "RECRUITER",
        interviewers: [
          {
            name: "Sarah Chen",
            role: "Senior Talent Partner",
            avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
            personality: "Warm, supportive, interested in career velocity and culture alignment",
            style: "Conversational & background-focused",
            focusAreas: ["Career Trajectory", "Motivation for Stripe", "Cross-team Collaboration"]
          }
        ],
        focusAreas: ["Background", "Motivations", "High-level accomplishments"],
        sampleQuestions: [
          "Walk me through your most complex backend project in the past 2 years.",
          "Why Stripe and why payments infrastructure right now?",
          "How do you handle disagreement with product managers on technical debt priority?"
        ]
      },
      {
        name: "System Design & Architecture Round",
        type: "TECHNICAL",
        interviewers: [
          {
            name: "Marcus Vance",
            role: "Staff Infrastructure Engineer",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            personality: "Rigorous, deeply technical, asks sharp follow-ups on latency and fault tolerance",
            style: "Deep-dive inquiry into architectural bottlenecks",
            focusAreas: ["Idempotency Keys", "Distributed Transactions", "Two-Phase Commit vs Saga"]
          }
        ],
        focusAreas: ["Idempotent API Design", "High Availability", "Transaction Rollbacks"],
        sampleQuestions: [
          "Design a payment gateway idempotency system handling 50,000 requests/sec during Black Friday.",
          "What happens when the webhook receiver acknowledges late or twice?",
          "How do you prevent double-spending when database locks time out?"
        ]
      },
      {
        name: "Technical Panel & Code Review",
        type: "PANEL",
        interviewers: [
          {
            name: "Devon Miller",
            role: "Principal Architect",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
            personality: "Analytical, focuses on distributed state, race conditions and observability",
            style: "Challenging assumptions and pushing edge cases",
            focusAreas: ["Distributed Locks", "Metrics & Monitoring", "Failover"]
          },
          {
            name: "Elena Rostova",
            role: "Senior Security Engineer",
            avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
            personality: "Direct, security-minded, meticulous regarding encryption and tokenization",
            style: "Probing risk mitigation and data isolation",
            focusAreas: ["PCI-DSS Isolation", "Key Rotation", "Zero-trust Internal APIs"]
          }
        ],
        focusAreas: ["Panel Cross-examination", "Security & Reliability", "Live Code Walkthrough"],
        sampleQuestions: [
          "How do you isolate PCI compliance data boundaries without adding 50ms of network latency?",
          "Walk us through how you debugged a memory leak or silent data corruption in production."
        ]
      },
      {
        name: "Hiring Manager Alignment",
        type: "HIRING_MANAGER",
        interviewers: [
          {
            name: "David Kim",
            role: "Engineering Director",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
            personality: "Strategic, empathetic, focused on leadership, mentoring and technical vision",
            style: "Behavioral & scenario-based",
            focusAreas: ["Engineering Leadership", "Incident Response Management", "Long-term Technical Strategy"]
          }
        ],
        focusAreas: ["Ownership", "Incident Post-Mortems", "People Leadership"],
        sampleQuestions: [
          "Tell me about a SEV-0 outage you led response for. What were the root causes?",
          "How do you evaluate when to rewrite a core legacy service vs refactoring iteratively?"
        ]
      }
    ]
  },
  {
    id: "google-sr-fullstack",
    company: "Google",
    role: "Senior Full Stack Engineer (Cloud & AI)",
    level: "L5",
    summary: "Multi-round Google interview covering frontend performance (LCP/INP), WebSockets at scale, distributed caching, and leadership principles.",
    difficulty: "Hard",
    topics: ["Next.js/React", "WebSockets", "Large-Scale Frontends", "System Design"],
    upvotes: 98,
    authorName: "Priya Sharma (Staff Engineer)",
    evaluationAreas: ["Frontend Architecture", "State Synchronization", "Problem Solving Speed", "Code Cleanliness"],
    rounds: [
      {
        name: "Technical Screener",
        type: "TECHNICAL",
        interviewers: [
          {
            name: "Liam O'Connor",
            role: "Staff Software Engineer",
            avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
            personality: "Friendly, structured, values clean abstraction boundaries and low memory overhead",
            style: "Problem-solving step-by-step",
            focusAreas: ["DOM Optimization", "Virtual Scroll Engine", "Web Workers"]
          }
        ],
        focusAreas: ["Core JS/TS Internals", "Data Structure Design", "Memory Management"],
        sampleQuestions: [
          "Implement an in-memory priority queue with event listeners for real-time streaming updates.",
          "How would you optimize rendering 100,000 dynamic canvas items at 60 FPS in React?"
        ]
      },
      {
        name: "Full-Stack System Design",
        type: "TECHNICAL",
        interviewers: [
          {
            name: "Anita Patel",
            role: "Principal Full Stack Architect",
            avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
            personality: "Inquisitive, methodical, evaluates end-to-end user latency and cache hit ratios",
            style: "Architectural whiteboarding",
            focusAreas: ["Collaborative Document Editor", "Operational Transformation vs CRDT", "WebSocket Scale"]
          }
        ],
        focusAreas: ["Real-time Sync", "Conflict Free Replicated Data Types", "CDN & Edge Routing"],
        sampleQuestions: [
          "Design Google Docs real-time collaborative cursor positioning & text synchronization.",
          "How do you handle network reconnection when 10,000 clients submit edits at the exact same millisecond?"
        ]
      }
    ]
  },
  {
    id: "openai-ai-systems",
    company: "OpenAI",
    role: "AI Systems & Infrastructure Engineer",
    level: "Member of Technical Staff",
    summary: "Cutting edge technical interview covering high-throughput LLM inference, GPU memory layout, streaming audio/video WebRTC pipelines, and evaluation metrics.",
    difficulty: "Hard",
    topics: ["AI Systems", "WebRTC / Audio Streaming", "GPU Acceleration", "LLM Orchestration"],
    upvotes: 215,
    authorName: "Vikram Mehta",
    evaluationAreas: ["Real-Time Latency", "Model Serving Optimization", "Hardware Intuition", "System Resilience"],
    rounds: [
      {
        name: "Real-Time Streaming Systems",
        type: "TECHNICAL",
        interviewers: [
          {
            name: "Dr. Maya Lin",
            role: "Research Scientist & Systems Lead",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            personality: "Brilliant, direct, eager to discuss low-latency audio packetization and neural TTS",
            style: "Deep tech exploration & boundary testing",
            focusAreas: ["Agora WebRTC Integration", "Audio Buffer Jitter", "Sub-100ms Inference Latency"]
          }
        ],
        focusAreas: ["Streaming Audio/Video Pipeline", "Speculative Decoding", "Quantization"],
        sampleQuestions: [
          "How do you design a zero-buffer audio pipeline connecting Agora RTC Web streams to server-side LLMs?",
          "When a user interrupts an ongoing AI speech stream, how do you handle cancellation without dropping WebSocket frames?"
        ]
      }
    ]
  }
];
