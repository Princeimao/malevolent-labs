# Agora Interview — AI Interview Simulator Platform

A platform where candidates **practice the interview they're actually preparing for** — real, multi-round, live-video interviews run by adaptive AI interviewers — and where contributors **build and share** those interviews with the community.

## What it does

### For candidates
- **Give an interview from a job description** — paste any JD plus company + role, and the AI builds a matching multi-round interview for you (no public interview needed).
- **Round-by-round progression** — like a real loop, you pass a round to unlock the next one, or get honest feedback on what to improve.
- **Live voice/video interviews** — join an Agora RTC room and talk directly to AI interviewer agents powered by Google Gemini (each agent has its own name, role, personality, and system prompt).
- **Personal preparation goals** — e.g. "prepare for Google SDE". The AI generates the whole structure (how many rounds, what each covers, who interviews) and tracks your progress.
- **Scorecards** — AI hiring-committee evaluation with per-metric feedback, strengths/weaknesses, and round-by-round verdicts.
- **Share your passed interview** to the community feed (optional, with permission) so others can practice the same loop.

### For contributors
Two contributor roles (opt-in from the header — candidates stay focused on practicing):
- **Interview Creator** — creates interviewer agents (system prompts, personality, behavior), assembles interview loops round-by-round (with searchable questions from the community question database), and publishes them publicly. The best loops rise to the top through community up/down votes and ratings.
- **Experience Sharer** — writes a full rich-text story of a real interview (format, duration, how it felt, how many people sat in, every question remembered) using a structured editor, and publishes it to the feed with comments and voting. Shared questions feed the community question database.

## Monorepo layout

```
apps/
  frontend   Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui
  api        Express 5 + TypeScript REST API
```

Managed with **Turborepo** (npm workspaces).

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI style) |
| Motion / UI | motion (Framer Motion), Aceternity-style three.js globe, lucide icons |
| State | Redux Toolkit, react-hook-form + zod |
| Backend | Node.js, Express 5, TypeScript |
| AI | Google Gemini (`@google/genai`) — structure generation, adaptive interviewer replies, evaluation, experience parsing |
| Live video/voice | Agora RTC (Web SDK) + Agora Conversational AI Agents (Agent Tools) |
| Data | Prisma 8 / ORM contract (PostgreSQL) with in-memory fallback + curated interview dataset; seeding on boot |
| Community | votes, comments, ratings, question database (in-memory stores) |

## Getting started

```bash
npm install

# API (http://localhost:5000)
cd apps/api
cp .env.example .env    # add GEMINI_API_KEY + Agora keys (see below)
npm run dev

# Frontend (http://localhost:3000)
cd apps/frontend
npm run dev
```

### Environment (`.env` in `apps/api`)
- `GEMINI_API_KEY` — turns every generation (goals, quick interviews, replies, scorecards, parsing) from heuristic to **real LLM**.
- `AGORA_APP_ID` + `AGORA_APP_CERTIFICATE` — signs RTC tokens for live rooms.
- `AGORA_CUSTOMER_ID` + `AGORA_CUSTOMER_SECRET` — enables **live voice interviewers** via the Agora Conversational AI Agents REST API (agents join the room and talk to you directly). Without these, agents run in a simulated/dev mode.
- `DATABASE_URL` — optional PostgreSQL; without it the API runs on in-memory stores seeded from the curated dataset.
- `JWT_SECRET` — auth signing key.

## Key flows

1. **Onboard** (email + password, no OAuth) → set role, experience, target company/role, interview types.
2. **Candidate**: create a goal or paste a JD → AI shows the structure → start round 1 → talk to AI interviewers in the live room → pass rounds to progress → get your scorecard → optionally share to the feed.
3. **Contributor**: enable from the header → build agents & publish interviews, or write your experience story → the community practices, votes, rates, and comments.

> Interview data is curated/dataset + contributor-driven today; a live web scraper can be swapped in behind the dataset lookup without touching the rest of the system.
