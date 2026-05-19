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
// Internal types matching the OpenAI API wire format
// ---------------------------------------------------------------------------

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenAIContentPart[];
}

type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OpenAIChatResponse {
  choices?: Array<{
    message?: { content?: string };
    delta?: { content?: string };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; type?: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000;

function contentPartToOpenAI(part: ContentPart): OpenAIContentPart {
  if (part.type === "text") {
    return { type: "text", text: part.text };
  }
  // ImageContent
  return {
    type: "image_url",
    image_url: { url: `data:${part.mediaType};base64,${part.data}` },
  };
}

function toOpenAIMessages(messages: ChatMessage[]): OpenAIMessage[] {
  return messages.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    return {
      role: m.role,
      content: m.content.map(contentPartToOpenAI),
    };
  });
}

function isRetryable(err: unknown): boolean {
  if (err instanceof TypeError) {
    // Network-level failures surface as TypeError in fetch
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

async function parseUsage(data: OpenAIChatResponse): Promise<TokenUsage> {
  const u = data.usage;
  return {
    promptTokens: u?.prompt_tokens ?? 0,
    completionTokens: u?.completion_tokens ?? 0,
    totalTokens: u?.total_tokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// OpenAI provider
// ---------------------------------------------------------------------------

export class OpenAIProvider implements LLMProvider {
  readonly providerType = "openai" as const;

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
      const res = await this.fetchChat(body);
      const data = (await res.json()) as OpenAIChatResponse;

      if (data.error) {
        throw new Error(
          `OpenAI API error: ${data.error.message ?? "unknown"}`,
        );
      }

      const text = data.choices?.[0]?.message?.content ?? "";
      const usage = await parseUsage(data);
      return { content: text, usage };
    });
  }

  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
  ): Promise<ChatResponse> {
    return this.withRetry(async () => {
      const body = this.buildBody(request, true);
      const res = await this.fetchChat(body);

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
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload) as OpenAIChatResponse;
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              onChunk(delta);
            }
          } catch {
            // Ignore lines that are not valid JSON (e.g. SSE comments)
          }
        }
      }

      // Streaming responses from OpenAI do not include usage by default.
      return {
        content: fullText,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    });
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now();
    try {
      const body = {
        model: this.model,
        messages: [{ role: "user" as const, content: "Hi" }],
        max_tokens: 5,
      };
      const res = await this.fetchChat(body);
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
    return {
      model: request.model || this.model,
      messages: toOpenAIMessages(request.messages),
      stream,
      ...(request.temperature != null && { temperature: request.temperature }),
      ...(request.maxTokens != null && { max_tokens: request.maxTokens }),
    };
  }

  private fetchChat(body: Record<string, unknown>): Promise<Response> {
    return fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
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
