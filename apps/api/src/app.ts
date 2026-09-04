import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./prisma/db";
import { SeedExperience } from "./data/seedFeed";
import {
  InterviewOrchestrator,
  InterviewBlueprint,
  ConversationTurn,
} from "./services/orchestrator";
import { generateAgoraToken } from "./services/agoraService";
import { requireAuth, getTokenUser, JWT_SECRET } from "./middleware";
import { registerPlatformRoutes } from "./platform";
import * as ai from "./services/aiService";
import {
  feedStore,
  getFeedEngagement,
  getFeedComments,
  voteFeedExperience,
  addFeedComment,
} from "./services/feedStore";
import {
  searchQuestions,
  voteQuestionByText,
  voteQuestionById,
  indexExperienceQuestions,
} from "./services/questionStore";
import morgan from "morgan";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// In-memory fallback cache when PostgreSQL is initializing or running locally
const localSessionStore: Record<string, any> = {};
const localUserStore: Record<
  string,
  {
    id: number;
    email: string;
    name: string;
    passwordHash: string;
    currentRole?: string;
    targetCompany?: string;
    targetRole?: string;
    interviewTypes?: string[];
    experienceLevel?: string;
    weeklyGoal?: string;
    isOnboarded?: boolean;
    isContributor?: boolean;
    contributorType?: "creator" | "sharer" | null;
  }
