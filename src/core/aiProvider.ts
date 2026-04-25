// One DSD Equity Platform - AI Provider
// Anthropic Claude integration with PRD-governed system prompt
// All calls governed by Primary Directive and Meta-Skills Framework

import { PRIMARY_DIRECTIVE } from "./PrimaryDirective";
import { applyToAllAgents } from "./MetaSkillsFramework";
import { DSD_RESOURCES } from "./dsdResources";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIRequestOptions {
  agentId: string;
  agentName: string;
  agentPurpose: string;
  maxTokens?: number;
  temperature?: number;
  systemPromptAddendum?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  agentId: string;
  timestamp: string;
}

export interface AIStreamChunk {
  delta: string;
  done: boolean;
}

// Build the PRD-governed system prompt for all agents
function buildSystemPrompt(options: AIRequestOptions): string {
  const { agentId, agentName, agentPurpose, systemPromptAddendum } = options;

  const dsdContext = `
=== MINNESOTA DSD CONTEXT ===
You are operating within the Minnesota Department of Human Services, Disability Services Division (DSD).
Minnesota's key disability waiver programs: CADI (Community Access for Disability Inclusion), DD (Developmental Disabilities), BI (Brain Injury), EW (Elderly Waiver), AC (Alternative Care).
Key policy documents: Community-Based Services Manual (CBSM), HCBS Settings Rule, Olmstead Plan, Employment First.
Rate system: Disability Waiver Rate System (DWRS), transitioning to 2026 framework.
Equity framework: One DSD Equity and Inclusion Framework.
Your state context is Minnesota. All policy, statute, and program references must be Minnesota-specific and accurate.
Key communities served: BIPOC communities, immigrant and refugee families, Greater MN/rural populations, LGBTQ+ people with disabilities.
Minnesota key languages: English, Spanish, Somali, Hmong, Vietnamese, Oromo, Arabic.
`;

  const primaryDirectivePrompt = `
=== PRIMARY DIRECTIVE ===
${PRIMARY_DIRECTIVE.text}

Force Multiplier Rules (apply to every response):
${PRIMARY_DIRECTIVE.forceMultiplierRules.map((rule, i) => `${i + 1}. ${rule}`).join("\n")}
`;

  const metaSkillsPrompt = applyToAllAgents(`${agentName} - ${agentPurpose}`);

  const agentSpecificPrompt = `
=== AGENT IDENTITY ===
Agent ID: ${agentId}
Agent Name: ${agentName}
Purpose: ${agentPurpose}
`;

  const operationalStandards = `
=== OPERATIONAL STANDARDS ===
1. NEVER produce outputs with placeholders, [INSERT HERE], or incomplete sections
2. ALWAYS provide complete, ready-to-use outputs
3. ALWAYS accompany problems with proposed solutions
4. Format for intended audience: executive summaries for leadership (1-2 pages max), plain language for community (6th-8th grade), technical for staff
5. Use disability justice-aligned language: avoid ableist terms, use person/identity-first language based on context
6. Disaggregate by race, ethnicity, geography when analyzing data or making recommendations
7. Center community voice - cite lived experience and self-advocacy perspectives
8. Apply Olmstead principles: community integration is the goal
9. Reference Employment First: integrated competitive employment is the presumed outcome
10. When uncertain about MN policy specifics, say so clearly and direct to authoritative sources
`;

  const outputFormat = `
=== OUTPUT FORMAT REQUIREMENTS ===
- Executive content: Lead with implications, use headers, bullet points, max 2 pages
- Community content: Plain language, short paragraphs, define all terms, no acronyms without definition
- Policy content: Cite statutes and authority, structured with clear sections, include equity implications
- Training content: Include learning objectives, interactive elements, assessment questions
- Data reports: Lead with key finding, disaggregate, visualize, recommend action
- All content: No placeholders, complete and deployment-ready
`;

  const additionalContext = systemPromptAddendum
    ? `\n=== ADDITIONAL CONTEXT ===\n${systemPromptAddendum}`
    : "";

  return [
    primaryDirectivePrompt,
    agentSpecificPrompt,
    dsdContext,
    metaSkillsPrompt,
    operationalStandards,
    outputFormat,
    additionalContext
  ].join("\n\n");
}

// Main AI call function using Anthropic Claude via direct API
export async function callAI(
  messages: AIMessage[],
  options: AIRequestOptions
): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "VITE_ANTHROPIC_API_KEY is not set. Please add your Anthropic API key to the .env file."
    );
  }

  const systemPrompt = buildSystemPrompt(options);
  const maxTokens = options.maxTokens || 4096;
  const temperature = options.temperature ?? 0.3;

  const requestBody = {
    model: "claude-opus-4-5",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(
        `Anthropic API error: ${response.status} - ${errorData?.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    const content = data.content
      ?.filter((block: { type: string }) => block.type === "text")
      .map((block: { type: string; text: string }) => block.text)
      .join("") || "";

    return {
      content,
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens,
            outputTokens: data.usage.output_tokens
          }
        : undefined,
      model: data.model || "claude-opus-4-5",
      agentId: options.agentId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error calling Anthropic API");
  }
}

// Streaming version of AI call
export async function callAIStream(
  messages: AIMessage[],
  options: AIRequestOptions,
  onChunk: (chunk: AIStreamChunk) => void
): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "VITE_ANTHROPIC_API_KEY is not set. Please add your Anthropic API key to the .env file."
    );
  }

  const systemPrompt = buildSystemPrompt(options);
  const maxTokens = options.maxTokens || 4096;
  const temperature = options.temperature ?? 0.3;

  const requestBody = {
    model: "claude-opus-4-5",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    stream: true
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(
      `Anthropic API error: ${response.status} - ${errorData?.error?.message || response.statusText}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body reader available");
  }

  let fullContent = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let model = "claude-opus-4-5";

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              const delta = parsed.delta.text || "";
              fullContent += delta;
              onChunk({ delta, done: false });
            } else if (parsed.type === "message_start" && parsed.message) {
              model = parsed.message.model || model;
              inputTokens = parsed.message.usage?.input_tokens || 0;
            } else if (parsed.type === "message_delta" && parsed.usage) {
              outputTokens = parsed.usage.output_tokens || 0;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  onChunk({ delta: "", done: true });

  return {
    content: fullContent,
    usage: {
      inputTokens,
      outputTokens
    },
    model,
    agentId: options.agentId,
    timestamp: new Date().toISOString()
  };
}

// Utility: Build context string for DSD resource injection
export function buildDSDContext(): string {
  return `
Minnesota Disability Services Context:
- Waivers: CADI, DD, BI, EW, AC
- DWRS 2026 target minimum wage for DSPs: $${DSD_RESOURCES.dwrs2026.rateComponents.DIRECT_CARE.minimumWage}/hr
- CHOICE Domains: ${Object.keys(DSD_RESOURCES.choiceDomains.domains).join(", ")}
- Olmstead mandate: Most integrated setting appropriate to individual needs
- Employment First: Competitive integrated employment is the first and preferred outcome
- Key equity populations: BIPOC communities, immigrant/refugee families, rural MN, LGBTQ+ people with disabilities
`;
}

// Simple single-turn convenience function
export async function askAgent(
  prompt: string,
  agentId: string,
  agentName: string,
  agentPurpose: string,
  systemAddendum?: string
): Promise<string> {
  const response = await callAI(
    [{ role: "user", content: prompt }],
    {
      agentId,
      agentName,
      agentPurpose,
      systemPromptAddendum: systemAddendum
    }
  );
  return response.content;
}
