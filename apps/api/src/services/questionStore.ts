import { INITIAL_COMMUNITY_FEED } from "../data/seedFeed.js";
import { feedStore } from "./feedStore.js";
import { SeedExperience } from "../data/seedFeed.js";

export interface BankQuestion {
  id: string;
  text: string;
  source: "seed" | "experience" | "template";
  company?: string;
  role?: string;
  up: number;
  down: number;
}

const store: BankQuestion[] = [];
const seen = new Map<string, BankQuestion>(); // normalized text -> question

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function findSeededQuestions(
  exp: SeedExperience,
  source: "seed" | "experience",
) {
  for (const round of exp.rounds || []) {
    for (const q of round.sampleQuestions || []) {
      indexQuestion(q, source, exp.company, exp.role);
    }
  }
}

export function indexQuestion(
  text: string,
  source: BankQuestion["source"],
  company?: string,
  role?: string,
): BankQuestion {
  if (!text || typeof text !== "string") {
    const dummy: BankQuestion = {
      id: "q-empty",
      text: "",
      source,
      up: 0,
      down: 0,
    };
    return dummy;
  }
  const key = normalize(text);
  if (!key) {
    const dummy: BankQuestion = {
      id: "q-empty",
      text: "",
      source,
      up: 0,
      down: 0,
    };
    return dummy;
  }
  const existing = seen.get(key);
  if (existing) {
    if (!existing.company && company) existing.company = company;
    if (!existing.role && role) existing.role = role;
    return existing;
  }
  const q: BankQuestion = {
    id: `q-${store.length + 1}-${Date.now()}`,
    text: text.trim(),
    source,
    company,
    role,
    up: 0,
    down: 0,
  };
  store.push(q);
  seen.set(key, q);
  return q;
}

export function seedQuestionBank() {
  for (const exp of INITIAL_COMMUNITY_FEED) {
    findSeededQuestions(exp, "seed");
  }
  for (const exp of feedStore) {
    findSeededQuestions(exp, "experience");
  }
}

export function indexExperienceQuestions(exp: SeedExperience) {
  findSeededQuestions(exp, "experience");
}

export function indexQuestionsFromLists(
  questions: string[],
  source: BankQuestion["source"],
  company?: string,
  role?: string,
) {
  for (const q of questions || []) indexQuestion(q, source, company, role);
}

export function searchQuestions(params: {
  q?: string;
  company?: string;
  limit?: number;
}): BankQuestion[] {
  const query = (params.q || "").trim().toLowerCase();
  const company = (params.company || "").trim().toLowerCase();
  let results = store;
  if (company) {
    results = results.filter((q) =>
      (q.company || "").toLowerCase().includes(company),
    );
  }
  if (query) {
    results = results.filter(
      (q) =>
        q.text.toLowerCase().includes(query) ||
        (q.company || "").toLowerCase().includes(query) ||
        (q.role || "").toLowerCase().includes(query),
    );
  }
  return results
    .slice()
    .sort((a, b) => b.up - b.down - (a.up - a.down))
    .slice(0, params.limit || 25);
}

export function voteQuestionByText(
  text: string,
  dir: 1 | -1,
): BankQuestion | null {
  const key = normalize(text);
  if (!key) return null;
  let q = seen.get(key);
  if (!q) {
    q = indexQuestion(text.trim(), "experience");
  }
  if (dir === 1) q.up += 1;
  else if (dir === -1) q.down += 1;
  return q;
}

export function voteQuestionById(id: string, dir: 1 | -1): BankQuestion | null {
  const q = store.find((x) => x.id === id);
  if (!q) return null;
  if (dir === 1) q.up += 1;
  else if (dir === -1) q.down += 1;
  return q;
}

export function getQuestionVotesByText(text: string): {
  up: number;
  down: number;
} {
  const q = seen.get(normalize(text));
  return q ? { up: q.up, down: q.down } : { up: 0, down: 0 };
}

// Seed once on import
seedQuestionBank();
