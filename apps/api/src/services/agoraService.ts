import { RtcTokenBuilder, RtcRole } from 'agora-token';

// ---------------------------------------------------------------------------
// Agora RTC — token issuance for the candidate's live room
// ---------------------------------------------------------------------------

export function generateAgoraToken(channelName: string, uid: number | string = 0): { token: string; appId: string; channelName: string } {
  const appId = process.env.AGORA_APP_ID || "8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d";
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
        typeof uid === 'number' ? uid : 0,
        role,
        privilegeExpiredTs,
        privilegeExpiredTs
      );
    } else {
      // Mock / Sandbox Token for development when secrets are not yet configured
      token = `agora_demo_token_${channelName}_${Date.now()}`;
    }
  } catch (err) {
    console.warn("Agora token generation fallback:", err);
    token = `agora_demo_token_${channelName}_${Date.now()}`;
  }

  return {
    token,
    appId,
    channelName,
  };
}

// ---------------------------------------------------------------------------
// Agora Agent Tools — conversational AI interviewers
//
// Each interviewer persona is hosted as an Agora Conversational AI Agent that
// joins the same RTC channel as the candidate, listens via its microphone, and
// speaks through TTS using an LLM grounded in the persona's system prompt.
//
// Wire-up contract (no SDK constants are hard-coded so you can point this at
// your own Agora agent gateway / function):
//   AGORA_AGENT_ENDPOINT  -> base URL that implements start/stop for an agent
//   AGORA_AGENT_ID        -> identifier of the agent (uid / app id) to join
//   AGORA_AGENT_KEY       -> secret used to authenticate to your gateway
//
// Until AGORA_AGENT_ENDPOINT is configured, the service returns a *simulated*
// agent payload so the full flow (join RTC room, show speakers, drive the
// transcript engine) still works in development.
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
  // llm hook (optional — used when your agent gateway forwards prompts)
  llm?: {
    provider?: string;
    model?: string;
    temperature?: number;
  };
}

export function isAgentConfigured(): boolean {
  return !!(process.env.AGORA_AGENT_ENDPOINT && process.env.AGORA_AGENT_ID);
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
    agentId: process.env.AGORA_AGENT_ID || 'agent-mock',
    appId: params.appId,
    channelName: params.channelName,
    token: params.token,
    uid: params.uid ?? 888, // the agent always joins with this fixed uid
    interviewerName: params.interviewerName,
    interviewerRole: params.interviewerRole,
    ttsVoice: params.ttsVoice || process.env.AGORA_AGENT_TTS_VOICE || 'en-US-Studio-Multilingual',
    systemPrompt: params.systemPrompt,
    greeting: params.greeting,
    llm: {
      provider: process.env.AGORA_AGENT_LLM_PROVIDER || 'openai',
      model: process.env.AGORA_AGENT_LLM_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
    },
  };
}

async function gateway(path: string, body: unknown): Promise<any> {
  const endpoint = process.env.AGORA_AGENT_ENDPOINT!;
  const key = process.env.AGORA_AGENT_KEY || '';
  const res = await fetch(`${endpoint.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agora agent gateway error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export interface AgentStartResult {
  ok: boolean;
  mode: 'live' | 'simulated';
  spec: AgoraAgentSpec;
  detail?: any;
  error?: string;
}

export async function startAIAgent(spec: AgoraAgentSpec): Promise<AgentStartResult> {
  if (!isAgentConfigured()) {
    return { ok: true, mode: 'simulated', spec };
  }
  try {
    const detail = await gateway('/start', spec);
    return { ok: true, mode: 'live', spec, detail };
  } catch (err: any) {
    return { ok: false, mode: 'simulated', spec, error: err.message };
  }
}

export interface AgentStopResult {
  ok: boolean;
  mode: 'live' | 'simulated';
  channelName: string;
  detail?: any;
  error?: string;
}

export async function stopAIAgent(channelName: string, agentId?: string): Promise<AgentStopResult> {
  if (!isAgentConfigured()) {
    return { ok: true, mode: 'simulated', channelName };
  }
  try {
    const detail = await gateway('/stop', { channelName, agentId });
    return { ok: true, mode: 'live', channelName, detail };
  } catch (err: any) {
    return { ok: false, mode: 'simulated', channelName, error: err.message };
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
