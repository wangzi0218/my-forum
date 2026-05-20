// ============================================================
// 基础类型
// ============================================================

/** UUID v4 */
export type UUID = string;

/** ISO 8601 时间戳 */
export type ISODateString = string;

// ============================================================
// Workspace（工作区）
// ============================================================

export interface Workspace {
  id: UUID;
  name: string;
  description?: string;
  background: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ============================================================
// Chat（讨论）
// ============================================================

export type ChatStatus = "active" | "converged" | "archived";

export interface Chat {
  id: UUID;
  workspaceId: UUID;
  title: string;
  status: ChatStatus;
  characterIds: UUID[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ============================================================
// Message（消息）
// ============================================================

export type MessageRole = "user" | "character" | "system";

export interface Message {
  id: UUID;
  chatId: UUID;
  role: MessageRole;
  characterId?: UUID;
  content: string;
  images: ImageAttachment[];
  metadata?: MessageMetadata;
  createdAt: ISODateString;
}

export interface MessageMetadata {
  turnNumber?: number;
  hasDivergence?: boolean;
  model?: string;
  latencyMs?: number;
  quote?: MessageQuote;
}

// ============================================================
// ImageAttachment（图片附件）
// ============================================================

export interface ImageAttachment {
  id: UUID;
  filename: string;
  mimeType: string;
  localPath: string;
  data: string; // base64
  width?: number;
  height?: number;
}

// ============================================================
// Choice（选择点）
// ============================================================

export type ChoiceStatus = "pending" | "resolved" | "skipped";

export interface Choice {
  id: UUID;
  chatId: UUID;
  triggerMessageId?: UUID;
  question: string;
  options: ChoiceOption[];
  selectedOptionId?: UUID;
  status: ChoiceStatus;
  createdAt: ISODateString;
  resolvedAt?: ISODateString;
}

export interface ChoiceOption {
  id: UUID;
  label: string; // "A", "B", "C"
  description: string;
  characterPreferences: CharacterPreference[];
}

export type PreferenceLeaning = "strong" | "prefer" | "neutral" | "against";

export interface CharacterPreference {
  characterId: UUID;
  leaning: PreferenceLeaning;
  reason?: string;
}

// ============================================================
// MessageQuote（消息引用）
// ============================================================

export interface MessageQuote {
  messageId: UUID;
  characterId: UUID;
  characterName: string;
  characterColor: string;
  content: string;
}

// ============================================================
// Character（NPC 角色）
// ============================================================

export interface Character {
  id: UUID;
  name: string;
  color: string;
  avatar: string;
  personality: string;
  speakingStyle: string;
  capabilities: string[];
  triggerConditions: string[];
  systemPrompt: string;
  isBuiltin: boolean;
  createdAt: ISODateString;
}

// ============================================================
// AppSettings（用户设置）
// ============================================================

export type LLMProviderType = "openai" | "claude";

export interface LLMSettings {
  provider: LLMProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AppSettings {
  llm: LLMSettings;
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
}

// ============================================================
// LLM 相关
// ============================================================

export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export type ContentPart = TextContent | ImageContent;

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  data: string; // base64
  mediaType: string;
}

export interface ChatResponse {
  content: string;
  usage: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  latencyMs?: number;
}

// ============================================================
// 讨论引擎相关
// ============================================================

export interface DiscussionResult {
  messages: Message[];
  choice?: Choice;
  converged: boolean;
}

export interface DiscussionContext {
  messages: Message[];
  activeChoice?: Choice;
  characters: Character[];
  turnCount: number;
}

// ============================================================
// Skill（方法论技能）
// ============================================================

export interface Skill {
  id: UUID;
  name: string;
  description: string;
  /** 注入 NPC prompt 的指令片段 */
  promptFragment: string;
  /** 触发条件：当用户输入匹配时，NPC 会使用此 skill */
  triggers: string[];
  /** 是否内置 */
  isBuiltin: boolean;
}

// ============================================================
// Scenario（场景包）
// ============================================================

export interface Scenario {
  id: UUID;
  name: string;
  description: string;
  /** 角色列表 */
  characters: Character[];
  /** 默认发言顺序（character ID 数组） */
  speakingOrder: string[];
  /** 每个角色发言前的思考延迟（ms） */
  speakingDelay: Record<string, number>;
  /** 默认降级回复（LLM 失败时使用） */
  fallbackResponses: Record<string, string>;
}