> = {
  "demo@example.com": {
    id: 1,
    email: "demo@example.com",
    name: "Demo Candidate",
    passwordHash: bcrypt.hashSync("password123", 10),
    currentRole: "Software Engineer",
    targetCompany: "Stripe",
    targetRole: "Senior Payments Infrastructure Engineer",
    interviewTypes: ["System Design", "Concurrency"],
    experienceLevel: "Mid-Senior",
    isOnboarded: true,
    isContributor: false,
    contributorType: null,
  },
};

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Realistic AI Interview Simulator API",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 0. Authentication & Onboarding Endpoints
 */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let userId = Date.now();
    let userName = name || email.split("@")[0];

    try {
      const existing = await db.orm.public.User.where({ email }).first();
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "User with this email already exists",
        });
      }

      const newUser = await db.orm.public.User.create({
        email,
        passwordHash,
        name: userName,
        isOnboarded: false,
      });
      userId = newUser.id;
    } catch (dbErr) {
      if (localUserStore[email]) {
        return res.status(400).json({
          success: false,
          error: "User with this email already exists",
        });
      }
      localUserStore[email] = {
        id: userId,
        email,
        name: userName,
        passwordHash,
        isOnboarded: false,
      };
    }

    const accessToken = jwt.sign(
      { id: userId, email, name: userName },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    const refreshToken = jwt.sign(
      { id: userId, email, name: userName, type: "refresh" },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: { id: userId, email, name: userName, isOnboarded: false },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    }

    let foundUser: any = null;

    try {
      const dbUser = await db.orm.public.User.where({ email }).first();
      if (dbUser) {
        foundUser = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || dbUser.email.split("@")[0],
          passwordHash: dbUser.passwordHash,
          currentRole: dbUser.currentRole || undefined,
          targetCompany: dbUser.targetCompany || undefined,
          targetRole: dbUser.targetRole || undefined,
          interviewTypes: dbUser.interviewTypes
            ? JSON.parse(dbUser.interviewTypes)
            : [],
          experienceLevel: dbUser.experienceLevel || undefined,
          weeklyGoal: (dbUser as any).weeklyGoal || undefined,
          isContributor: (dbUser as any).isContributor ?? false,
          contributorType: (dbUser as any).contributorType || null,
          isOnboarded: dbUser.isOnboarded ?? false,
        };
      }
    } catch (dbErr) {
      foundUser = localUserStore[email] || null;
    }

    if (!foundUser) {
      foundUser = localUserStore[email] || null;
    }

    if (!foundUser) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const accessToken = jwt.sign(
      { id: foundUser.id, email: foundUser.email, name: foundUser.name },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    const refreshToken = jwt.sign(
      {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        type: "refresh",
      },
      JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );

    res.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        currentRole: foundUser.currentRole,
        targetCompany: foundUser.targetCompany,
        targetRole: foundUser.targetRole,
        interviewTypes: foundUser.interviewTypes,
        experienceLevel: foundUser.experienceLevel,
        weeklyGoal: foundUser.weeklyGoal,
        isContributor: foundUser.isContributor ?? false,
        contributorType: foundUser.contributorType ?? null,
        isOnboarded: foundUser.isOnboarded ?? false,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/auth/refresh", (req, res) => {
  try {
    const refreshTokenInput =
      req.body.refreshToken ||
      req.headers.authorization?.replace("Bearer ", "");
    if (!refreshTokenInput) {
      return res
        .status(401)
        .json({ success: false, error: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshTokenInput, JWT_SECRET) as any;
    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, name: decoded.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        type: "refresh",
      },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err: any) {
    res.status(401).json({ success: false, error: "Invalid refresh token" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, error: "No authorization token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    let userDetails: any = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      isOnboarded: false,
      isContributor: false,
      contributorType: null,
    };

    try {
      const dbUser = await db.orm.public.User.where({
        email: decoded.email,
      }).first();
      const local = localUserStore[decoded.email];
      if (dbUser) {
        userDetails = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || decoded.name,
          currentRole: dbUser.currentRole || local?.currentRole || undefined,
          targetCompany:
            dbUser.targetCompany || local?.targetCompany || undefined,
          targetRole: dbUser.targetRole || local?.targetRole || undefined,
          interviewTypes: dbUser.interviewTypes
            ? JSON.parse(dbUser.interviewTypes)
            : local?.interviewTypes || [],
          experienceLevel:
            dbUser.experienceLevel || local?.experienceLevel || undefined,
          weeklyGoal:
            (dbUser as any).weeklyGoal || local?.weeklyGoal || undefined,
          isContributor:
            (dbUser as any).isContributor || local?.isContributor || false,
          contributorType:
            (dbUser as any).contributorType || local?.contributorType || null,
          isOnboarded: dbUser.isOnboarded ?? local?.isOnboarded ?? false,
        };
      } else if (local) {
        userDetails = {
          id: local.id,
          email: local.email,
          name: local.name,
          currentRole: local.currentRole,
          targetCompany: local.targetCompany,
          targetRole: local.targetRole,
          interviewTypes: local.interviewTypes,
          experienceLevel: local.experienceLevel,
          weeklyGoal: local.weeklyGoal,
          isContributor: local.isContributor ?? false,
          contributorType: local.contributorType ?? null,
          isOnboarded: local.isOnboarded ?? false,
        };
      }
    } catch (e) {
      if (localUserStore[decoded.email]) {
        const u = localUserStore[decoded.email];
        userDetails = {
          id: u.id,
          email: u.email,
          name: u.name,
          currentRole: u.currentRole,
          targetCompany: u.targetCompany,
          targetRole: u.targetRole,
          interviewTypes: u.interviewTypes,
          experienceLevel: u.experienceLevel,
          weeklyGoal: u.weeklyGoal,
          isContributor: u.isContributor ?? false,
          contributorType: u.contributorType ?? null,
          isOnboarded: u.isOnboarded ?? false,
        };
      }
    }

    res.json({
      success: true,
      user: userDetails,
    });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired authentication token",
    });
  }
});

