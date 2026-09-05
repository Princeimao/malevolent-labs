import { RtcTokenBuilder, RtcRole } from "agora-token";
import { env } from "../../lib";

// ---------------------------------------------------------------------------
// Agora RTC — token issuance for the candidate's live room
// ---------------------------------------------------------------------------

export function generateAgoraToken(
  channelName: string,
  uid: number | string = 0,
): { token: string; appId: string; channelName: string } {
  const appId = env.AGORA_APP_ID;
  const appCertificate = env.AGORA_APP_CERTIFICATE;
  if (!appId || !appCertificate) {
    throw new Error(
      "Agora RTC is not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in the API .env — a live RTC token cannot be issued without them.",
    );
  }

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600 * 24;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    typeof uid === "number" ? uid : 0,
    role,
    privilegeExpiredTs,
    privilegeExpiredTs,
  );

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
// Live mode is enabled by configuring:
//   1. Agora RESTful API credentials:
//        AGORA_APP_ID + AGORA_APP_CERTIFICATE  (sign the RTC token the agent joins with)
//        AGORA_CUSTOMER_ID + AGORA_CUSTOMER_SECRET (Basic auth for /dev/v1/conversational-ai-agent)
//   2. Or your own gateway implementing /start + /stop:
//        AGORA_AGENT_ENDPOINT (+ AGORA_AGENT_KEY)
// There is no simulated mode: if configuration or the remote call fails, an
// error is thrown and surfaced to the caller.
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

const CONVERSATIONAL_API =
  "https://api.agora.io/api/conversational-ai-agent/v2";

function basicAuth(): string {
  const id = process.env.AGORA_CUSTOMER_ID || "";
  const secret = process.env.AGORA_CUSTOMER_SECRET || "";
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

// Conversational AI Agents are authenticated with a short-lived token issued
// from the project appId/appCertificate, or with RESTful customer creds.
let agentTokenCache: { token: string; expiresAt: number } | null = null;

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
    uid: params.uid ?? 888,

    interviewerName: params.interviewerName,
    interviewerRole: params.interviewerRole,

    ttsVoice:
      params.ttsVoice ||
      process.env.AGORA_AGENT_TTS_VOICE ||
      "en-US-Studio-Multilingual",

    systemPrompt: params.systemPrompt,
    greeting: params.greeting,

    // Don't select Google/OpenAI/Gemini here.
    llm: undefined,
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
  const customerId = process.env.AGORA_CUSTOMER_ID;
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
  const appId = process.env.AGORA_APP_ID;

  if (!customerId || !customerSecret) {
    throw new Error("AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET are required");
  }

  if (!appId) {
    throw new Error("AGORA_APP_ID is required");
  }

  const credentials = Buffer.from(`${customerId}:${customerSecret}`).toString(
    "base64",
  );

  const cleanPath = path.replace(/^\/+/, "");

  const url =
    `${CONVERSATIONAL_API}/projects/` +
    `${encodeURIComponent(appId)}/` +
    cleanPath;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `Agora conversational-agent error ${res.status}: ${text.slice(0, 1000)}`,
    );
  }

  return text ? JSON.parse(text) : {};
}

function requireAgentConfig(): void {
  const hasApp =
    !!process.env.AGORA_APP_ID && !!process.env.AGORA_APP_CERTIFICATE;

  const hasCustomer =
    !!process.env.AGORA_CUSTOMER_ID && !!process.env.AGORA_CUSTOMER_SECRET;

  if (!hasApp) {
    throw new Error("Agora App ID and App Certificate are required.");
  }

  if (!hasCustomer) {
    throw new Error(
      "Agora Customer ID and Customer Secret are required for the Agora REST API.",
    );
  }
}

export interface AgentStartResult {
  ok: true;
  spec: AgoraAgentSpec;
  detail?: any;
}

export async function startAIAgent(
  spec: AgoraAgentSpec,
): Promise<AgentStartResult> {
  requireAgentConfig();

  const body = {
    name: `interviewer-${spec.interviewerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Date.now()}`,

    properties: {
      channel: spec.channelName,
      token: spec.token,
      agent_rtc_uid: String(spec.uid),
      remote_rtc_uids: ["*"],
      enable_string_uid: false,
      idle_timeout: 120,

      asr: {
        credential_mode: "managed",
        vendor: "deepgram",
        params: {
          url: "wss://api.deepgram.com/v1/listen",
          model: "nova-3",
          language: "en-US",
        },
      },

      llm: {
        credential_mode: "managed",
        vendor: "openai",
        style: "openai",
        url: "https://api.openai.com/v1/chat/completions",

        system_messages: [
          {
            role: "system",
            content: spec.systemPrompt,
          },
        ],

        greeting_message: spec.greeting,

        failure_message:
          "I'm sorry, I wasn't able to process that. Could you please repeat your answer?",

        max_history: 10,

        params: {
          model: spec.llm?.model || "gpt-4o-mini",
          temperature: spec.llm?.temperature ?? 0.7,
          max_tokens: 500,
        },
      },

      tts: {
        credential_mode: "managed",
        vendor: "minimax",

        params: {
          url: "wss://api.minimax.io/ws/v1/t2a_v2",
          model: "speech-2.6-turbo",

          voice_setting: {
            voice_id: spec.ttsVoice || "English_captivating_female1",
          },
        },
      },
    },
  };

  const detail = await agoraRest("/join", body);

  return {
    ok: true,
    spec,
    detail,
  };
}

export interface AgentStopResult {
  ok: true;
  channelName: string;
  detail?: any;
}

export async function stopAIAgent(
  channelName: string,
  taskId?: string,
): Promise<AgentStopResult> {
  const body: any = { channelName };
  if (taskId) body.taskId = taskId;
  const detail = await agoraRest("/stop", body);
  return { ok: true, channelName, detail };
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

// Starts one conversational agent per interviewer in the same channel, each with
// its own uid (888, 889, ...). Panelists can speak in the same round.
export async function startRoundAgents(params: {
  channelName: string;
  interviewers: Array<{
    interviewerName: string;
    interviewerRole: string;
    systemPrompt: string;
    greeting: string;
    ttsVoice?: string;
    index: number;
  }>;
}): Promise<Array<AgentStartResult>> {
  const started: AgentStartResult[] = [];
  try {
    for (const interviewer of params.interviewers) {
      const uid = 888 + interviewer.index;
      const credentials = generateAgoraToken(params.channelName, uid);
      const spec = buildAgentSpec({
        channelName: params.channelName,
        token: credentials.token,
        appId: credentials.appId,
        interviewerName: interviewer.interviewerName,
        interviewerRole: interviewer.interviewerRole,
        systemPrompt: interviewer.systemPrompt,
        greeting: interviewer.greeting,
        ttsVoice: interviewer.ttsVoice,
        uid,
      });
      started.push(await startAIAgent(spec));
    }
    return started;
  } catch (err) {
    // Best effort: tear down whatever already joined before re-throwing.
    for (const startedAgent of started) {
      try {
        await agoraRest("/stop", {
          channelName: params.channelName,
          agent_id: startedAgent.spec.uid,
        });
      } catch {
        /* ignore cleanup failure */
      }
    }
    throw err;
  }
}
