import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ConnectionTestResult,
  ContentPart,
  LLMSettings,
  TokenUsage,
} from "@/types";
import type { LLMProvider } from "./provider";

// ---------------------------------------------------------------------------
// Internal types matching the Anthropic Messages API wire format
// ---------------------------------------------------------------------------

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
}

type ClaudeContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string; type?: string };
  type?: string;
}

interface ClaudeStreamDelta {
  type: string;
  delta?: {
    type?: string;
    text?: string;
    stop_reason?: string;
  };
  message?: {
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  usage?: { output_tokens?: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000;

function contentPartToClaude(part: ContentPart): ClaudeContentBlock {
  if (part.type === "text") {
    return { type: "text", text: part.text };
  }
  // ImageContent
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: part.mediaType,
      data: part.data,
    },
  };
}

/**
 * Convert ChatMessage[] to the Anthropic Messages format.
 * - System messages are extracted to a separate `system` field (handled by caller).
 * - Consecutive same-role messages are merged as required by the API.
 */
function toClaudeMessages(messages: ChatMessage[]): {
  system?: string;
  messages: ClaudeMessage[];
} {
  let system: string | undefined;
  const result: ClaudeMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // Concatenate multiple system messages
      const text =
        typeof msg.content === "string"
          ? msg.content
          : msg.content
              .filter((p): p is Extract<ContentPart, { type: "text" }> => p.type === "text")
              .map((p) => p.text)
              .join("\n");
      system = system ? `${system}\n${text}` : text;
      continue;
    }

    // Map "assistant" directly; treat "user" as-is
    const role: "user" | "assistant" =
      msg.role === "assistant" ? "assistant" : "user";

    const content =
      typeof msg.content === "string"
        ? msg.content
        : msg.content.map(contentPartToClaude);

    result.push({ role, content });
  }

  return { system, messages: result };
}

function isRetryable(err: unknown): boolean {
  if (err instanceof TypeError) {
    return true;
  }
  if (err instanceof Error && err.message.startsWith("HTTP 5")) {
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Claude provider
// ---------------------------------------------------------------------------

export class ClaudeProvider implements LLMProvider {
  readonly providerType = "claude" as const;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(settings: LLMSettings) {
    this.baseUrl = settings.baseUrl.replace(/\/+$/, "");
    this.apiKey = settings.apiKey;
    this.model = settings.model;
  }

  // -- public API -----------------------------------------------------------

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.withRetry(async () => {
      const body = this.buildBody(request, false);
      const res = await this.fetchMessages(body);
      const data = (await res.json()) as ClaudeResponse;

      if (data.error) {
        throw new Error(
          `Claude API error: ${data.error.message ?? "unknown"}`,
        );
      }

      const textParts = (data.content ?? [])
        .filter((b) => b.type === "text" && b.text != null)
        .map((b) => b.text as string);
      const usage: TokenUsage = {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens:
          (data.usage?.input_tokens ?? 0) +
          (data.usage?.output_tokens ?? 0),
      };

      return { content: textParts.join(""), usage };
    });
  }

  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
  ): Promise<ChatResponse> {
    return this.withRetry(async () => {
      const body = this.buildBody(request, true);
      const res = await this.fetchMessages(body);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      if (!res.body) {
        throw new Error("Response body is null; streaming is not supported");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let promptTokens = 0;
      let completionTokens = 0;
      let buffer = "";
      let currentEvent = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed.startsWith("event:")) {
            currentEvent = trimmed.slice(6).trim();
            continue;
          }

          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload) continue;

          try {
            const parsed = JSON.parse(payload) as ClaudeStreamDelta;

            if (
              currentEvent === "content_block_delta" &&
              parsed.delta?.type === "text_delta" &&
              parsed.delta.text
            ) {
              fullText += parsed.delta.text;
              onChunk(parsed.delta.text);
            } else if (currentEvent === "message_start" && parsed.message?.usage) {
              promptTokens = parsed.message.usage.input_tokens ?? 0;
            } else if (currentEvent === "message_delta" && parsed.usage) {
              completionTokens = parsed.usage.output_tokens ?? 0;
            }
          } catch {
            // Ignore non-JSON lines
          }
        }
      }

      return {
        content: fullText,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    });
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now();
    try {
      const body = {
        model: this.model,
        max_tokens: 5,
        messages: [{ role: "user" as const, content: "Hi" }],
      };
      const res = await this.fetchMessages(body);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          success: false,
          error: `HTTP ${res.status}: ${text}`,
          latencyMs: Date.now() - start,
        };
      }
      return { success: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
      };
    }
  }

  // -- private helpers ------------------------------------------------------

  private buildBody(
    request: ChatRequest,
    stream: boolean,
  ): Record<string, unknown> {
    const { system, messages } = toClaudeMessages(request.messages);
    return {
      model: request.model || this.model,
      max_tokens: request.maxTokens ?? 4096,
      messages,
      ...(system != null && { system }),
      ...(stream && { stream: true }),
      ...(request.temperature != null && { temperature: request.temperature }),
    };
  }

  private fetchMessages(body: Record<string, unknown>): Promise<Response> {
    return fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES && isRetryable(err)) {
          await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }
}