app.post("/api/auth/onboarding", requireAuth, async (req, res) => {
  try {
    const decoded = (req as any).user;

    const {
      currentRole,
      targetCompany,
      targetRole,
      interviewTypes,
      experienceLevel,
      weeklyGoal,
    } = req.body;

    let updatedUser: any = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      currentRole: currentRole || "Software Engineer",
      targetCompany: targetCompany || "Tech Company",
      targetRole: targetRole || "Software Engineer",
      interviewTypes: interviewTypes || ["System Design", "Coding"],
      experienceLevel: experienceLevel || "Mid-Senior",
      weeklyGoal: weeklyGoal || "steady",
      isOnboarded: true,
    };

    try {
      const dbUser = await db.orm.public.User.where({
        email: decoded.email,
      }).first();
      if (dbUser) {
        await db.orm.public.User.where({ id: dbUser.id }).update({
          currentRole: updatedUser.currentRole,
          targetCompany: updatedUser.targetCompany,
          targetRole: updatedUser.targetRole,
          interviewTypes: JSON.stringify(updatedUser.interviewTypes),
          experienceLevel: updatedUser.experienceLevel,
          isOnboarded: true,
        });
      }
    } catch (dbErr) {
      if (localUserStore[decoded.email]) {
        localUserStore[decoded.email] = {
          ...localUserStore[decoded.email],
          ...updatedUser,
        };
      }
    }

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Contributor mode toggle.
 * Candidates stay focused on practicing; opting in as a contributor unlocks the
 * full studio. Types: 'creator' (builds public interviews with agents) or
 * 'sharer' (shares real experiences). Passing 'none' disables contributor mode.
 */
app.post("/api/auth/contributor", requireAuth, async (req, res) => {
  try {
    const decoded = (req as any).user;
    const { type } = req.body || {};
    const enabled = type === "creator" || type === "sharer" || type === "both";
    const contributorType = enabled ? type : null;

    // 1. Try DB update if user exists in database
    try {
      const dbUser = await db.orm.public.User.where({
        email: decoded.email,
      }).first();
      if (dbUser) {
        await db.orm.public.User.where({ id: dbUser.id }).update({
          isContributor: enabled,
          contributorType,
        });
      }
    } catch (dbErr) {
      // Fallback if DB table columns do not exist
    }

    // 2. Persist in in-memory localUserStore (create if missing)
    const existingLocal = localUserStore[decoded.email] || {};
    const updatedLocal = {
      isOnboarded: true,
      ...existingLocal,
      isContributor: enabled,
      contributorType,
    };
    localUserStore[decoded.email] = updatedLocal;

    res.json({
      success: true,
      user: updatedLocal,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Protected routes — the feed, contribution pipeline, and interview simulator
 * all require a valid JWT (email + password auth only, no OAuth).
 */
app.use(["/api/feed", "/api/interviews", "/api/questions"], requireAuth);

/**
 * 1. Community Interview Feed Endpoints
 */
app.get("/api/feed", async (req, res) => {
  try {
    const { company, role, topic, query } = req.query;

    let items: SeedExperience[] = [...feedStore];

    try {
      // Attempt DB query if table exists
      const dbItems = await db.orm.public.InterviewExperience.all();
      if (dbItems && dbItems.length > 0) {
        items = dbItems.map((item: any) => ({
          id: item.id,
          company: item.company,
          role: item.role,
          level: item.level || "Mid-Senior",
          summary: item.summary || "",
          difficulty: (item.difficulty as any) || "Medium",
          topics: JSON.parse(item.topics || "[]"),
          upvotes: item.upvotes || 0,
          authorName: item.authorName || "Anonymous",
          evaluationAreas: JSON.parse(item.evaluationAreas || "[]"),
          rounds: JSON.parse(item.rounds || "[]"),
        }));
      }
    } catch (dbErr) {
      console.log("Using local feed store fallback");
    }

    if (company && typeof company === "string") {
      items = items.filter((i) =>
        i.company.toLowerCase().includes(company.toLowerCase()),
      );
    }
    if (role && typeof role === "string") {
      items = items.filter((i) =>
        i.role.toLowerCase().includes(role.toLowerCase()),
      );
    }
    if (topic && typeof topic === "string") {
      items = items.filter((i) =>
        i.topics.some((t) => t.toLowerCase().includes(topic.toLowerCase())),
      );
    }
    if (query && typeof query === "string") {
      const q = query.toLowerCase();
      items = items.filter(
        (i) =>
          i.company.toLowerCase().includes(q) ||
          i.role.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          i.topics.some((t) => t.toLowerCase().includes(q)),
      );
    }

    res.json({
      success: true,
      count: items.length,
      feed: items.map((i) => ({ ...i, engagement: getFeedEngagement(i.id) })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/feed/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let item = feedStore.find((i) => i.id === id);

    if (!item) {
      try {
        const dbItem = await db.orm.public.InterviewExperience.where({
          id,
        }).first();
        if (dbItem) {
          item = {
            id: dbItem.id,
            company: dbItem.company,
            role: dbItem.role,
            level: dbItem.level || "Mid-Senior",
            summary: dbItem.summary || "",
            difficulty: (dbItem.difficulty as any) || "Medium",
            topics: JSON.parse(dbItem.topics || "[]"),
            upvotes: dbItem.upvotes || 0,
            authorName: dbItem.authorName || "Anonymous",
            evaluationAreas: JSON.parse(dbItem.evaluationAreas || "[]"),
            rounds: JSON.parse(dbItem.rounds || "[]"),
          };
        }
      } catch (e) {
        // Fallback
      }
    }

    if (!item) {
      return res
        .status(404)
        .json({ success: false, error: "Experience not found" });
    }

    res.json({
      success: true,
      experience: {
        ...item,
        engagement: getFeedEngagement(item.id),
        storyHtml: (item as any).storyHtml || null,
        durationMinutes: (item as any).durationMinutes || null,
        feel: (item as any).feel || null,
        format: (item as any).format || "written",
      },
      comments: getFeedComments(item.id),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- Question database ------------------------------------------------------

app.get("/api/questions", (req, res) => {
  const { q, company } = req.query;
  res.json({
    success: true,
    questions: searchQuestions({ q: q as string, company: company as string }),
  });
});

app.post("/api/questions/vote", (req, res) => {
  const { text, dir } = req.body || {};
  if (!text)
    return res
      .status(400)
      .json({ success: false, error: "Question text required" });
  if (dir !== 1 && dir !== -1)
    return res
      .status(400)
      .json({ success: false, error: "dir must be 1 or -1" });
  const q = voteQuestionByText(String(text), dir as 1 | -1);
  res.json({ success: true, question: q });
});

app.post("/api/questions/:id/vote", (req, res) => {
  const { dir } = req.body || {};
  if (dir !== 1 && dir !== -1)
    return res
      .status(400)
      .json({ success: false, error: "dir must be 1 or -1" });
  const q = voteQuestionById(req.params.id, dir as 1 | -1);
  if (!q)
    return res
      .status(404)
      .json({ success: false, error: "Question not found" });
  res.json({ success: true, question: q });
});

app.post("/api/feed/:id/vote", (req, res) => {
  const user = getTokenUser(req);
  const userId = user?.id ? String(user.id) : user?.email || "anonymous";
  const { dir } = req.body || {};
  const item = feedStore.find((i) => i.id === req.params.id);
  if (!item)
    return res
      .status(404)
      .json({ success: false, error: "Experience not found" });
  if (dir !== 1 && dir !== -1) {
    return res
      .status(400)
      .json({ success: false, error: "dir must be 1 (up) or -1 (down)" });
  }
  const tally = voteFeedExperience(item.id, dir as 1 | -1, userId);
  res.json({
    success: true,
    engagement: { ...tally, commentCount: getFeedComments(item.id).length },
  });
});

app.post("/api/feed/:id/comments", (req, res) => {
  const user = getTokenUser(req);
  const item = feedStore.find((i) => i.id === req.params.id);
  if (!item)
    return res
      .status(404)
      .json({ success: false, error: "Experience not found" });
  const { text } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "Comment text is required" });
  }
  const comment = addFeedComment(
    item.id,
    user?.name || "Anonymous",
    text.trim(),
  );
  res.json({ success: true, comment, comments: getFeedComments(item.id) });
});

app.post("/api/feed/parse", async (req, res) => {
  try {
    const { rawContent } = req.body;
    if (!rawContent || typeof rawContent !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "rawContent is required" });
    }

    // LLM-first: parse the raw experience with Gemini, fall back to the heuristic.
    const aiParsed = await ai.parseExperience(rawContent);
    if (aiParsed) {
      return res.json({ success: true, parsedData: aiParsed, ai: true });
    }

    // AI Parsing Logic Simulation
    const lower = rawContent.toLowerCase();
    let company = "Tech Company";
    let role = "Software Engineer";

    if (lower.includes("google")) company = "Google";
    else if (lower.includes("stripe")) company = "Stripe";
    else if (lower.includes("meta") || lower.includes("facebook"))
      company = "Meta";
    else if (lower.includes("amazon") || lower.includes("aws"))
      company = "Amazon";
    else if (lower.includes("apple")) company = "Apple";
    else if (lower.includes("netflix")) company = "Netflix";

    if (lower.includes("frontend") || lower.includes("react"))
      role = "Frontend Engineer";
    else if (lower.includes("backend") || lower.includes("distributed"))
      role = "Backend Infrastructure Engineer";
    else if (lower.includes("fullstack") || lower.includes("full stack"))
      role = "Full Stack Engineer";
    else if (lower.includes("ai") || lower.includes("ml"))
      role = "AI Systems Engineer";

    const parsedData = {
      company,
      role,
      level: "Mid-Senior Engineer",
      summary: rawContent.slice(0, 180) + "...",
      difficulty: lower.includes("hard")
        ? "Hard"
        : lower.includes("easy")
          ? "Easy"
          : "Medium",
      topics: ["System Design", "Concurrency", "Algorithms", "API Design"],
      evaluationAreas: [
        "Technical Depth",
        "Architecture",
        "Problem Solving",
        "Communication",
      ],
      rounds: [
        {
          name: "Recruiter Screen",
          type: "RECRUITER",
          interviewers: [
            {
              name: "Jessica Vance",
              role: "Talent Acquisition",
              avatarUrl:
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
              personality: "Supportive & structured",
              style: "Behavioral & background focus",
              focusAreas: ["Background", "Motivations"],
            },
          ],
          focusAreas: ["Background & Motivations"],
          sampleQuestions: [
            "Tell me about yourself and your technical projects.",
            "Why do you want to join our team?",
          ],
        },
        {
          name: "System Design & Code Review",
          type: "TECHNICAL",
          interviewers: [
            {
              name: "Daniel Kim",
              role: "Staff Engineer",
              avatarUrl:
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
              personality: "Deeply technical & analytical",
              style: "Deep-dive architectural whiteboarding",
              focusAreas: ["Scalability", "Fault Tolerance"],
            },
          ],
          focusAreas: [
            "Idempotency",
            "Distributed Transactions",
            "Database Performance",
          ],
          sampleQuestions: [
            "How would you handle 100,000 concurrent requests without crashing the database?",
            "What strategies do you use for zero-downtime database migrations?",
          ],
        },
      ],
    };

    res.json({ success: true, parsedData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/feed/publish", async (req, res) => {
  try {
    const {
      company,
      role,
      level,
      summary,
      storyHtml,
      difficulty,
      topics,
      rounds,
      evaluationAreas,
      authorName,
      durationMinutes,
      feel,
      format,
    } = req.body;

    const newExperience: SeedExperience = {
      id: `exp-${Date.now()}`,
      company: company || "Custom Company",
      role: role || "Software Engineer",
      level: level || "Senior",
      summary: summary || "User contributed experience",
      difficulty: difficulty || "Medium",
      topics: topics || ["System Design", "Fullstack"],
      upvotes: 1,
      authorName: authorName || "Community Contributor",
      evaluationAreas: evaluationAreas || [
        "Technical Ability",
        "Communication",
      ],
      rounds: rounds || [],
    };
    (newExperience as any).storyHtml = storyHtml || null;
    (newExperience as any).durationMinutes = durationMinutes || null;
    (newExperience as any).feel = feel || null;
    (newExperience as any).format = format || "written";

    feedStore.unshift(newExperience);
    indexExperienceQuestions(newExperience);

    try {
      await db.orm.public.InterviewExperience.create({
        company: newExperience.company,
        role: newExperience.role,
        level: newExperience.level,
        summary: newExperience.summary,
        difficulty: newExperience.difficulty,
        topics: JSON.stringify(newExperience.topics),
        rounds: JSON.stringify(newExperience.rounds),
        questions: JSON.stringify([]),
        evaluationAreas: JSON.stringify(newExperience.evaluationAreas),
        upvotes: 1,
        authorName: newExperience.authorName,
        isVerified: true,
      });
    } catch (dbErr) {
      console.log("Stored in local memory store");
    }

    res.json({ success: true, experience: newExperience });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. Interview Simulator Endpoints
 */
app.post("/api/interviews/create", (req, res) => {
  try {
    const {
      company,
      role,
      jobDescription,
      resumeText,
      githubUrl,
      candidateName,
    } = req.body;

    if (!company || !role) {
      return res
        .status(400)
        .json({ success: false, error: "Company and Role are required" });
    }

    const sessionId = `sim-${Date.now()}`;
    const channelName = `agora-interview-${sessionId}`;

    const blueprint: InterviewBlueprint =
      InterviewOrchestrator.generateBlueprint({
        company,
        role,
        jobDescription,
        resumeText,
        githubUrl,
      });

    if (candidateName) {
      blueprint.candidateName = candidateName;
    }

    // Generate initial greeting turn
    const initialTurnResult = InterviewOrchestrator.generateNextTurn({
      blueprint,
      currentRoundIndex: 0,
      transcripts: [],
      latestCandidateInput: "",
    });

    const transcripts: ConversationTurn[] = [initialTurnResult.nextTurn];

    const agoraCredentials = generateAgoraToken(channelName, 0);

    const sessionData = {
      id: sessionId,
      candidateName: blueprint.candidateName,
      company: blueprint.company,
      role: blueprint.role,
      jobDescription: jobDescription || "",
      resumeText: resumeText || "",
      githubUrl: githubUrl || "",
      status: "IN_PROGRESS",
      currentRoundIndex: 0,
      blueprint,
      transcripts,
      agoraChannelName: channelName,
      agoraToken: agoraCredentials.token,
      agoraAppId: agoraCredentials.appId,
      createdAt: new Date().toISOString(),
    };

    localSessionStore[sessionId] = sessionData;

    res.json({
      success: true,
      sessionId,
      session: sessionData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/interviews/:id", (req, res) => {
  try {
    const { id } = req.params;
    const session = localSessionStore[id];

    if (!session) {
      return res
        .status(404)
        .json({ success: false, error: "Interview session not found" });
    }

    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/interviews/:id/agora-token", (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
    const session = localSessionStore[id];

    const channelName = session ? session.agoraChannelName : `agora-room-${id}`;
    const credentials = generateAgoraToken(channelName, uid || 0);

    res.json({ success: true, credentials });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/interviews/:id/interact", (req, res) => {
  try {
    const { id } = req.params;
    const { candidateInput } = req.body;

    const session = localSessionStore[id];
    if (!session) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    // Append candidate turn
    if (
      candidateInput &&
      typeof candidateInput === "string" &&
      candidateInput.trim().length > 0
    ) {
      session.transcripts.push({
        sender: "candidate",
        text: candidateInput.trim(),
        timestamp: new Date().toISOString(),
        roundIndex: session.currentRoundIndex,
      });
    }

    // Generate AI Interviewer turn
    const turnResult = InterviewOrchestrator.generateNextTurn({
      blueprint: session.blueprint,
      currentRoundIndex: session.currentRoundIndex,
      transcripts: session.transcripts,
      latestCandidateInput: candidateInput || "",
    });

    session.transcripts.push(turnResult.nextTurn);

    if (turnResult.shouldAdvanceRound) {
      session.currentRoundIndex += 1;
    }

    if (turnResult.isFinished) {
      session.status = "COMPLETED";
    }

    res.json({
      success: true,
      nextTurn: turnResult.nextTurn,
      activeInterviewer: turnResult.activeInterviewer,
      shouldAdvanceRound: turnResult.shouldAdvanceRound,
      isFinished: turnResult.isFinished,
      currentRoundIndex: session.currentRoundIndex,
      transcripts: session.transcripts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/interviews/:id/evaluate", (req, res) => {
  try {
    const { id } = req.params;
    const session = localSessionStore[id];

    if (!session) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    const evaluation = InterviewOrchestrator.generateEvaluation(
      session.blueprint,
      session.transcripts,
    );

    session.status = "COMPLETED";
    session.evaluations = evaluation;
    session.overallScore = evaluation.overallScore;

    res.json({
      success: true,
      evaluation,
      session,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Platform domain routes: agents, interview templates, goals, practice sessions
registerPlatformRoutes(app);

export default app;
