import 'dotenv/config';
import app from './app';
import { db } from './prisma/db';
import { INTERVIEW_DATASET } from './data/interviewDataset';

async function seedDatabase() {
  if (!process.env.DATABASE_URL) return;
  try {
    const existing = await (db as any).orm.public.InterviewExperience.count?.();
    if (existing && existing > 0) return;
  } catch {
    /* table missing — insert attempt below will surface */
  }

  try {
    for (const entry of INTERVIEW_DATASET) {
      const topics = Array.from(new Set(entry.rounds.flatMap((r) => r.focusAreas))).slice(0, 6);
      await (db as any).orm.public.InterviewExperience.insert({
        company: entry.company,
        role: entry.role,
        level: entry.level,
        summary: `Curated ${entry.company} ${entry.role} (${entry.level}) interview plan generated from the interview dataset.`,
        difficulty: entry.difficulty,
        topics: JSON.stringify(topics),
        rounds: JSON.stringify(entry.rounds),
        questions: JSON.stringify(entry.rounds.flatMap((r) => r.sampleQuestions)),
        evaluationAreas: JSON.stringify(entry.evaluationAreas),
        upvotes: 0,
        authorName: 'Agora Dataset',
        isVerified: true,
      });
    }
    console.log(`🌱 Seeded database with ${INTERVIEW_DATASET.length} curated interview plans`);
  } catch (err) {
    console.log('Seed skipped (database not available, using in-memory dataset):', (err as Error).message);
  }
}

const PORT = process.env.PORT || 5000;

seedDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Realistic AI Interview Simulator API running on http://localhost:${PORT}`);
  });
});
