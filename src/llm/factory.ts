import type { LLMSettings } from "@/types";
import type { LLMProvider } from "./provider";
import { OpenAIProvider } from "./openai";
import { ClaudeProvider } from "./claude";

export function createProvider(settings: LLMSettings): LLMProvider {
  switch (settings.provider) {
    case "openai":
      return new OpenAIProvider(settings);
    case "claude":
      return new ClaudeProvider(settings);
  }
}
