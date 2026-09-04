import { RtcTokenBuilder, RtcRole } from "agora-token";

// ---------------------------------------------------------------------------
// Agora RTC — token issuance for the candidate's live room
// ---------------------------------------------------------------------------

export function generateAgoraToken(
  channelName: string,
  uid: number | string = 0,
): { token: string; appId: string; channelName: string } {
  const appId =
    process.env.AGORA_APP_ID || "8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d";
  const appCertificate =
    process.env.AGORA_APP_CERTIFICATE || "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d";
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600 * 24;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  let token = "";
  try {
    if (process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE) {
      token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        typeof uid === "number" ? uid : 0,
        role,
        privilegeExpiredTs,
        privilegeExpiredTs,
      );
    } else {
      // Mock / Sandbox Token for development when secrets are not yet configured
      token = `agora_demo_token_${channelName}_${Date.now()}`;
    }
  } catch (err) {
    console.warn("Agora token generation fallback:", err);
    token = `agora_demo_token_${channelName}_${Date.now()}`;
  }

  return { token, appId, channelName };
}

// ---------------------------------------------------------------------------
// Agora Agent Tools — conversational AI interviewers
//
// Each interviewer persona is hosted as an Agora Conversational AI Agent that
// joins the same RTC channel as the candidate, listens via its microphone, and
// speaks through TTS using an LLM (Gemini by default) grounded in the persona's
// system prompt. The candidate talks to the agent directly.
//
// Live mode is enabled in one of two ways:
//   1. Agora RESTful API credentials:
//        AGORA_APP_ID + AGORA_APP_CERTIFICATE  (sign the RTC token the agent joins with)
//        AGORA_CUSTOMER_ID + AGORA_CUSTOMER_SECRET (Basic auth for /dev/v1/conversational-ai-agent)
//   2. Your own gateway implementing /start + /stop:
//        AGORA_AGENT_ENDPOINT (+ AGORA_AGENT_KEY)
// Until either is configured the service returns a *simulated* payload so the
// full room flow still runs in development.
// ---------------------------------------------------------------------------

export interface AgoraAgentSpec {
  agentId: string;
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  // persona
  interviewerName: string;
  interviewerRole: string;
  ttsVoice: string;
  systemPrompt: string;
  greeting: string;
  // llm hook
  llm?: {
    provider?: string;
    model?: string;
    temperature?: number;
  };
}

const CONVERSATIONAL_API = "https://api.agora.io/dev/v1/conversational-ai-agent";

export function isAgentConfigured(): boolean {
  return !!(
    (process.env.AGORA_CUSTOMER_ID &&
      process.env.AGORA_CUSTOMER_SECRET &&
      process.env.AGORA_APP_ID) ||
    process.env.AGORA_AGENT_ENDPOINT
  );
}

function basicAuth(): string {
  const id = process.env.AGORA_CUSTOMER_ID || "";
  const secret = process.env.AGORA_CUSTOMER_SECRET || "";
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

export function buildAgentSpec(params: {
  channelName: string;
  token: string;
  appId: string;
  interviewerName: string;
  interviewerRole: string;
  systemPrompt: string;
  greeting: string;
  ttsVoice?: string;
  uid?: number;
}): AgoraAgentSpec {
  return {
    agentId: process.env.AGORA_AGENT_ID || "agent-mock",
    appId: params.appId,
    channelName: params.channelName,
    token: params.token,
    uid: params.uid ?? 888, // the agent always joins with this fixed uid
    interviewerName: params.interviewerName,
    interviewerRole: params.interviewerRole,
    ttsVoice:
      params.ttsVoice ||
      process.env.AGORA_AGENT_TTS_VOICE ||
      "en-US-Studio-Multilingual",
    systemPrompt: params.systemPrompt,
    greeting: params.greeting,
    llm: {
      provider: process.env.AGORA_AGENT_LLM_PROVIDER || "google",
      model: process.env.AGORA_AGENT_LLM_MODEL || "gemini-2.0-flash",
      temperature: 0.7,
    },
  };
}

async function gateway(path: string, body: unknown): Promise<any> {
  const endpoint = process.env.AGORA_AGENT_ENDPOINT!;
  const key = process.env.AGORA_AGENT_KEY || "";
  const res = await fetch(
    `${endpoint.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Agora agent gateway error ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  return res.json();
}

async function agoraRest(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${CONVERSATIONAL_API}/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Agora conversational-agent error ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  return res.json();
}

export interface AgentStartResult {
  ok: boolean;
  mode: "live" | "simulated";
  spec: AgoraAgentSpec;
  detail?: any;
  error?: string;
}

export async function startAIAgent(
  spec: AgoraAgentSpec,
): Promise<AgentStartResult> {
  if (!isAgentConfigured()) {
    return { ok: true, mode: "simulated", spec };
  }

  // Agora Conversational AI Agents body — one agent = one interviewer persona.
  const body = {
    name: `interviewer-${spec.interviewerName
      .toLowerCase()
      .replace(/\s+/g, "-")}`,
    properties: {
      channel: {
        channelName: spec.channelName,
        token: spec.token,
        uid: spec.uid,
      },
      llm: {
        provider: spec.llm?.provider || "google",
        config: {
          model: spec.llm?.model || "gemini-2.0-flash",
          systemPrompt: spec.systemPrompt,
          temperature: spec.llm?.temperature ?? 0.7,
          maxOutputTokens: 500,
        },
      },
      tts: {
        provider: process.env.AGORA_AGENT_TTS_PROVIDER || "microsoft",
        config: { voice: spec.ttsVoice },
      },
      greeting: spec.greeting,
    },
  };

  try {
    const detail = process.env.AGORA_CUSTOMER_ID
      ? await agoraRest("/start", body)
      : await gateway("/start", body);
    return { ok: true, mode: "live", spec, detail };
  } catch (err: any) {
    return { ok: false, mode: "simulated", spec, error: err.message };
  }
}

export interface AgentStopResult {
  ok: boolean;
  mode: "live" | "simulated";
  channelName: string;
  detail?: any;
  error?: string;
}

export async function stopAIAgent(
  channelName: string,
  taskId?: string,
): Promise<AgentStopResult> {
  if (!isAgentConfigured()) {
    return { ok: true, mode: "simulated", channelName };
  }
  const body: any = { channelName };
  if (taskId) body.taskId = taskId;
  try {
    const detail = process.env.AGORA_CUSTOMER_ID
      ? await agoraRest("/stop", body)
      : await gateway("/stop", body);
    return { ok: true, mode: "live", channelName, detail };
  } catch (err: any) {
    return { ok: false, mode: "simulated", channelName, error: err.message };
  }
}

// Convenience: builds + starts one agent for an interviewer persona in a channel.
export async function startInterviewerAgent(params: {
  channelName: string;
  interviewerName: string;
  interviewerRole: string;
  systemPrompt: string;
  greeting: string;
  ttsVoice?: string;
}): Promise<AgentStartResult> {
  const credentials = generateAgoraToken(params.channelName, 888);
  const spec = buildAgentSpec({
    channelName: params.channelName,
    token: credentials.token,
    appId: credentials.appId,
    interviewerName: params.interviewerName,
    interviewerRole: params.interviewerRole,
    systemPrompt: params.systemPrompt,
    greeting: params.greeting,
    ttsVoice: params.ttsVoice,
    uid: 888,
  });
  return startAIAgent(spec);
}
