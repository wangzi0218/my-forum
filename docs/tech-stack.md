# 技术栈

## 总览

```
桌面应用：Tauri2 + Rust
前端：React + TypeScript + Tailwind CSS + shadcn/ui
存储：SQLite（本地）+ JSON（导出/备份）
LLM：OpenAI 格式 / Claude 格式（用户自配 API）
```

## 为什么选 Tauri2

- 跨平台：macOS、Windows、Linux 一套代码
- 轻量：比 Electron 小很多，启动快
- 原生能力：可以直接调系统 API
- 安全：Rust 后端，内存安全
- SQLite 支持：Tauri 原生支持 SQLite 插件

## 为什么选 React + TypeScript

- 生态成熟：组件库、工具链完善
- TypeScript：类型安全，减少运行时错误
- shadcn/ui：高质量组件，可定制，不锁定
- Tailwind CSS：快速开发，一致性好

## 存储方案

### SQLite（主存储）

存储结构化数据：
- workspace：工作区
- chat：讨论记录
- message：消息
- choice：选择点
- character：NPC 配置
- setting：用户设置

### JSON（导出/备份）

每个 workspace 可以导出为完整 JSON 文件：
```json
{
  "version": 1,
  "scenario": "pm-discussion",
  "workspace": {
    "name": "HIS 项目",
    "chats": [
      {
        "title": "新用户发帖问题",
        "messages": [...],
        "choices": [...]
      }
    ]
  }
}
```

JSON 可读、可 diff、可以用 Git 管理版本。

### 同步（后续）

第一版不做同步。后续方案按成本从低到高：
1. JSON + Git：用户自己管，零成本
2. WebDAV：坚果云之类的，应用内配置
3. 自建同步：后面再说

## LLM 调用

### 两种 API 格式

**OpenAI 格式**
```
POST /v1/chat/completions
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": [
      {"type": "text", "text": "..."},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
    ]}
  ]
}
```

**Claude 格式**
```
POST /v1/messages
{
  "model": "claude-sonnet-4-20250514",
  "messages": [
    {"role": "user", "content": [
      {"type": "text", "text": "..."},
      {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "..."}}
    ]}
  ]
}
```

### 用户配置

设置页面：
- 提供商选择：OpenAI / Claude
- API 地址（支持自定义 base URL，兼容代理）
- API Key
- 模型名称
- 测试连接按钮

### 图片处理

- 用户上传图片 → 存本地文件 → 转 base64
- base64 传给 LLM API
- 图片在聊天气泡中直接显示
- 支持粘贴（Ctrl/Cmd+V）和拖拽

## 目录结构

```
pm-workflow-harness/
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs
│   │   ├── db.rs           # SQLite 操作
│   │   └── commands.rs     # Tauri 命令
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                    # React 前端
│   ├── engine/             # 讨论引擎
│   │   ├── discussion.ts
│   │   ├── divergence.ts
│   │   └── choice.ts
│   │
│   ├── llm/                # LLM 调用层
│   │   ├── provider.ts     # 统一接口
│   │   ├── openai.ts
│   │   └── claude.ts
│   │
│   ├── store/              # 前端状态管理
│   │   ├── workspace.ts
│   │   ├── chat.ts
│   │   └── settings.ts
│   │
│   ├── scenarios/          # 场景包
│   │   └── pm-discussion/
│   │       ├── index.ts
│   │       ├── characters.ts
│   │       ├── prompts.ts
│   │       ├── triggers.ts
│   │       └── topics.ts
│   │
│   ├── components/         # UI 组件
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChoiceCard.tsx
│   │   ├── ImageUpload.tsx
│   │   └── Settings.tsx
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── tests/                  # 测试用例
│   └── acceptance/
│
├── docs/                   # 文档
├── examples/               # 对话样本
└── package.json
```

## 开发工具

- 包管理：pnpm
- 构建：Vite（Tauri2 默认）
- 代码规范：ESLint + Prettier
- 测试：Vitest（前端）+ cargo test（Rust）
