# 技术方案设计

## 文档信息

- 项目：PM Workflow Harness
- 版本：v1.0
- 日期：2026-05-19
- 状态：设计阶段

## 目录

1. [数据结构设计](#1-数据结构设计)
2. [模块接口设计](#2-模块接口设计)
3. [讨论流程设计](#3-讨论流程设计)
4. [API 设计（Tauri 命令）](#4-api-设计tauri-命令)
5. [错误处理策略](#5-错误处理策略)

---

## 1. 数据结构设计

### 1.1 TypeScript 类型定义

```typescript
// ============================================================
// 基础类型
// ============================================================

/** ISO 8601 时间戳 */
type ISODateString = string;

/** UUID v4 */
type UUID = string;

// ============================================================
// Workspace（工作区）
// ============================================================

interface Workspace {
  /** 工作区唯一标识 */
  id: UUID;
  /** 工作区名称，如"HIS 项目" */
  name: string;
  /** 工作区描述（可选） */
  description?: string;
  /** 创建时间 */
  created_at: ISODateString;
  /** 最后更新时间 */
  updated_at: ISODateString;
}

// ============================================================
// Chat（讨论）
// ============================================================

interface Chat {
  /** 讨论唯一标识 */
  id: UUID;
  /** 所属工作区 ID */
  workspace_id: UUID;
  /** 讨论标题，可自动生成或用户指定 */
  title: string;
  /** 讨论状态 */
  status: ChatStatus;
  /** 创建时间 */
  created_at: ISODateString;
  /** 最后更新时间 */
  updated_at: ISODateString;
}

/** 讨论状态 */
type ChatStatus = 
  | 'active'      // 进行中
  | 'converged'   // 已收敛（得出结论）
  | 'archived';   // 已归档

// ============================================================
// Message（消息）
// ============================================================

interface Message {
  /** 消息唯一标识 */
  id: UUID;
  /** 所属讨论 ID */
  chat_id: UUID;
  /** 消息角色 */
  role: MessageRole;
  /** 角色 ID（role 为 character 时必填） */
  character_id?: UUID;
  /** 消息文本内容 */
  content: string;
  /** 图片列表（base64 编码） */
  images: ImageAttachment[];
  /** 消息元数据 */
  metadata?: MessageMetadata;
  /** 创建时间 */
  created_at: ISODateString;
}

/** 消息角色 */
type MessageRole = 'user' | 'character' | 'system';

/** 图片附件 */
interface ImageAttachment {
  /** 图片唯一标识 */
  id: UUID;
  /** 原始文件名 */
  filename: string;
  /** MIME 类型 */
  mime_type: string;
  /** base64 编码数据 */
  data: string;
  /** 图片宽度（像素） */
  width?: number;
  /** 图片高度（像素） */
  height?: number;
}

/** 消息元数据 */
interface MessageMetadata {
  /** 讨论轮次 */
  turn_number?: number;
  /** 是否为分歧检测结果 */
  has_divergence?: boolean;
  /** 生成该消息的 LLM 模型 */
  model?: string;
  /** LLM 调用耗时（毫秒） */
  latency_ms?: number;
}

// ============================================================
// Choice（选择点）
// ============================================================

interface Choice {
  /** 选择点唯一标识 */
  id: UUID;
  /** 所属讨论 ID */
  chat_id: UUID;
  /** 关联的消息 ID（触发选择点的消息） */
  trigger_message_id?: UUID;
  /** 问题描述 */
  question: string;
  /** 选项列表 */
  options: ChoiceOption[];
  /** 用户最终选择的选项 ID */
  selected_option_id?: UUID;
  /** 选择点状态 */
  status: ChoiceStatus;
  /** 创建时间 */
  created_at: ISODateString;
  /** 用户做出选择的时间 */
  resolved_at?: ISODateString;
}

/** 选项 */
interface ChoiceOption {
  /** 选项唯一标识 */
  id: UUID;
  /** 选项标签（如"A"、"B"） */
  label: string;
  /** 选项描述 */
  description: string;
  /** 各 NPC 的倾向 */
  character_preferences: CharacterPreference[];
}

/** NPC 倾向 */
interface CharacterPreference {
  /** NPC ID */
  character_id: UUID;
  /** 倾向程度 */
  leaning: PreferenceLeaning;
  /** 倾向理由 */
  reason?: string;
}

/** 倾向程度 */
type PreferenceLeaning = 
  | 'strong'    // 强烈推荐
  | 'prefer'    // 倾向
  | 'neutral'   // 中立
  | 'against';  // 反对

/** 选择点状态 */
type ChoiceStatus = 
  | 'pending'   // 等待用户选择
  | 'resolved'  // 用户已选择
  | 'skipped';  // 用户跳过

// ============================================================
// Character（NPC 配置）
// ============================================================

interface Character {
  /** NPC 唯一标识 */
  id: UUID;
  /** NPC 名称（如"小林"） */
  name: string;
  /** 头像颜色（十六进制） */
  color: string;
  /** 头像图片路径或 emoji */
  avatar: string;
  /** 人设描述 */
  personality: string;
  /** 说话风格描述 */
  speaking_style: string;
  /** 核心能力列表 */
  capabilities: string[];
  /** 触发条件（什么时候主动发言） */
  trigger_conditions: string[];
  /** system prompt */
  system_prompt: string;
  /** 是否为内置角色 */
  is_builtin: boolean;
  /** 创建时间 */
  created_at: ISODateString;
}

// ============================================================
// Setting（用户设置）
// ============================================================

interface Setting {
  /** 设置唯一标识 */
  id: UUID;
  /** 设置键 */
  key: string;
  /** 设置值（JSON 字符串） */
  value: string;
  /** 设置分组 */
  group: SettingGroup;
  /** 更新时间 */
  updated_at: ISODateString;
}

/** 设置分组 */
type SettingGroup = 
  | 'llm'       // LLM 配置
  | 'ui'        // 界面配置
  | 'engine';   // 引擎配置

/** LLM 配置 */
interface LLMConfig {
  /** 提供商类型 */
  provider: LLMProviderType;
  /** API 地址 */
  base_url: string;
  /** API Key */
  api_key: string;
  /** 模型名称 */
  model: string;
  /** 温度参数 */
  temperature?: number;
  /** 最大 token 数 */
  max_tokens?: number;
}

/** LLM 提供商类型 */
type LLMProviderType = 'openai' | 'claude';

/** 界面配置 */
interface UIConfig {
  /** 主题 */
  theme: 'light' | 'dark' | 'system';
  /** 字体大小 */
  font_size: 'small' | 'medium' | 'large';
  /** 消息显示速度（毫秒） */
  message_delay_ms: number;
}

/** 引擎配置 */
interface EngineConfig {
  /** 最大讨论轮次 */
  max_turns: number;
  /** 分歧检测阈值 */
  divergence_threshold: number;
  /** NPC 发言间隔（毫秒） */
  npc_interval_ms: number;
}

// ============================================================
// 导出格式
// ============================================================

/** Workspace 导出格式 */
interface WorkspaceExport {
  /** 导出格式版本 */
  version: number;
  /** 场景标识 */
  scenario: string;
  /** 导出时间 */
  exported_at: ISODateString;
  /** 工作区数据 */
  workspace: Workspace;
  /** 讨论列表 */
  chats: ChatExport[];
}

/** 单个讨论导出 */
interface ChatExport {
  /** 讨论信息 */
  chat: Chat;
  /** 消息列表 */
  messages: Message[];
  /** 选择点列表 */
  choices: Choice[];
}
```

### 1.2 SQLite 表结构

```sql
-- ============================================================
-- 启用外键约束
-- ============================================================
PRAGMA foreign_keys = ON;

-- ============================================================
-- Workspace（工作区）
-- ============================================================
CREATE TABLE workspace (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Chat（讨论）
-- ============================================================
CREATE TABLE chat (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converged', 'archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_workspace_id ON chat(workspace_id);

-- ============================================================
-- Message（消息）
-- ============================================================
CREATE TABLE message (
    id TEXT PRIMARY KEY NOT NULL,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'character', 'system')),
    character_id TEXT,
    content TEXT NOT NULL DEFAULT '',
    metadata TEXT,  -- JSON 字符串
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES character(id) ON DELETE SET NULL
);

CREATE INDEX idx_message_chat_id ON message(chat_id);
CREATE INDEX idx_message_created_at ON message(created_at);

-- ============================================================
-- MessageImage（消息图片）
-- ============================================================
CREATE TABLE message_image (
    id TEXT PRIMARY KEY NOT NULL,
    message_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    data TEXT NOT NULL,  -- base64 编码
    width INTEGER,
    height INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (message_id) REFERENCES message(id) ON DELETE CASCADE
);

CREATE INDEX idx_message_image_message_id ON message_image(message_id);

-- ============================================================
-- Choice（选择点）
-- ============================================================
CREATE TABLE choice (
    id TEXT PRIMARY KEY NOT NULL,
    chat_id TEXT NOT NULL,
    trigger_message_id TEXT,
    question TEXT NOT NULL,
    selected_option_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'skipped')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE,
    FOREIGN KEY (trigger_message_id) REFERENCES message(id) ON DELETE SET NULL
);

CREATE INDEX idx_choice_chat_id ON choice(chat_id);

-- ============================================================
-- ChoiceOption（选项）
-- ============================================================
CREATE TABLE choice_option (
    id TEXT PRIMARY KEY NOT NULL,
    choice_id TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (choice_id) REFERENCES choice(id) ON DELETE CASCADE
);

CREATE INDEX idx_choice_option_choice_id ON choice_option(choice_id);

-- ============================================================
-- CharacterPreference（NPC 倾向）
-- ============================================================
CREATE TABLE character_preference (
    id TEXT PRIMARY KEY NOT NULL,
    choice_option_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    leaning TEXT NOT NULL CHECK (leaning IN ('strong', 'prefer', 'neutral', 'against')),
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (choice_option_id) REFERENCES choice_option(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES character(id) ON DELETE CASCADE
);

CREATE INDEX idx_character_preference_option_id ON character_preference(choice_option_id);
CREATE INDEX idx_character_preference_character_id ON character_preference(character_id);

-- ============================================================
-- Character（NPC 配置）
-- ============================================================
CREATE TABLE character (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    avatar TEXT NOT NULL,
    personality TEXT NOT NULL,
    speaking_style TEXT NOT NULL,
    capabilities TEXT NOT NULL DEFAULT '[]',  -- JSON 数组
    trigger_conditions TEXT NOT NULL DEFAULT '[]',  -- JSON 数组
    system_prompt TEXT NOT NULL,
    is_builtin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Setting（用户设置）
-- ============================================================
CREATE TABLE setting (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    group_name TEXT NOT NULL CHECK (group_name IN ('llm', 'ui', 'engine')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_setting_key ON setting(key);
CREATE INDEX idx_setting_group ON setting(group_name);

-- ============================================================
-- 触发器：自动更新 updated_at
-- ============================================================

CREATE TRIGGER update_workspace_updated_at
    AFTER UPDATE ON workspace
    FOR EACH ROW
BEGIN
    UPDATE workspace SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_chat_updated_at
    AFTER UPDATE ON chat
    FOR EACH ROW
BEGIN
    UPDATE chat SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_setting_updated_at
    AFTER UPDATE ON setting
    FOR EACH ROW
BEGIN
    UPDATE setting SET updated_at = datetime('now') WHERE id = NEW.id;
END;
```

### 1.3 ER 关系图

```
┌─────────────┐       ┌─────────────┐
│  Workspace  │──────<│    Chat     │
└─────────────┘       └─────────────┘
                            │
                            ├──────<┌─────────────┐
                            │       │   Message   │
                            │       └─────────────┘
                            │             │
                            │             └──────<┌────────────────┐
                            │                     │ MessageImage   │
                            │                     └────────────────┘
                            │
                            └──────<┌─────────────┐
                                    │   Choice    │
                                    └─────────────┘
                                          │
                                          └──────<┌────────────────┐
                                                  │  ChoiceOption  │
                                                  └────────────────┘
                                                        │
                                                        └──────<┌─────────────────────┐
                                                                │ CharacterPreference  │
                                                                └─────────────────────┘

┌─────────────┐       ┌─────────────┐
│  Character  │       │   Setting   │
└─────────────┘       └─────────────┘
```

---

## 2. 模块接口设计

### 2.1 讨论引擎（Engine）

#### 2.1.1 DiscussionManager

```typescript
/**
 * 讨论管理器
 * 负责管理讨论流，决定谁发言，协调各 NPC 的发言顺序
 */
interface DiscussionManager {
  /**
   * 处理用户输入，启动讨论流程
   * @param chatId - 讨论 ID
   * @param input - 用户输入内容
   * @param images - 附带的图片列表
   * @returns 讨论流程结果
   */
  processUserInput(
    chatId: UUID,
    input: string,
    images?: ImageAttachment[]
  ): Promise<DiscussionResult>;

  /**
   * 获取下一个应该发言的 NPC
   * @param chatId - 讨论 ID
   * @param context - 当前讨论上下文
   * @returns 下一个发言的 NPC ID，或 null 如果讨论应该结束
   */
  getNextSpeaker(
    chatId: UUID,
    context: DiscussionContext
  ): Promise<UUID | null>;

  /**
   * 生成 NPC 回复
   * @param chatId - 讨论 ID
   * @param characterId - NPC ID
   * @param context - 讨论上下文
   * @returns 生成的消息
   */
  generateCharacterResponse(
    chatId: UUID,
    characterId: UUID,
    context: DiscussionContext
  ): Promise<Message>;

  /**
   * 判断讨论是否应该收敛
   * @param chatId - 讨论 ID
   * @returns 是否应该收敛
   */
  shouldConverge(chatId: UUID): Promise<boolean>;

  /**
   * 生成讨论结论
   * @param chatId - 讨论 ID
   * @returns 结论消息
   */
  generateConclusion(chatId: UUID): Promise<Message>;
}

/** 讨论流程结果 */
interface DiscussionResult {
  /** 新生成的消息列表 */
  messages: Message[];
  /** 是否触发了选择点 */
  choice?: Choice;
  /** 讨论是否已收敛 */
  converged: boolean;
}

/** 讨论上下文 */
interface DiscussionContext {
  /** 当前讨论的所有消息 */
  messages: Message[];
  /** 当前活跃的选择点 */
  activeChoice?: Choice;
  /** 当前轮次 */
  turn_number: number;
  /** 最近一次用户输入 */
  lastUserInput?: string;
}
```

#### 2.1.2 DivergenceDetector

```typescript
/**
 * 分歧检测器
 * 检测 NPC 之间是否存在分歧，以及分歧的程度
 */
interface DivergenceDetector {
  /**
   * 检测当前讨论中是否存在分歧
   * @param messages - 最近的消息列表
   * @param characters - 参与讨论的 NPC 列表
   * @returns 分歧检测结果
   */
  detect(
    messages: Message[],
    characters: Character[]
  ): Promise<DivergenceResult>;

  /**
   * 分析单条消息中的观点
   * @param message - 要分析的消息
   * @returns 提取的观点列表
   */
  extractViewpoints(message: Message): Promise<Viewpoint[]>;

  /**
   * 比较两个观点的冲突程度
   * @param viewpointA - 观点 A
   * @param viewpointB - 观点 B
   * @returns 冲突程度 (0-1)
   */
  compareViewpoints(
    viewpointA: Viewpoint,
    viewpointB: Viewpoint
  ): Promise<number>;
}

/** 分歧检测结果 */
interface DivergenceResult {
  /** 是否存在分歧 */
  has_divergence: boolean;
  /** 分歧程度 (0-1) */
  divergence_score: number;
  /** 分歧各方的观点 */
  viewpoints: CharacterViewpoint[];
  /** 分歧的核心议题 */
  core_issue?: string;
}

/** 观点 */
interface Viewpoint {
  /** 观点 ID */
  id: UUID;
  /** 观点内容摘要 */
  summary: string;
  /** 支持的论据 */
  arguments: string[];
  /** 建议的方向 */
  suggested_direction?: string;
}

/** NPC 观点 */
interface CharacterViewpoint {
  /** NPC ID */
  character_id: UUID;
  /** 该 NPC 的观点 */
  viewpoint: Viewpoint;
  /** 倾向程度 */
  leaning: PreferenceLeaning;
}
```

#### 2.1.3 ChoiceGenerator

```typescript
/**
 * 选择点生成器
 * 当检测到分歧时，生成结构化的选择点供用户决策
 */
interface ChoiceGenerator {
  /**
   * 基于分歧结果生成选择点
   * @param chatId - 讨论 ID
   * @param divergence - 分歧检测结果
   * @param context - 讨论上下文
   * @returns 生成的选择点
   */
  generateFromDivergence(
    chatId: UUID,
    divergence: DivergenceResult,
    context: DiscussionContext
  ): Promise<Choice>;

  /**
   * 生成收敛性选择点（讨论到一定阶段需要用户确认方向）
   * @param chatId - 讨论 ID
   * @param context - 讨论上下文
   * @returns 生成的选择点
   */
  generateConvergenceChoice(
    chatId: UUID,
    context: DiscussionContext
  ): Promise<Choice>;

  /**
   * 处理用户的选择
   * @param choiceId - 选择点 ID
   * @param selectedOptionId - 用户选择的选项 ID
   * @returns 更新后的选择点
   */
  resolveChoice(
    choiceId: UUID,
    selectedOptionId: UUID
  ): Promise<Choice>;

  /**
   * 生成选项的描述文本
   * @param options - 选项列表
   * @param characters - NPC 列表
   * @returns 格式化的选择点展示文本
   */
  formatChoiceDisplay(
    options: ChoiceOption[],
    characters: Character[]
  ): string;
}
```

### 2.2 LLM 层（Provider）

#### 2.2.1 LLMProvider 统一接口

```typescript
/**
 * LLM 提供商统一接口
 * 屏蔽 OpenAI 和 Claude 的 API 差异
 */
interface LLMProvider {
  /** 提供商类型 */
  readonly providerType: LLMProviderType;

  /**
   * 发送聊天请求
   * @param request - 聊天请求
   * @returns 聊天响应
   */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * 测试连接是否正常
   * @param config - LLM 配置
   * @returns 测试结果
   */
  testConnection(config: LLMConfig): Promise<ConnectionTestResult>;

  /**
   * 流式发送聊天请求
   * @param request - 聊天请求
   * @param onChunk - 接收到数据块时的回调
   * @returns 完整的响应
   */
  chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatResponse>;
}

/** 聊天请求 */
interface ChatRequest {
  /** 系统提示词 */
  system_prompt: string;
  /** 消息历史 */
  messages: ChatMessage[];
  /** 温度参数 */
  temperature?: number;
  /** 最大 token 数 */
  max_tokens?: number;
}

/** 聊天消息 */
interface ChatMessage {
  /** 角色 */
  role: 'user' | 'assistant' | 'system';
  /** 内容（文本或多模态） */
  content: string | ContentPart[];
}

/** 内容部分（支持多模态） */
type ContentPart = TextContent | ImageContent;

/** 文本内容 */
interface TextContent {
  type: 'text';
  text: string;
}

/** 图片内容 */
interface ImageContent {
  type: 'image';
  /** base64 编码的图片数据 */
  data: string;
  /** MIME 类型 */
  media_type: string;
}

/** 聊天响应 */
interface ChatResponse {
  /** 生成的文本内容 */
  content: string;
  /** 使用的 token 数 */
  usage: TokenUsage;
  /** 响应元数据 */
  metadata?: Record<string, unknown>;
}

/** Token 使用量 */
interface TokenUsage {
  /** 输入 token 数 */
  prompt_tokens: number;
  /** 输出 token 数 */
  completion_tokens: number;
  /** 总 token 数 */
  total_tokens: number;
}

/** 连接测试结果 */
interface ConnectionTestResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息（失败时） */
  error?: string;
  /** 延迟（毫秒） */
  latency_ms?: number;
  /** 可用模型列表（可选） */
  available_models?: string[];
}
```

#### 2.2.2 OpenAIProvider 实现

```typescript
/**
 * OpenAI 格式提供商
 * 支持 OpenAI API 及兼容接口（如 Azure OpenAI、本地模型）
 */
class OpenAIProvider implements LLMProvider {
  readonly providerType: LLMProviderType = 'openai';
  
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // 实现 OpenAI /v1/chat/completions 调用
    // 1. 构建请求体，处理多模态内容
    // 2. 发送 HTTP 请求
    // 3. 解析响应，提取内容和 token 使用量
  }

  async testConnection(config: LLMConfig): Promise<ConnectionTestResult> {
    // 发送简单的测试请求验证 API 可用性
  }

  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatResponse> {
    // 实现 SSE 流式调用
  }
}
```

#### 2.2.3 ClaudeProvider 实现

```typescript
/**
 * Claude 格式提供商
 * 支持 Anthropic Claude API
 */
class ClaudeProvider implements LLMProvider {
  readonly providerType: LLMProviderType = 'claude';
  
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // 实现 Claude /v1/messages 调用
    // 1. 构建请求体，转换消息格式
    // 2. 处理系统提示词（Claude 的 system 是独立字段）
    // 3. 处理图片格式差异
    // 4. 发送 HTTP 请求
    // 5. 解析响应
  }

  async testConnection(config: LLMConfig): Promise<ConnectionTestResult> {
    // 发送简单的测试请求验证 API 可用性
  }

  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatResponse> {
    // 实现 SSE 流式调用
  }
}
```

#### 2.2.4 ProviderFactory

```typescript
/**
 * LLM 提供商工厂
 * 根据配置创建对应的提供商实例
 */
class LLMProviderFactory {
  /**
   * 创建 LLM 提供商实例
   * @param config - LLM 配置
   * @returns 提供商实例
   */
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * 获取当前配置的提供商实例（单例）
   * @returns 提供商实例
   */
  static async getCurrent(): Promise<LLMProvider> {
    const config = await SettingsStore.getLLMConfig();
    return this.create(config);
  }
}
```

### 2.3 存储层（Store）

#### 2.3.1 DatabaseManager

```typescript
/**
 * 数据库管理器
 * 封装所有 SQLite 操作
 */
interface DatabaseManager {
  /**
   * 初始化数据库连接和表结构
   */
  initialize(): Promise<void>;

  /**
   * 关闭数据库连接
   */
  close(): Promise<void>;

  // ========== Workspace 操作 ==========
  
  /**
   * 创建工作区
   * @param workspace - 工作区数据（不含 id 和时间戳）
   * @returns 创建的工作区
   */
  createWorkspace(workspace: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>): Promise<Workspace>;

  /**
   * 获取工作区列表
   * @returns 所有工作区
   */
  listWorkspaces(): Promise<Workspace[]>;

  /**
   * 获取单个工作区
   * @param id - 工作区 ID
   * @returns 工作区或 null
   */
  getWorkspace(id: UUID): Promise<Workspace | null>;

  /**
   * 更新工作区
   * @param id - 工作区 ID
   * @param updates - 要更新的字段
   * @returns 更新后的工作区
   */
  updateWorkspace(id: UUID, updates: Partial<Workspace>): Promise<Workspace>;

  /**
   * 删除工作区（级联删除关联数据）
   * @param id - 工作区 ID
   */
  deleteWorkspace(id: UUID): Promise<void>;

  // ========== Chat 操作 ==========

  /**
   * 创建讨论
   * @param chat - 讨论数据
   * @returns 创建的讨论
   */
  createChat(chat: Omit<Chat, 'id' | 'created_at' | 'updated_at'>): Promise<Chat>;

  /**
   * 获取工作区下的讨论列表
   * @param workspaceId - 工作区 ID
   * @returns 讨论列表
   */
  listChats(workspaceId: UUID): Promise<Chat[]>;

  /**
   * 获取单个讨论
   * @param id - 讨论 ID
   * @returns 讨论或 null
   */
  getChat(id: UUID): Promise<Chat | null>;

  /**
   * 更新讨论
   * @param id - 讨论 ID
   * @param updates - 要更新的字段
   * @returns 更新后的讨论
   */
  updateChat(id: UUID, updates: Partial<Chat>): Promise<Chat>;

  /**
   * 删除讨论（级联删除关联数据）
   * @param id - 讨论 ID
   */
  deleteChat(id: UUID): Promise<void>;

  // ========== Message 操作 ==========

  /**
   * 创建消息
   * @param message - 消息数据
   * @returns 创建的消息
   */
  createMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message>;

  /**
   * 获取讨论的消息列表
   * @param chatId - 讨论 ID
   * @param options - 查询选项
   * @returns 消息列表
   */
  listMessages(chatId: UUID, options?: MessageQueryOptions): Promise<Message[]>;

  /**
   * 获取单条消息
   * @param id - 消息 ID
   * @returns 消息或 null
   */
  getMessage(id: UUID): Promise<Message | null>;

  /**
   * 删除消息
   * @param id - 消息 ID
   */
  deleteMessage(id: UUID): Promise<void>;

  // ========== Choice 操作 ==========

  /**
   * 创建选择点
   * @param choice - 选择点数据
   * @returns 创建的选择点
   */
  createChoice(choice: Omit<Choice, 'id' | 'created_at'>): Promise<Choice>;

  /**
   * 获取讨论的选择点列表
   * @param chatId - 讨论 ID
   * @returns 选择点列表
   */
  listChoices(chatId: UUID): Promise<Choice[]>;

  /**
   * 获取单个选择点
   * @param id - 选择点 ID
   * @returns 选择点或 null
   */
  getChoice(id: UUID): Promise<Choice | null>;

  /**
   * 更新选择点（通常用于记录用户选择）
   * @param id - 选择点 ID
   * @param updates - 要更新的字段
   * @returns 更新后的选择点
   */
  updateChoice(id: UUID, updates: Partial<Choice>): Promise<Choice>;

  /**
   * 获取讨论中待处理的选择点
   * @param chatId - 讨论 ID
   * @returns 待处理的选择点或 null
   */
  getPendingChoice(chatId: UUID): Promise<Choice | null>;

  // ========== Character 操作 ==========

  /**
   * 获取所有角色
   * @returns 角色列表
   */
  listCharacters(): Promise<Character[]>;

  /**
   * 获取单个角色
   * @param id - 角色 ID
   * @returns 角色或 null
   */
  getCharacter(id: UUID): Promise<Character | null>;

  /**
   * 创建自定义角色
   * @param character - 角色数据
   * @returns 创建的角色
   */
  createCharacter(character: Omit<Character, 'id' | 'created_at'>): Promise<Character>;

  /**
   * 更新角色
   * @param id - 角色 ID
   * @param updates - 要更新的字段
   * @returns 更新后的角色
   */
  updateCharacter(id: UUID, updates: Partial<Character>): Promise<Character>;

  /**
   * 删除角色（仅限非内置角色）
   * @param id - 角色 ID
   */
  deleteCharacter(id: UUID): Promise<void>;

  // ========== Setting 操作 ==========

  /**
   * 获取设置值
   * @param key - 设置键
   * @returns 设置值或 null
   */
  getSetting(key: string): Promise<string | null>;

  /**
   * 设置值
   * @param key - 设置键
   * @param value - 设置值
   * @param group - 设置分组
   */
  setSetting(key: string, value: string, group: SettingGroup): Promise<void>;

  /**
   * 获取指定分组的所有设置
   * @param group - 设置分组
   * @returns 设置列表
   */
  getSettingsByGroup(group: SettingGroup): Promise<Setting[]>;

  /**
   * 删除设置
   * @param key - 设置键
   */
  deleteSetting(key: string): Promise<void>;
}

/** 消息查询选项 */
interface MessageQueryOptions {
  /** 限制返回数量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
  /** 只返回指定角色的消息 */
  role?: MessageRole;
  /** 只返回指定 NPC 的消息 */
  characterId?: UUID;
  /** 按时间倒序 */
  order?: 'asc' | 'desc';
}
```

#### 2.3.2 ExportManager

```typescript
/**
 * 导出管理器
 * 负责 JSON 导出和导入
 */
interface ExportManager {
  /**
   * 导出工作区为 JSON
   * @param workspaceId - 工作区 ID
   * @returns JSON 字符串
   */
  exportWorkspace(workspaceId: UUID): Promise<string>;

  /**
   * 导出单个讨论为 JSON
   * @param chatId - 讨论 ID
   * @returns JSON 字符串
   */
  exportChat(chatId: UUID): Promise<string>;

  /**
   * 从 JSON 导入工作区
   * @param jsonString - JSON 字符串
   * @param options - 导入选项
   * @returns 导入的工作区
   */
  importWorkspace(jsonString: string, options?: ImportOptions): Promise<Workspace>;

  /**
   * 从 JSON 导入讨论到现有工作区
   * @param workspaceId - 目标工作区 ID
   * @param jsonString - JSON 字符串
   * @returns 导入的讨论
   */
  importChat(workspaceId: UUID, jsonString: string): Promise<Chat>;

  /**
   * 将导出数据保存到文件
   * @param data - 导出数据
   * @param filePath - 文件路径
   */
  saveToFile(data: string, filePath: string): Promise<void>;

  /**
   * 从文件读取导出数据
   * @param filePath - 文件路径
   * @returns JSON 字符串
   */
  loadFromFile(filePath: string): Promise<string>;

  /**
   * 验证导入数据的格式
   * @param jsonString - JSON 字符串
   * @returns 验证结果
   */
  validateImportData(jsonString: string): ValidationResult;
}

/** 导入选项 */
interface ImportOptions {
  /** 是否生成新的 ID（避免冲突） */
  generateNewIds?: boolean;
  /** 是否覆盖同名工作区 */
  overwrite?: boolean;
}

/** 验证结果 */
interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings: string[];
}
```

### 2.4 场景包（Scenario）

```typescript
/**
 * 场景接口
 * 定义一个完整的讨论场景，包括角色、提示词和触发逻辑
 */
interface Scenario {
  /** 场景唯一标识 */
  id: string;
  /** 场景名称 */
  name: string;
  /** 场景描述 */
  description: string;
  /** 场景包含的角色列表 */
  characters: CharacterDefinition[];

  /**
   * 获取指定角色的 system prompt
   * @param characterId - 角色 ID
   * @param context - 讨论上下文（可选，用于动态生成 prompt）
   * @returns system prompt 文本
   */
  getSystemPrompt(characterId: string, context?: DiscussionContext): string;

  /**
   * 判断是否应该触发选择点
   * @param messages - 消息列表
   * @param divergence - 分歧检测结果
   * @returns 是否触发
   */
  shouldTriggerChoice(messages: Message[], divergence?: DivergenceResult): boolean;

  /**
   * 生成选择点模板
   * @param messages - 消息列表
   * @param divergence - 分歧检测结果
   * @returns 选择点模板或 null
   */
  generateChoiceTemplate(
    messages: Message[],
    divergence?: DivergenceResult
  ): ChoiceTemplate | null;

  /**
   * 判断讨论是否应该收敛
   * @param messages - 消息列表
   * @param choices - 已有的选择点
   * @returns 是否应该收敛
   */
  shouldConverge(messages: Message[], choices: Choice[]): boolean;

  /**
   * 获取 NPC 的发言顺序
   * @param context - 讨论上下文
   * @param lastSpeaker - 上一个发言的 NPC ID
   * @returns 按优先级排序的 NPC ID 列表
   */
  getSpeakingOrder(
    context: DiscussionContext,
    lastSpeaker?: UUID
  ): UUID[];
}

/** 角色定义（场景包内部使用） */
interface CharacterDefinition {
  /** 角色 ID */
  id: string;
  /** 角色名称 */
  name: string;
  /** 角色颜色 */
  color: string;
  /** 角色头像 */
  avatar: string;
  /** 角色人设 */
  personality: string;
  /** 核心能力 */
  capabilities: string[];
  /** 触发条件 */
  trigger_conditions: string[];
}

/** 选择点模板 */
interface ChoiceTemplate {
  /** 问题描述模板 */
  question_template: string;
  /** 选项生成规则 */
  options_rule: OptionsRule;
  /** 是否需要 NPC 倾向 */
  require_character_preferences: boolean;
}

/** 选项生成规则 */
interface OptionsRule {
  /** 固定选项（如"继续讨论"、"先做这个"） */
  fixed_options?: string[];
  /** 是否从分歧中提取选项 */
  extract_from_divergence?: boolean;
  /** 最小选项数 */
  min_options: number;
  /** 最大选项数 */
  max_options: number;
}

// ============================================================
// PM 讨论场景实现（示例）
// ============================================================

/**
 * PM 讨论场景
 * 第一版的默认场景，3 个 NPC 讨论产品问题
 */
class PMDiscussionScenario implements Scenario {
  id = 'pm-discussion';
  name = 'PM 产品讨论';
  description = '3 个 AI 同事帮你讨论产品问题，质疑你的假设，收敛讨论方向';
  
  characters: CharacterDefinition[] = [
    {
      id: 'xiao-lin',
      name: '小林',
      color: '#22c55e',
      avatar: '🟢',
      personality: '追问问题，把事情想清楚',
      capabilities: ['识别方案先行', '拆解模糊需求', '追问假设', '识别 YY'],
      trigger_conditions: [
        '用户直接提方案，没有说明问题',
        '用户用了"肯定"、"一定"等过于自信的词',
        '用户的描述过于模糊',
        '讨论太快进入方案阶段'
      ]
    },
    {
      id: 'lao-chen',
      name: '老陈',
      color: '#3b82f6',
      avatar: '🔵',
      personality: '看事实、看数据、看现实',
      capabilities: ['追问证据', '关联历史', '评估可行性', '识别信息缺失'],
      trigger_conditions: [
        '用户做了判断但没有数据支撑',
        '讨论涉及竞品或市场情况',
        '需要评估可行性和成本',
        '有类似的过往案例可以参考'
      ]
    },
    {
      id: 'a-zhe',
      name: '阿哲',
      color: '#a855f7',
      avatar: '🟣',
      personality: '收敛讨论、排优先级、做判断',
      capabilities: ['收敛讨论', '排优先级', '给结论', '做取舍'],
      trigger_conditions: [
        '讨论已经进行了好几轮，需要收敛',
        '小林和老陈有明显分歧',
        '需要做优先级判断',
        '用户需要做选择'
      ]
    }
  ];

  getSystemPrompt(characterId: string, context?: DiscussionContext): string {
    // 根据角色和上下文生成 system prompt
    // 包含：角色人设 + 说话风格 + 当前讨论上下文 + 行为规则
  }

  shouldTriggerChoice(messages: Message[], divergence?: DivergenceResult): boolean {
    // 判断是否触发选择点
    // 条件：
    // 1. 检测到明显分歧
    // 2. 讨论轮次超过阈值
    // 3. 需要用户确认方向
  }

  generateChoiceTemplate(
    messages: Message[],
    divergence?: DivergenceResult
  ): ChoiceTemplate | null {
    // 生成选择点模板
  }

  shouldConverge(messages: Message[], choices: Choice[]): boolean {
    // 判断是否应该收敛
    // 条件：
    // 1. 用户已做出选择
    // 2. 讨论轮次足够
    // 3. 核心问题已明确
  }

  getSpeakingOrder(
    context: DiscussionContext,
    lastSpeaker?: UUID
  ): UUID[] {
    // 默认顺序：小林 → 老陈 → 阿哲
    // 根据上下文动态调整
  }
}
```

---

## 3. 讨论流程设计

### 3.1 完整流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入                                  │
│  "运营想在新用户进首页时加一个引导浮层"                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    1. 输入处理                                    │
│  - 保存用户消息（role=user）                                      │
│  - 处理图片附件（存储 + base64 转换）                              │
│  - 提取关键信息（问题、方案、背景）                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. 引擎判断                                    │
│  - 新问题？继续补充？切换话题？                                    │
│  - 更新讨论上下文                                                │
│  - 决定本轮讨论策略                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. NPC 发言顺序                                │
│  - 根据场景规则决定谁先发言                                        │
│  - 默认：小林（追问）→ 老陈（事实）→ 阿哲（收敛）                   │
│  - 根据内容动态调整（如涉及数据，老陈先说）                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. LLM 调用（循环）                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  4a. 构建 System Prompt                                    │  │
│  │  - 角色人设 + 说话风格                                      │  │
│  │  - 当前讨论上下文（最近 N 条消息）                           │  │
│  │  - 行为规则（说不、追问、收敛）                              │  │
│  │  - 图片内容（如有）                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  4b. 调用 LLM API                                          │  │
│  │  - OpenAI 格式：/v1/chat/completions                        │  │
│  │  - Claude 格式：/v1/messages                                │  │
│  │  - 流式输出，逐字显示                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  4c. 保存 NPC 消息（role=character）                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    5. 分歧检测                                    │
│  - 分析各 NPC 的回复内容                                         │
│  - 提取观点和建议                                                │
│  - 计算分歧程度（0-1）                                           │
│  - 判断是否需要触发选择点                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────┴─────────┐
                    │   有明显分歧？      │
                    └─────────┬─────────┘
                       是 │         │ 否
                          ▼         ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  6a. 生成选择点           │   │  6b. 判断是否继续发言      │
│  - 问题描述               │   │  - 是否需要更多 NPC 发言   │
│  - 选项列表               │   │  - 是否该收敛              │
│  - 各 NPC 倾向            │   └──────────────────────────┘
│  - 显示选择卡片           │              │
└──────────────────────────┘              │
          │                               │
          ▼                               ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  用户做选择               │   │  继续下一个 NPC 发言       │
│  - 点选选项               │   │  （回到步骤 4）            │
│  - 或补充说明             │   └──────────────────────────┘
└──────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    7. 讨论收敛判断                                │
│  - 用户已做出选择                                                │
│  - 核心问题已明确                                                │
│  - 讨论轮次足够                                                  │
│  - 生成结论或下一步建议                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 关键流程详解

#### 3.2.1 用户输入处理流程

```typescript
async function processUserInput(chatId: string, input: string, images?: ImageAttachment[]) {
  // 1. 保存用户消息
  const userMessage = await db.createMessage({
    chat_id: chatId,
    role: 'user',
    content: input,
    images: images || []
  });

  // 2. 获取讨论上下文
  const context = await buildDiscussionContext(chatId);

  // 3. 判断输入类型
  const inputType = await analyzeInputType(input, context);
  // inputType: 'new_problem' | 'continuation' | 'topic_switch' | 'answer_to_choice'

  // 4. 如果是回答选择点
  if (inputType === 'answer_to_choice') {
    return await handleChoiceResponse(chatId, input, context);
  }

  // 5. 启动 NPC 讨论
  return await startDiscussion(chatId, context);
}
```

#### 3.2.2 NPC 发言顺序决策

```typescript
function determineSpeakingOrder(context: DiscussionContext): string[] {
  const { messages, lastUserInput } = context;
  const characters = scenario.characters;

  // 分析用户输入的特征
  const inputFeatures = analyzeInput(lastUserInput);

  // 根据特征决定谁先发言
  if (inputFeatures.isProposalWithoutProblem) {
    // 方案先行：小林先追问
    return ['xiao-lin', 'lao-chen', 'a-zhe'];
  }

  if (inputFeatures.lacksEvidence) {
    // 缺乏证据：老陈先追问数据
    return ['lao-chen', 'xiao-lin', 'a-zhe'];
  }

  if (inputFeatures.hasMultipleOptions) {
    // 多个选项：阿哲先收敛
    return ['a-zhe', 'xiao-lin', 'lao-chen'];
  }

  // 默认顺序
  return ['xiao-lin', 'lao-chen', 'a-zhe'];
}
```

#### 3.2.3 System Prompt 构建

```typescript
function buildSystemPrompt(
  characterId: string,
  context: DiscussionContext
): string {
  const character = scenario.characters.find(c => c.id === characterId);
  const recentMessages = context.messages.slice(-10); // 最近 10 条消息

  return `
# 角色设定
你是${character.name}，${character.personality}。

# 说话风格
${getSpeakingStyle(characterId)}

# 核心能力
${character.capabilities.join('、')}

# 触发条件
以下情况你会主动发言：
${character.trigger_conditions.map(c => `- ${c}`).join('\n')}

# 当前讨论
${formatMessages(recentMessages)}

# 行为规则
1. 不要无底线顺着用户，如果证据不足要敢于追问
2. 不要替用户做决定，分歧时把选择权交给用户
3. 每次发言都要推进讨论，不要说废话
4. 如果是方案先行，先问"为什么"再讨论方案
5. 保持角色一致性，不要跳出人设

# 输出要求
- 直接说话，不要说"作为小林，我认为..."
- 简洁有力，不要长篇大论
- 如果要质疑，用提问的方式
`;
}
```

#### 3.2.4 分歧检测流程

```typescript
async function detectDivergence(
  messages: Message[],
  characters: Character[]
): Promise<DivergenceResult> {
  // 1. 提取各 NPC 最近的回复
  const recentCharacterMessages = messages
    .filter(m => m.role === 'character')
    .slice(-3); // 最近 3 条 NPC 消息

  // 2. 使用 LLM 分析观点（或使用规则引擎）
  const viewpoints = await extractViewpoints(recentCharacterMessages);

  // 3. 计算分歧程度
  const divergenceScore = calculateDivergenceScore(viewpoints);

  // 4. 判断是否需要触发选择点
  const hasDivergence = divergenceScore > config.divergence_threshold;

  return {
    has_divergence: hasDivergence,
    divergence_score: divergenceScore,
    viewpoints: viewpoints,
    core_issue: hasDivergence ? extractCoreIssue(viewpoints) : undefined
  };
}
```

#### 3.2.5 讨论收敛判断

```typescript
async function shouldConverge(
  chatId: string,
  context: DiscussionContext
): Promise<boolean> {
  const { messages, activeChoice } = context;

  // 条件 1：用户已做出选择
  if (activeChoice && activeChoice.status === 'resolved') {
    return true;
  }

  // 条件 2：讨论轮次足够
  const turnCount = messages.filter(m => m.role === 'character').length;
  if (turnCount >= config.max_turns) {
    return true;
  }

  // 条件 3：核心问题已明确且无分歧
  const divergence = await detectDivergence(messages, scenario.characters);
  if (!divergence.has_divergence && turnCount >= 3) {
    return true;
  }

  // 条件 4：场景特定的收敛条件
  return scenario.shouldConverge(messages, await db.listChoices(chatId));
}
```

### 3.3 NPC 互动节奏控制

```typescript
/**
 * NPC 发言节奏控制器
 * 模拟真实会议的讨论节奏
 */
class DiscussionPaceController {
  private config: EngineConfig;

  constructor(config: EngineConfig) {
    this.config = config;
  }

  /**
   * 计算 NPC 发言之间的延迟
   * @param prevSpeaker - 上一个发言的 NPC
   * @param nextSpeaker - 下一个发言的 NPC
   * @param context - 讨论上下文
   * @returns 延迟毫秒数
   */
  calculateDelay(
    prevSpeaker: string,
    nextSpeaker: string,
    context: DiscussionContext
  ): number {
    // 基础延迟
    let delay = this.config.npc_interval_ms;

    // 如果是阿哲接话（通常在收敛时），延迟稍长，模拟思考
    if (nextSpeaker === 'a-zhe') {
      delay *= 1.5;
    }

    // 如果有分歧，延迟稍短，模拟激烈讨论
    if (context.messages.some(m => m.metadata?.has_divergence)) {
      delay *= 0.8;
    }

    return delay;
  }

  /**
   * 判断是否需要"停顿"效果
   * @param characterId - NPC ID
   * @param context - 讨论上下文
   * @returns 是否显示"正在输入..."
   */
  shouldShowTypingIndicator(
    characterId: string,
    context: DiscussionContext
  ): boolean {
    // 总是显示，增加真实感
    return true;
  }
}
```

---

## 4. API 设计（Tauri 命令）

### 4.1 命令列表

```rust
// src-tauri/src/commands.rs

use tauri::command;
use serde::{Deserialize, Serialize};

// ============================================================
// Workspace 命令
// ============================================================

/// 创建工作区
#[command]
async fn create_workspace(name: String, description: Option<String>) -> Result<Workspace, String>;

/// 获取工作区列表
#[command]
async fn list_workspaces() -> Result<Vec<Workspace>, String>;

/// 获取单个工作区
#[command]
async fn get_workspace(id: String) -> Result<Option<Workspace>, String>;

/// 更新工作区
#[command]
async fn update_workspace(id: String, name: Option<String>, description: Option<String>) -> Result<Workspace, String>;

/// 删除工作区
#[command]
async fn delete_workspace(id: String) -> Result<(), String>;

// ============================================================
// Chat 命令
// ============================================================

/// 创建讨论
#[command]
async fn create_chat(workspace_id: String, title: Option<String>) -> Result<Chat, String>;

/// 获取讨论列表
#[command]
async fn list_chats(workspace_id: String) -> Result<Vec<Chat>, String>;

/// 获取单个讨论
#[command]
async fn get_chat(id: String) -> Result<Option<Chat>, String>;

/// 更新讨论
#[command]
async fn update_chat(id: String, title: Option<String>, status: Option<String>) -> Result<Chat, String>;

/// 删除讨论
#[command]
async fn delete_chat(id: String) -> Result<(), String>;

// ============================================================
// Message 命令
// ============================================================

/// 发送用户消息并触发讨论
#[command]
async fn send_message(
    chat_id: String,
    content: String,
    images: Vec<ImageInput>
) -> Result<DiscussionResult, String>;

/// 获取讨论消息列表
#[command]
async fn list_messages(
    chat_id: String,
    limit: Option<i32>,
    offset: Option<i32>,
    order: Option<String>
) -> Result<Vec<Message>, String>;

/// 删除消息
#[command]
async fn delete_message(id: String) -> Result<(), String>;

// ============================================================
// Choice 命令
// ============================================================

/// 获取待处理的选择点
#[command]
async fn get_pending_choice(chat_id: String) -> Result<Option<Choice>, String>;

/// 提交用户选择
#[command]
async fn submit_choice(
    choice_id: String,
    selected_option_id: String
) -> Result<Choice, String>;

/// 跳过选择点
#[command]
async fn skip_choice(choice_id: String) -> Result<Choice, String>;

// ============================================================
// Character 命令
// ============================================================

/// 获取所有角色
#[command]
async fn list_characters() -> Result<Vec<Character>, String>;

/// 获取单个角色
#[command]
async fn get_character(id: String) -> Result<Option<Character>, String>;

/// 创建自定义角色
#[command]
async fn create_character(
    name: String,
    color: String,
    avatar: String,
    personality: String,
    speaking_style: String,
    capabilities: Vec<String>,
    trigger_conditions: Vec<String>,
    system_prompt: String
) -> Result<Character, String>;

/// 更新角色
#[command]
async fn update_character(
    id: String,
    name: Option<String>,
    color: Option<String>,
    avatar: Option<String>,
    personality: Option<String>,
    speaking_style: Option<String>,
    capabilities: Option<Vec<String>>,
    trigger_conditions: Option<Vec<String>>,
    system_prompt: Option<String>
) -> Result<Character, String>;

/// 删除角色（仅限非内置）
#[command]
async fn delete_character(id: String) -> Result<(), String>;

// ============================================================
// LLM 命令
// ============================================================

/// 测试 LLM 连接
#[command]
async fn test_llm_connection(config: LLMConfigInput) -> Result<ConnectionTestResult, String>;

/// 获取当前 LLM 配置
#[command]
async fn get_llm_config() -> Result<Option<LLMConfig>, String>;

/// 保存 LLM 配置
#[command]
async fn save_llm_config(config: LLMConfigInput) -> Result<(), String>;

// ============================================================
// 文件操作命令
// ============================================================

/// 上传图片
#[command]
async fn upload_image(file_path: String) -> Result<ImageUploadResult, String>;

/// 从剪贴板粘贴图片
#[command]
async fn paste_image() -> Result<Option<ImageUploadResult>, String>;

/// 导出工作区为 JSON
#[command]
async fn export_workspace(workspace_id: String) -> Result<String, String>;

/// 导出讨论为 JSON
#[command]
async fn export_chat(chat_id: String) -> Result<String, String>;

/// 导入工作区
#[command]
async fn import_workspace(json_string: String, generate_new_ids: Option<bool>) -> Result<Workspace, String>;

/// 导入讨论到工作区
#[command]
async fn import_chat(workspace_id: String, json_string: String) -> Result<Chat, String>;

/// 保存导出数据到文件
#[command]
async fn save_export_to_file(data: String, file_path: String) -> Result<(), String>;

/// 从文件加载导出数据
#[command]
async fn load_export_from_file(file_path: String) -> Result<String, String>;

/// 打开文件选择对话框
#[command]
async fn open_file_dialog(filters: Option<Vec<FileFilter>>) -> Result<Option<String>, String>;

/// 保存文件对话框
#[command]
async fn save_file_dialog(
    default_filename: Option<String>,
    filters: Option<Vec<FileFilter>>
) -> Result<Option<String>, String>;

// ============================================================
// 设置命令
// ============================================================

/// 获取设置值
#[command]
async fn get_setting(key: String) -> Result<Option<String>, String>;

/// 保存设置值
#[command]
async fn set_setting(key: String, value: String, group: String) -> Result<(), String>;

/// 获取指定分组的所有设置
#[command]
async fn get_settings_by_group(group: String) -> Result<Vec<Setting>, String>;

/// 删除设置
#[command]
async fn delete_setting(key: String) -> Result<(), String>;

// ============================================================
// 应用命令
// ============================================================

/// 获取应用版本
#[command]
async fn get_app_version() -> Result<String, String>;

/// 获取应用信息
#[command]
async fn get_app_info() -> Result<AppInfo, String>;

/// 打开外部链接
#[command]
async fn open_external_url(url: String) -> Result<(), String>;
```

### 4.2 输入/输出类型

```rust
// src-tauri/src/types.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chat {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub role: String,
    pub character_id: Option<String>,
    pub content: String,
    pub images: Vec<ImageAttachment>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageAttachment {
    pub id: String,
    pub filename: String,
    pub mime_type: String,
    pub data: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageInput {
    pub filename: String,
    pub mime_type: String,
    pub data: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Choice {
    pub id: String,
    pub chat_id: String,
    pub trigger_message_id: Option<String>,
    pub question: String,
    pub options: Vec<ChoiceOption>,
    pub selected_option_id: Option<String>,
    pub status: String,
    pub created_at: String,
    pub resolved_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChoiceOption {
    pub id: String,
    pub label: String,
    pub description: String,
    pub character_preferences: Vec<CharacterPreference>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterPreference {
    pub character_id: String,
    pub leaning: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub id: String,
    pub name: String,
    pub color: String,
    pub avatar: String,
    pub personality: String,
    pub speaking_style: String,
    pub capabilities: Vec<String>,
    pub trigger_conditions: Vec<String>,
    pub system_prompt: String,
    pub is_builtin: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub id: String,
    pub key: String,
    pub value: String,
    pub group_name: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMConfigInput {
    pub provider: String,
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub temperature: Option<f64>,
    pub max_tokens: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMConfig {
    pub provider: String,
    pub base_url: String,
    pub model: String,
    pub temperature: Option<f64>,
    pub max_tokens: Option<i32>,
    // 注意：不返回 api_key
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionTestResult {
    pub success: bool,
    pub error: Option<String>,
    pub latency_ms: Option<i64>,
    pub available_models: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscussionResult {
    pub messages: Vec<Message>,
    pub choice: Option<Choice>,
    pub converged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageUploadResult {
    pub id: String,
    pub filename: String,
    pub mime_type: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub version: String,
    pub name: String,
    pub os: String,
}
```

### 4.3 前端调用示例

```typescript
// src/api/commands.ts

import { invoke } from '@tauri-apps/api/tauri';

// ============================================================
// Workspace
// ============================================================

export const workspaceApi = {
  create: (name: string, description?: string) =>
    invoke<Workspace>('create_workspace', { name, description }),

  list: () =>
    invoke<Workspace[]>('list_workspaces'),

  get: (id: string) =>
    invoke<Workspace | null>('get_workspace', { id }),

  update: (id: string, updates: { name?: string; description?: string }) =>
    invoke<Workspace>('update_workspace', { id, ...updates }),

  delete: (id: string) =>
    invoke<void>('delete_workspace', { id }),
};

// ============================================================
// Chat
// ============================================================

export const chatApi = {
  create: (workspaceId: string, title?: string) =>
    invoke<Chat>('create_chat', { workspace_id: workspaceId, title }),

  list: (workspaceId: string) =>
    invoke<Chat[]>('list_chats', { workspace_id: workspaceId }),

  get: (id: string) =>
    invoke<Chat | null>('get_chat', { id }),

  update: (id: string, updates: { title?: string; status?: string }) =>
    invoke<Chat>('update_chat', { id, ...updates }),

  delete: (id: string) =>
    invoke<void>('delete_chat', { id }),
};

// ============================================================
// Message
// ============================================================

export const messageApi = {
  send: (chatId: string, content: string, images?: ImageInput[]) =>
    invoke<DiscussionResult>('send_message', {
      chat_id: chatId,
      content,
      images: images || [],
    }),

  list: (chatId: string, options?: { limit?: number; offset?: number; order?: string }) =>
    invoke<Message[]>('list_messages', {
      chat_id: chatId,
      ...options,
    }),

  delete: (id: string) =>
    invoke<void>('delete_message', { id }),
};

// ============================================================
// Choice
// ============================================================

export const choiceApi = {
  getPending: (chatId: string) =>
    invoke<Choice | null>('get_pending_choice', { chat_id: chatId }),

  submit: (choiceId: string, selectedOptionId: string) =>
    invoke<Choice>('submit_choice', {
      choice_id: choiceId,
      selected_option_id: selectedOptionId,
    }),

  skip: (choiceId: string) =>
    invoke<Choice>('skip_choice', { choice_id: choiceId }),
};

// ============================================================
// Character
// ============================================================

export const characterApi = {
  list: () =>
    invoke<Character[]>('list_characters'),

  get: (id: string) =>
    invoke<Character | null>('get_character', { id }),

  create: (character: CreateCharacterInput) =>
    invoke<Character>('create_character', character),

  update: (id: string, updates: UpdateCharacterInput) =>
    invoke<Character>('update_character', { id, ...updates }),

  delete: (id: string) =>
    invoke<void>('delete_character', { id }),
};

// ============================================================
// LLM
// ============================================================

export const llmApi = {
  testConnection: (config: LLMConfigInput) =>
    invoke<ConnectionTestResult>('test_llm_connection', { config }),

  getConfig: () =>
    invoke<LLMConfig | null>('get_llm_config'),

  saveConfig: (config: LLMConfigInput) =>
    invoke<void>('save_llm_config', { config }),
};

// ============================================================
// File
// ============================================================

export const fileApi = {
  uploadImage: (filePath: string) =>
    invoke<ImageUploadResult>('upload_image', { file_path: filePath }),

  pasteImage: () =>
    invoke<ImageUploadResult | null>('paste_image'),

  exportWorkspace: (workspaceId: string) =>
    invoke<string>('export_workspace', { workspace_id: workspaceId }),

  exportChat: (chatId: string) =>
    invoke<string>('export_chat', { chat_id: chatId }),

  importWorkspace: (jsonString: string, generateNewIds?: boolean) =>
    invoke<Workspace>('import_workspace', {
      json_string: jsonString,
      generate_new_ids: generateNewIds,
    }),

  importChat: (workspaceId: string, jsonString: string) =>
    invoke<Chat>('import_chat', {
      workspace_id: workspaceId,
      json_string: jsonString,
    }),

  saveToFile: (data: string, filePath: string) =>
    invoke<void>('save_export_to_file', { data, file_path: filePath }),

  loadFromFile: (filePath: string) =>
    invoke<string>('load_export_from_file', { file_path: filePath }),

  openFileDialog: (filters?: FileFilter[]) =>
    invoke<string | null>('open_file_dialog', { filters }),

  saveFileDialog: (defaultFilename?: string, filters?: FileFilter[]) =>
    invoke<string | null>('save_file_dialog', {
      default_filename: defaultFilename,
      filters,
    }),
};

// ============================================================
// Settings
// ============================================================

export const settingsApi = {
  get: (key: string) =>
    invoke<string | null>('get_setting', { key }),

  set: (key: string, value: string, group: string) =>
    invoke<void>('set_setting', { key, value, group }),

  getByGroup: (group: string) =>
    invoke<Setting[]>('get_settings_by_group', { group }),

  delete: (key: string) =>
    invoke<void>('delete_setting', { key }),
};

// ============================================================
// App
// ============================================================

export const appApi = {
  getVersion: () =>
    invoke<string>('get_app_version'),

  getInfo: () =>
    invoke<AppInfo>('get_app_info'),

  openExternalUrl: (url: string) =>
    invoke<void>('open_external_url', { url }),
};
```

---

## 5. 错误处理策略

### 5.1 错误类型定义

```typescript
// src/types/errors.ts

/**
 * 应用错误基类
 */
class AppError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

/**
 * 数据库错误
 */
class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super('DATABASE_ERROR', message, details);
    this.name = 'DatabaseError';
  }
}

/**
 * LLM 调用错误
 */
class LLMError extends AppError {
  provider: string;
  statusCode?: number;

  constructor(
    message: string,
    provider: string,
    statusCode?: number,
    details?: unknown
  ) {
    super('LLM_ERROR', message, details);
    this.name = 'LLMError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

/**
 * 配置错误
 */
class ConfigError extends AppError {
  constructor(message: string, details?: unknown) {
    super('CONFIG_ERROR', message, details);
    this.name = 'ConfigError';
  }
}

/**
 * 文件操作错误
 */
class FileError extends AppError {
  constructor(message: string, details?: unknown) {
    super('FILE_ERROR', message, details);
    this.name = 'FileError';
  }
}

/**
 * 验证错误
 */
class ValidationError extends AppError {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super('VALIDATION_ERROR', message, { fields });
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * 讨论引擎错误
 */
class EngineError extends AppError {
  constructor(message: string, details?: unknown) {
    super('ENGINE_ERROR', message, details);
    this.name = 'EngineError';
  }
}
```

### 5.2 错误处理策略

#### 5.2.1 LLM 调用错误处理

```typescript
// src/llm/error-handler.ts

/**
 * LLM 错误处理策略
 */
const LLM_ERROR_STRATEGIES: Record<string, ErrorStrategy> = {
  // 网络错误
  'NETWORK_ERROR': {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    fallback: 'show_error'
  },
  // API Key 无效
  'INVALID_API_KEY': {
    maxRetries: 0,
    fallback: 'prompt_config'
  },
  // 模型不存在
  'MODEL_NOT_FOUND': {
    maxRetries: 0,
    fallback: 'prompt_config'
  },
  // 请求过于频繁
  'RATE_LIMIT': {
    maxRetries: 5,
    retryDelay: 5000,
    backoffMultiplier: 2,
    fallback: 'queue_request'
  },
  // 服务器错误
  'SERVER_ERROR': {
    maxRetries: 2,
    retryDelay: 2000,
    backoffMultiplier: 2,
    fallback: 'show_error'
  },
  // 超时
  'TIMEOUT': {
    maxRetries: 2,
    retryDelay: 1000,
    fallback: 'show_error'
  },
  // 内容过滤
  'CONTENT_FILTER': {
    maxRetries: 0,
    fallback: 'show_warning'
  }
};

interface ErrorStrategy {
  maxRetries: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  fallback: 'show_error' | 'prompt_config' | 'queue_request' | 'show_warning' | 'use_cache';
}

/**
 * 处理 LLM 错误
 */
async function handleLLMError(
  error: LLMError,
  context: {
    retryCount: number;
    characterId: string;
    chatId: string;
  }
): Promise<LLMErrorResponse> {
  const strategy = LLM_ERROR_STRATEGIES[error.code] || {
    maxRetries: 0,
    fallback: 'show_error'
  };

  // 检查是否可以重试
  if (context.retryCount < strategy.maxRetries) {
    const delay = strategy.retryDelay! * Math.pow(
      strategy.backoffMultiplier || 1,
      context.retryCount
    );
    
    return {
      action: 'retry',
      delay,
      message: `正在重试... (${context.retryCount + 1}/${strategy.maxRetries})`
    };
  }

  // 执行降级策略
  switch (strategy.fallback) {
    case 'prompt_config':
      return {
        action: 'open_settings',
        message: 'LLM 配置有误，请检查设置'
      };

    case 'show_error':
      return {
        action: 'show_error',
        message: `LLM 调用失败: ${error.message}`
      };

    case 'show_warning':
      return {
        action: 'show_warning',
        message: `内容被过滤: ${error.message}`
      };

    default:
      return {
        action: 'show_error',
        message: '发生未知错误'
      };
  }
}

interface LLMErrorResponse {
  action: 'retry' | 'open_settings' | 'show_error' | 'show_warning';
  delay?: number;
  message: string;
}
```

#### 5.2.2 讨论引擎降级策略

```typescript
// src/engine/fallback.ts

/**
 * 讨论引擎降级策略
 * 当 LLM 调用失败时，引擎仍要能给出保守结果
 */
class DiscussionFallback {
  /**
   * 生成降级回复
   * 当 LLM 不可用时，使用预设模板
   */
  static generateFallbackResponse(
    characterId: string,
    context: DiscussionContext
  ): string {
    const templates = FALLBACK_TEMPLATES[characterId];
    
    // 根据上下文选择合适的模板
    if (context.turn_number === 0) {
      return templates.initial;
    }

    if (context.activeChoice) {
      return templates.afterChoice;
    }

    return templates.generic;
  }

  /**
   * 生成降级选择点
   * 当无法通过 LLM 生成选择点时，使用通用选项
   */
  static generateFallbackChoice(
    chatId: string,
    context: DiscussionContext
  ): Choice {
    return {
      id: generateId(),
      chat_id: chatId,
      question: '讨论到这里，你想怎么继续？',
      options: [
        {
          id: generateId(),
          label: 'A',
          description: '继续深入讨论当前问题',
          character_preferences: [
            { character_id: 'xiao-lin', leaning: 'prefer' }
          ]
        },
        {
          id: generateId(),
          label: 'B',
          description: '换个角度重新审视',
          character_preferences: [
            { character_id: 'lao-chen', leaning: 'prefer' }
          ]
        },
        {
          id: generateId(),
          label: 'C',
          description: '先做个总结，下次继续',
          character_preferences: [
            { character_id: 'a-zhe', leaning: 'prefer' }
          ]
        }
      ],
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }
}

/**
 * 降级回复模板
 */
const FALLBACK_TEMPLATES: Record<string, Record<string, string>> = {
  'xiao-lin': {
    initial: '我先了解一下，你说的这个问题具体是什么情况？',
    afterChoice: '你做了选择，那我们继续。能补充一下背景信息吗？',
    generic: '我有个疑问，能再详细说说吗？'
  },
  'lao-chen': {
    initial: '这个问题你有相关的数据或案例吗？',
    afterChoice: '好，方向定了。你有做过类似的调研吗？',
    generic: '我需要更多信息才能给出建议。'
  },
  'a-zhe': {
    initial: '先理清楚，你要解决的核心问题是什么？',
    afterChoice: '选择确认了，下一步你打算怎么做？',
    generic: '我们说了不少，你觉得最重要的点是什么？'
  }
};
```

#### 5.2.3 数据库错误处理

```typescript
// src/store/error-handler.ts

/**
 * 数据库错误处理
 */
class DatabaseErrorHandler {
  /**
   * 处理数据库错误
   */
  static handle(error: Error): DatabaseError {
    // 解析 SQLite 错误
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return new DatabaseError(
        '关联数据不存在',
        { originalError: error.message }
      );
    }

    if (error.message.includes('UNIQUE constraint failed')) {
      return new DatabaseError(
        '数据已存在',
        { originalError: error.message }
      );
    }

    if (error.message.includes('database is locked')) {
      return new DatabaseError(
        '数据库正在被占用，请稍后重试',
        { originalError: error.message }
      );
    }

    // 默认错误
    return new DatabaseError(
      '数据库操作失败',
      { originalError: error.message }
    );
  }

  /**
   * 包装数据库操作，统一错误处理
   */
  static async wrap<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.handle(error as Error);
    }
  }
}
```

#### 5.2.4 前端错误处理

```typescript
// src/hooks/useError.ts

import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

interface ErrorState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
}

export function useError() {
  const [state, setState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
  });

  const handleError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error,
      isRetrying: false,
    }));

    // 根据错误类型显示不同的提示
    if (error instanceof LLMError) {
      toast({
        title: 'LLM 调用失败',
        description: error.message,
        variant: 'destructive',
        action: error.code === 'INVALID_API_KEY' ? (
          <Button onClick={() => openSettings('llm')}>
            检查配置
          </Button>
        ) : undefined,
      });
    } else if (error instanceof DatabaseError) {
      toast({
        title: '数据错误',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '发生错误',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, []);

  const retry = useCallback(async (operation: () => Promise<void>) => {
    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      await operation();
      setState({
        error: null,
        isRetrying: false,
        retryCount: 0,
      });
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
    });
  }, []);

  return {
    ...state,
    handleError,
    retry,
    clearError,
  };
}
```

### 5.3 错误恢复流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        发生错误                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────┴─────────┐
                    │   错误类型判断      │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  LLM 错误     │   │  数据库错误    │   │  其他错误      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ 可重试？       │   │ 记录日志       │   │ 显示错误       │
│  - 网络错误    │   │ 显示友好提示   │   │ 提供重试       │
│  - 限流       │   │ 提供操作建议   │   │               │
│  - 服务器错误  │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        重试机制                                  │
│  - 指数退避（1s → 2s → 4s）                                      │
│  - 最大重试次数（3 次）                                          │
│  - 显示重试进度                                                  │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        降级方案                                  │
│  - 使用预设模板回复                                              │
│  - 生成通用选择点                                                │
│  - 允许用户手动重试                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 错误日志

```typescript
// src/utils/logger.ts

import { invoke } from '@tauri-apps/api/tauri';

interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  module: string;
  message: string;
  details?: unknown;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  error(module: string, message: string, error?: Error) {
    this.log({
      level: 'error',
      module,
      message,
      details: error?.message,
      stack: error?.stack,
    });
  }

  warn(module: string, message: string, details?: unknown) {
    this.log({
      level: 'warn',
      module,
      message,
      details,
    });
  }

  info(module: string, message: string, details?: unknown) {
    this.log({
      level: 'info',
      module,
      message,
      details,
    });
  }

  debug(module: string, message: string, details?: unknown) {
    this.log({
      level: 'debug',
      module,
      message,
      details,
    });
  }

  private log(entry: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console[entry.level](
        `[${entry.module}] ${entry.message}`,
        entry.details || ''
      );
    }

    // 错误级别日志持久化
    if (entry.level === 'error') {
      this.persistLog(logEntry);
    }
  }

  private async persistLog(entry: LogEntry) {
    try {
      await invoke('save_log', { entry });
    } catch {
      // 日志保存失败不应影响正常功能
      console.error('Failed to persist log:', entry);
    }
  }

  getLogs(level?: string, limit?: number): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    return filtered;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
```

---

## 附录 A：配置文件结构

### A.1 场景包配置示例

```typescript
// src/scenarios/pm-discussion/triggers.ts

export const triggers = {
  // 分歧检测阈值 (0-1)
  divergence_threshold: 0.6,
  
  // 最大讨论轮次（超过后建议收敛）
  max_turns_before_converge: 6,
  
  // 是否需要方向确认
  direction_confirm: true,
  
  // 选择点触发条件
  choice_triggers: {
    // NPC 分歧时
    on_divergence: true,
    // 讨论超过 N 轮时
    after_turns: 4,
    // 用户要求选择时
    on_user_request: true,
  },
  
  // 收敛条件
  convergence: {
    // 用户做出选择后
    after_choice: true,
    // 核心问题明确后
    when_clear: true,
    // 最少讨论轮次
    min_turns: 2,
  }
};
```

### A.2 默认设置

```typescript
// src/config/defaults.ts

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  base_url: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 1024,
};

export const DEFAULT_UI_CONFIG: UIConfig = {
  theme: 'system',
  font_size: 'medium',
  message_delay_ms: 500,
};

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  max_turns: 8,
  divergence_threshold: 0.6,
  npc_interval_ms: 1500,
};
```

---

## 附录 B：数据库初始化脚本

```sql
-- src-tauri/migrations/001_init.sql

-- 完整的建表语句（见 1.2 节）

-- 插入默认 NPC 数据
INSERT INTO character (id, name, color, avatar, personality, speaking_style, capabilities, trigger_conditions, system_prompt, is_builtin) VALUES
(
  'xiao-lin',
  '小林',
  '#22c55e',
  '🟢',
  '追问问题，把事情想清楚',
  '直接、爱追问、偶尔有点尖锐但出发点是好的',
  '["识别方案先行", "拆解模糊需求", "追问假设", "识别 YY"]',
  '["用户直接提方案，没有说明问题", "用户用了过于自信的词", "用户的描述过于模糊", "讨论太快进入方案阶段"]',
  '...',
  1
),
(
  'lao-chen',
  '老陈',
  '#3b82f6',
  '🔵',
  '看事实、看数据、看现实',
  '沉稳、务实、喜欢用数据和案例说话',
  '["追问证据", "关联历史", "评估可行性", "识别信息缺失"]',
  '["用户做了判断但没有数据支撑", "讨论涉及竞品或市场情况", "需要评估可行性和成本", "有类似的过往案例可以参考"]',
  '...',
  1
),
(
  'a-zhe',
  '阿哲',
  '#a855f7',
  '🟣',
  '收敛讨论、排优先级、做判断',
  '简洁、果断、喜欢列选项',
  '["收敛讨论", "排优先级", "给结论", "做取舍"]',
  '["讨论已经进行了好几轮，需要收敛", "小林和老陈有明显分歧", "需要做优先级判断", "用户需要做选择"]',
  '...',
  1
);

-- 插入默认设置
INSERT INTO setting (id, key, value, group_name) VALUES
('setting-1', 'llm.provider', '"openai"', 'llm'),
('setting-2', 'llm.base_url', '"https://api.openai.com/v1"', 'llm'),
('setting-3', 'llm.model', '"gpt-4o"', 'llm'),
('setting-4', 'llm.temperature', '0.7', 'llm'),
('setting-5', 'llm.max_tokens', '1024', 'llm'),
('setting-6', 'ui.theme', '"system"', 'ui'),
('setting-7', 'ui.font_size', '"medium"', 'ui'),
('setting-8', 'ui.message_delay_ms', '500', 'ui'),
('setting-9', 'engine.max_turns', '8', 'engine'),
('setting-10', 'engine.divergence_threshold', '0.6', 'engine'),
('setting-11', 'engine.npc_interval_ms', '1500', 'engine');
```

---

## 附录 C：开发规范

### C.1 命名规范

- **TypeScript**：camelCase（变量、函数）、PascalCase（类、接口、类型）
- **Rust**：snake_case（变量、函数）、PascalCase（结构体、枚举）
- **SQL**：snake_case（表名、列名）
- **UUID**：使用 v4 格式，存储为 TEXT

### C.2 文件组织

```
src/
├── types/           # TypeScript 类型定义
│   ├── index.ts     # 导出所有类型
│   ├── workspace.ts
│   ├── chat.ts
│   ├── message.ts
│   ├── choice.ts
│   ├── character.ts
│   ├── setting.ts
│   └── errors.ts
│
├── engine/          # 讨论引擎
│   ├── discussion.ts
│   ├── divergence.ts
│   ├── choice.ts
│   └── fallback.ts
│
├── llm/             # LLM 层
│   ├── provider.ts
│   ├── openai.ts
│   ├── claude.ts
│   └── factory.ts
│
├── store/           # 存储层
│   ├── database.ts
│   ├── export.ts
│   └── error-handler.ts
│
├── scenarios/       # 场景包
│   └── pm-discussion/
│       ├── index.ts
│       ├── characters.ts
│       ├── prompts.ts
│       └── triggers.ts
│
├── api/             # Tauri 命令调用
│   └── commands.ts
│
├── hooks/           # React Hooks
│   ├── useChat.ts
│   ├── useWorkspace.ts
│   └── useError.ts
│
├── components/      # UI 组件
│   ├── ChatWindow.tsx
│   ├── MessageBubble.tsx
│   ├── ChoiceCard.tsx
│   └── Settings.tsx
│
├── utils/           # 工具函数
│   ├── logger.ts
│   └── id.ts
│
└── config/          # 配置
    └── defaults.ts
```

### C.3 测试策略

- **单元测试**：使用 Vitest，覆盖核心业务逻辑
- **集成测试**：测试模块间交互
- **端到端测试**：使用 seed-cases.md 中的样本验证

---

*文档完成日期：2026-05-19*
*版本：v1.0*
