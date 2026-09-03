# Implementation Plan - Realistic AI Interview Simulator + Interview Feed

Build a realistic, company-specific AI Interview Simulator with dynamic multi-round interviewer personas and Google Meet-style Agora RTC video/audio room, paired with an AI-processed Community Interview Feed dataset flywheel.

## User Review Required

> [!IMPORTANT]
> **Agora Real-time SDK Integration**: The solution uses Agora Web RTC (`agora-rtc-sdk-ng`) for real-time audio/video streaming, participant tiles, and speaking/listening indicator synthesis in the live interview room. An Agora App ID can be configured in `.env` (defaults to a sandbox key with clean fallback for offline/local development).

> [!NOTE]
> **AI Orchestration & LLM Fallback**: The Interview Orchestrator service handles natural conversation, follow-up generation, persona switching, and evaluations. It integrates with OpenAI/Gemini APIs when `OPENAI_API_KEY` is present, and includes a realistic rule-based conversation engine fallback for local demo environments.

---

## Proposed Changes

### Database & Backend API (`apps/api`)

#### [MODIFY] [contract.prisma](file:///e:/Projects/Malevolent/apps/api/src/prisma/contract.prisma)
- Add database models for `InterviewExperience` (community feed items), `InterviewSession` (simulations), `InterviewRound`, `InterviewerPersona`, and `ContributionDraft`.

#### [MODIFY] [package.json](file:///e:/Projects/Malevolent/apps/api/package.json)
- Add `cors`, `@types/cors`, `agora-token`, and `tsx` dev dependency for watching and running Express server.

#### [NEW] [server.ts](file:///e:/Projects/Malevolent/apps/api/src/server.ts) / [app.ts](file:///e:/Projects/Malevolent/apps/api/src/app.ts)
- Implement Express REST server endpoints:
  - `GET /api/feed` & `GET /api/feed/:id`: Fetch community interview experiences with search/filters.
  - `POST /api/feed/parse`: Parse raw text experience into structured AI rounds & questions.
  - `POST /api/feed/publish`: Confirm and publish user contribution to feed.
  - `POST /api/interviews/create`: Create a simulation session and blueprint based on company, role, resume, github, and community feed data.
  - `GET /api/interviews/:id`: Fetch simulation session state, current round, personas, transcripts.
  - `POST /api/interviews/:id/agora-token`: Generate Agora RTC tokens for candidate and interviewer room.
  - `POST /api/interviews/:id/interact`: Process candidate audio transcript/input, calculate adaptive follow-up, switch personas, or advance rounds.
  - `POST /api/interviews/:id/evaluate`: Generate multi-faceted scorecard evaluation (technical depth, problem solving, communication, strengths/weaknesses, pass/fail).

#### [NEW] [orchestrator.ts](file:///e:/Projects/Malevolent/apps/api/src/services/orchestrator.ts)
- Implementation of the **Interview Orchestrator**:
  - Dynamically builds interview blueprints (Recruiter, Technical, Panel, Hiring Manager, Coding rounds) matching company/role data.
  - Generates interviewer personas (name, role, avatar, personality, style, focus areas).
  - Handles adaptive conversation flow (greeting -> small talk -> resume/github project deep-dive -> technical questions -> follow-up probing -> closing).

---

### Next.js Frontend Application (`apps/frontend`)

#### [MODIFY] [package.json](file:///e:/Projects/Malevolent/apps/frontend/package.json)
- Add `agora-rtc-sdk-ng`, `lucide-react`, and canvas-confetti.

#### [MODIFY] [page.tsx](file:///e:/Projects/Malevolent/apps/frontend/app/page.tsx)
- Redesign Homepage:
  - Modern hero section with Aceternity Sparkles background and company/role search.
  - Interactive Simulator & Feed widget preview.
  - Bento grid showcasing Agora AI Interviewers, persona switching, and feed dataset flywheel.
  - How it works timeline & call-to-action buttons.

#### [MODIFY] [Navbar.tsx](file:///e:/Projects/Malevolent/apps/frontend/components/Navbar.tsx)
- Update navigation links (Feed, Simulator, Contribute) and action buttons.

#### [NEW] [app/simulator/page.tsx](file:///e:/Projects/Malevolent/apps/frontend/app/simulator/page.tsx)
- Candidate Setup Flow:
  - Input Company & Role.
  - Optional Job Description link/text.
  - Resume input (file/text paste).
  - GitHub profile/repo link.
  - AI Blueprint Generation preview showing created rounds & interviewer personas before entering.

#### [NEW] [app/interview/[id]/page.tsx](file:///e:/Projects/Malevolent/apps/frontend/app/interview/[id]/page.tsx)
- **Agora Live Interview Room**:
  - Google Meet / modern video software design.
  - Candidate live webcam feed (Agora RTC).
  - Main AI Interviewer video/avatar tile with dynamic audio wave animation for speaking/listening states.
  - Support for multi-interviewer panel tiles.
  - Header: Round title, Company, Timer, Connection status.
  - Footer toolbar: Mic toggle, Camera toggle, Audio toggle, Transcript drawer, End interview.
  - Voice + text interaction handling with real-time AI responses.

#### [NEW] [app/interview/[id]/report/page.tsx](file:///e:/Projects/Malevolent/apps/frontend/app/interview/[id]/report/page.tsx)
- **Post-Interview Scorecard**:
  - Overall score badge & Pass/Fail recommendation.
  - Radar & metric bars for Technical, Problem Solving, Communication, Behavioral, Role skills.
  - Strengths & Weaknesses breakdowns.
  - Struggled questions & suggested improvement answers.
  - Persona-by-persona feedback notes.

#### [NEW] [app/feed/page.tsx](file:///e:/Projects/Malevolent/apps/frontend/app/feed/page.tsx)
- **Community Interview Feed**:
  - Search by company, role, topic, question.
  - Detailed card view showing interview rounds, difficulty, questions, and evaluation focus.
  - "Practice this interview" button that pre-fills the simulator blueprint!

#### [NEW] [app/feed/contribute/page.tsx](file:///e:/Projects/Malevolent/apps/frontend/app/feed/contribute/page.tsx)
- **Contribution Hub**:
  - Raw experience submission form.
  - Real-time AI processing indicator.
  - Interactive structured review/edit step before publishing.

---

## Verification Plan

### Automated Tests & Type Checks
- Run `npm run check-types` across the Turborepo workspace.
- Run `npx prisma contract emit` in `apps/api` to verify Prisma schema validity.

### Manual Verification
- Test end-to-end flow:
  1. Browse feed and search for experiences.
  2. Contribute a new interview experience, review AI extracted rounds & questions, publish to feed.
  3. Start an Interview Simulation selecting Company, Role, Resume, and GitHub repo.
  4. Launch Agora Live Interview Room, test microphone/camera controls, real-time AI conversation, follow-up questions, and persona transitions.
  5. Finish interview and view comprehensive evaluation report.
