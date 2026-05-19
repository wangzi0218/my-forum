import type {
  LLMProviderType,
  ChatRequest,
  ChatResponse,
  ConnectionTestResult,
} from "@/types";

export interface LLMProvider {
  readonly providerType: LLMProviderType;
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
  ): Promise<ChatResponse>;
  testConnection(): Promise<ConnectionTestResult>;
}
