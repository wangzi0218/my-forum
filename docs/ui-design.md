# PM Workflow Harness — UI 设计文档

## 设计原则

```
群聊即界面，讨论即产品。
```

- 界面就是一个群聊 IM，足够轻
- 不显示方法论名称、阶段状态、系统术语
- NPC 讨论有节奏地出现，一个接一个
- 分歧时出现选择卡片
- 用户以选择为主、打字为辅
- 本地优先，桌面应用气质

---

## 1. 页面布局

### 1.1 应用整体布局

```
┌──────────────────────────────────────────────────────────────────┐
│  Title Bar (Tauri 原生，macOS 沉浸式)                             │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                       │
│  侧边栏   │                  主聊天区域                            │
│  280px   │                                                       │
│          │  ┌─────────────────────────────────────────────────┐  │
│ ┌──────┐ │  │  消息流                                          │  │
│ │工作区 │ │  │                                                 │  │
│ │列表   │ │  │  [用户消息]                                      │  │
│ ├──────┤ │  │  [小林消息]                                      │  │
│ │讨论   │ │  │  [老陈消息]                                      │  │
│ │历史   │ │  │  [阿哲消息]                                      │  │
│ │列表   │ │  │  [选择卡片]                                      │  │
│ │       │ │  │                                                 │  │
│ │       │ │  │                                                 │  │
│ ├──────┤ │  ├─────────────────────────────────────────────────┤  │
│ │新建   │ │  │  输入区域                                        │  │
│ │讨论   │ │  │  [图片] [文字输入框                    ] [发送]  │  │
│ │+设置  │ │  └─────────────────────────────────────────────────┘  │
│ └──────┘ │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

**布局说明：**

- Title Bar：使用 Tauri 原生标题栏，macOS 下为沉浸式（内容延伸到标题栏区域）
- 侧边栏：固定宽度 280px，包含工作区列表、讨论历史、底部操作区
- 主聊天区域：自适应宽度，占据剩余空间
- 消息流：可滚动区域，消息从上到下排列
- 输入区域：固定在底部，不随消息滚动

### 1.2 侧边栏布局

```
┌──────────────────────┐
│                      │
│  PM Workflow Harness  │  ← 应用名称，简洁
│                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                      │
│  📁 HIS 项目          │  ← 工作区标题（可折叠）
│     ├ 新用户发帖问题   │  ← 讨论项
│     ├ 导出报表需求     │
│     └ 核销流程优化     │
│                      │
│  📁 内部工具           │
│     └ 权限管理重构     │
│                      │
│                      │
│                      │
│                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                      │
│  [+ 新建讨论]         │  ← 主操作按钮
│  [⚙ 设置]            │  ← 次要操作
│                      │
└──────────────────────┘
```

**侧边栏细节：**

- 工作区标题可折叠/展开，显示该工作区下的讨论列表
- 讨论项显示标题和最后活跃时间
- 当前选中的讨论高亮显示
- 底部固定：新建讨论按钮 + 设置入口
- 悬浮时显示删除/导出操作（图标按钮）

### 1.3 设置页面

设置页面以模态对话框形式呈现（从右侧滑入），不离开当前讨论。

```
┌──────────────────────────────────────────────────────────────────┐
│  Title Bar                                                       │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                            ┌─────────┤
│  侧边栏   │                                            │ 设置     │
│          │                                            │         │
│          │                                            │ LLM 配置 │
│          │                                            │ --------│
│          │                                            │ 提供商   │
│          │                                            │ API 地址 │
│          │                                            │ API Key  │
│          │                                            │ 模型     │
│          │                                            │ [测试]   │
│          │                                            │         │
│          │                                            │ 偏好设置 │
│          │                                            │ --------│
│          │                                            │ 深色模式 │
│          │                                            │ 字号     │
│          │                                            │         │
│          │                                            │ [保存]   │
│          │                                            └─────────┤
└──────────┴───────────────────────────────────────────────────────┘
```

---

## 2. 组件层次结构

```
App
├── Sidebar
│   ├── SidebarHeader          // 应用名称
│   ├── WorkspaceList          // 工作区列表
│   │   └── WorkspaceItem[]    // 单个工作区（可折叠）
│   │       └── ChatItem[]     // 讨论项
│   ├── NewChatButton          // 新建讨论
│   └── SettingsButton         // 设置入口
│
├── ChatView                   // 主聊天区域
│   ├── ChatHeader             // 讨论标题栏
│   │   ├── ChatTitle          // 讨论标题
│   │   └── ChatActions        // 导出等操作
│   │
│   ├── MessageList            // 消息列表（可滚动）
│   │   └── MessageItem[]      // 消息项（多态）
│   │       ├── UserMessage     // 用户消息
│   │       ├── NPCMessage      // NPC 消息
│   │       ├── ImageMessage    // 图片消息
│   │       ├── ChoiceCard      // 选择点卡片
│   │       └── SystemNotice    // 系统提示（轻量）
│   │
│   └── InputArea              // 输入区域
│       ├── ImageUploadButton  // 图片上传按钮
│       ├── TextInput          // 文字输入框
│       └── SendButton         // 发送按钮
│
├── SettingsPanel              // 设置面板（模态）
│   ├── LLMConfig              // LLM 配置
│   │   ├── ProviderSelect     // 提供商选择
│   │   ├── BaseURLInput       // API 地址
│   │   ├── APIKeyInput        // API Key
│   │   ├── ModelInput         // 模型名称
│   │   └── TestConnection     // 测试连接
│   └── Preferences            // 偏好设置
│       ├── ThemeToggle        // 深色/浅色模式
│       └── FontSizeSelect     // 字号选择
│
└── EmptyState                 // 空状态（无讨论时）
```

---

## 3. 核心组件详细设计

### 3.1 MessageItem（消息项）

消息项是一个多态组件，根据消息类型渲染不同的子组件。

**通用容器结构：**

```
┌─────────────────────────────────────────────┐
│  [头像]  NPC 名称                   时间     │  ← 消息头部（NPC 消息）
│         ┌─────────────────────────────┐     │
│         │  消息内容                    │     │  ← 消息气泡
│         │                             │     │
│         └─────────────────────────────┘     │
└─────────────────────────────────────────────┘

                              ┌────────────────┐
                  时间        │  消息内容       │  ← 用户消息（右对齐）
                              └────────────────┘
```

#### 3.1.1 NPC 消息

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ●  小林                                        14:32       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  等等，新用户不发帖的原因你确认过吗？                      │   │
│  │  是不知道怎么发，还是没动力发？                           │   │
│  │  这两个问题的解法完全不一样。                             │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ●  老陈                                        14:33       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  我看过类似的数据，大多数时候是首页信息太杂，               │   │
│  │  用户找不到发帖入口。                                   │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**NPC 消息样式规范：**

| 属性 | 值 |
|------|-----|
| 头像 | 圆形色块，直径 32px，使用 NPC 主色 |
| NPC 名称 | 14px，font-weight: 600，使用 NPC 主色 |
| 消息气泡 | 左对齐，最大宽度 70% |
| 气泡背景 | 浅色模式：NPC 主色 8% 透明度；深色模式：NPC 主色 12% 透明度 |
| 气泡边框 | 1px，NPC 主色 15% 透明度 |
| 气泡圆角 | 12px，左上角 4px（指向发送者） |
| 气泡内边距 | 12px 16px |
| 消息文字 | 15px，line-height: 1.6 |
| 时间戳 | 12px，灰色，紧随 NPC 名称右侧 |

#### 3.1.2 用户消息

```
                                              ┌──────────────────┐
                                              │                  │
                                              │ 运营想在新用户进   │
                                              │ 首页时加一个引导   │
                                              │ 浮层，提升首日     │
                                              │ 发帖率。          │
                                              │                  │
                                              └──────────────────┘
                                                              14:30
```

**用户消息样式规范：**

| 属性 | 值 |
|------|-----|
| 对齐 | 右对齐 |
| 气泡背景 | 浅色模式：`#f0f0f0`；深色模式：`#2a2a2a` |
| 气泡圆角 | 12px，右上角 4px |
| 气泡最大宽度 | 70% |
| 消息文字 | 15px，使用主文字色 |
| 时间戳 | 12px，灰色，在气泡下方右对齐 |

#### 3.1.3 NPC 互相引用

当 NPC 引用另一个 NPC 的观点时，在消息开头显示引用指示。

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ●  阿哲                                        14:35       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ┌─ 引用小林 ─────────────────────────────────────┐  │   │
│  │  │ "新用户不发帖的原因你确认过吗？"                  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  小林说得对。如果问题不在入口，浮层做了也白做。         │   │
│  │  ...                                                 │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**引用样式：**

| 属性 | 值 |
|------|-----|
| 引用块 | 气泡内顶部，灰色背景，左侧 2px 色条（被引用 NPC 的颜色） |
| 引用文字 | 13px，灰色，截取前 30 字符 + "..." |
| 引用标签 | "引用 + NPC 名称"，12px，NPC 颜色 |

#### 3.1.4 图片消息

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ●  老陈                                        14:40       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  我看了这个截图。他们的首页信息密度很低。                 │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────┐                   │   │
│  │  │                                │                   │   │
│  │  │        [图片预览]               │                   │   │
│  │  │         max 300px              │                   │   │
│  │  │                                │                   │   │
│  │  └────────────────────────────────┘                   │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**用户发送的图片：**

```
                                              ┌──────────────────┐
                                              │                  │
                                              │  你看这个产品的   │
                                              │  首页设计。       │
                                              │                  │
                                              │  ┌────────────┐  │
                                              │  │            │  │
                                              │  │ [图片预览]  │  │
                                              │  │            │  │
                                              │  └────────────┘  │
                                              │                  │
                                              └──────────────────┘
```

**图片样式规范：**

| 属性 | 值 |
|------|-----|
| 图片最大宽度 | 300px |
| 图片最大高度 | 200px |
| 图片圆角 | 8px |
| 图片适配 | object-fit: cover，居中裁切 |
| 点击行为 | 点击打开全屏预览（lightbox） |
| 多图排列 | 水平排列，间距 8px，最多显示 3 张 |

### 3.2 ChoiceCard（选择点卡片）

选择点是整个产品最关键的交互组件。它出现在 NPC 讨论产生分歧时，把选择权交给用户。

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ⚡ 选择                                                          │
│                                                                  │
│  两个方向，你选：                                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  A. 先拉数据看新用户路径，确认卡点再决定方案                  │  │
│  │                                                            │  │
│  │  🟢 小林倾向    🔵 老陈觉得也可以                            │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  B. 先做个轻量 AB 测试浮层效果，边做边看                     │  │
│  │                                                            │  │
│  │  🔵 老陈觉得也可以                                          │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**用户选择后：**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ⚡ 选择                                                          │
│                                                                  │
│  两个方向，你选：                                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ✓  A. 先拉数据看新用户路径，确认卡点再决定方案              │  │
│  │                                                            │  │
│  │  🟢 小林倾向    🔵 老陈觉得也可以                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │     B. 先做个轻量 AB 测试浮层效果，边做边看                   │  │
│  │                                                            │  │
│  │  🔵 老陈觉得也可以                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  你选择了 A                                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**选择卡片样式规范：**

| 属性 | 值 |
|------|-----|
| 卡片容器 | 居中显示，宽度 100%，浅色模式背景 `#fafafa`，深色模式 `#1a1a1a` |
| 卡片边框 | 1px `#e5e5e5`（浅色）/ `#333`（深色） |
| 卡片圆角 | 12px |
| 卡片内边距 | 20px |
| 标题区 | "⚡ 选择" 标签，14px，font-weight: 600，灰色 |
| 问题描述 | 16px，font-weight: 500，主文字色 |
| 选项卡片 | 独立卡片，带 hover 效果，cursor: pointer |
| 选项卡片圆角 | 8px |
| 选项卡片内边距 | 16px |
| 选项卡片边框 | 1px `#e5e5e5`（浅色）/ `#333`（深色） |
| 选项卡片 hover | 背景色变深 3%，边框色变为主题色 50% |
| 选中状态 | 左侧 3px 色条（主题色），背景主题色 8%，边框主题色 30% |
| NPC 倾向指示 | 小色点 + NPC 名称，12px |
| 已选择后 | 未选中项降低对比度（opacity: 0.5），选中项高亮 |
| 禁用状态 | 已选择后不可更改，cursor: default |

### 3.3 InputArea（输入区域）

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────┐                                                          │
│  │ 📎 │  在这里输入你的想法、反馈、或贴一张图...     ┌────┐       │
│  └────┘                                              │ ➤  │       │
│                                                      └────┘       │
│                                                                  │
│  [已附加图片缩略图 1] [已附加图片缩略图 2] [×]                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**输入区域样式规范：**

| 属性 | 值 |
|------|-----|
| 容器 | 固定在聊天区域底部，背景色与页面一致 |
| 容器边框 | 顶部 1px 分割线 |
| 容器内边距 | 16px 20px |
| 图片上传按钮 | 36px 圆形，图标 `Paperclip`，灰色，hover 变主色 |
| 文字输入框 | 自适应高度（最多 4 行），无边框，placeholder 灰色 |
| 发送按钮 | 36px 圆形，图标 `ArrowUp`，主色，有内容时激活 |
| 发送按钮禁用 | 无内容时灰色，不可点击 |
| 附加图片区 | 输入框上方，缩略图 48px，可删除，最多 5 张 |
| 拖拽提示 | 拖拽图片到窗口时，全屏覆盖层显示"松开以上传图片" |

### 3.4 Sidebar（侧边栏）

```
┌──────────────────────────┐
│                          │
│  PM Workflow Harness     │  ← 应用名，16px，font-weight: 700
│                          │
│  ──────────────────────  │
│                          │
│  ▼ HIS 项目              │  ← 工作区，可折叠，14px，font-weight: 600
│     ┌─────────────────┐  │
│     │ 新用户发帖问题   │  │  ← 讨论项，14px
│     │ 3 分钟前        │  │  ← 最后活跃时间，12px，灰色
│     └─────────────────┘  │
│     ┌─────────────────┐  │
│     │ 导出报表需求     │  │  ← 选中状态：背景色高亮
│     │ 1 小时前        │  │
│     └─────────────────┘  │
│     ┌─────────────────┐  │
│     │ 核销流程优化     │  │
│     │ 昨天            │  │
│     └─────────────────┘  │
│                          │
│  ▶ 内部工具              │  ← 折叠状态
│                          │
│                          │
│                          │
│  ──────────────────────  │
│                          │
│  [+ 新建讨论]            │  ← 主按钮，full-width，主色
│  [⚙ 设置]               │  ← 文字按钮，灰色
│                          │
└──────────────────────────┘
```

**侧边栏样式规范：**

| 属性 | 值 |
|------|-----|
| 宽度 | 280px，固定 |
| 背景 | 浅色模式：`#fafafa`；深色模式：`#111` |
| 右边框 | 1px `#e5e5e5`（浅色）/ `#222`（深色） |
| 工作区标题 | 14px，font-weight: 600，可点击折叠/展开 |
| 折叠图标 | Chevron，旋转动画 200ms |
| 讨论项 | 14px，padding: 10px 16px，圆角 8px |
| 讨论项 hover | 背景色变深 3% |
| 讨论项选中 | 背景色主题色 10%，左侧 3px 主色条 |
| 最后活跃时间 | 12px，灰色，紧跟标题下方 |
| 新建讨论按钮 | full-width，高度 40px，主色背景，白色文字，圆角 8px |
| 设置按钮 | 文字按钮，灰色图标 + 文字，hover 变主色 |

### 3.5 SettingsPanel（设置面板）

设置面板从右侧滑入，覆盖在聊天区域上方，宽度 400px。

```
┌──────────────────────────────────────────────────────────────────┐
│  Title Bar                                                       │
├──────────┬──────────────────────────────────────────┬────────────┤
│          │                                          │            │
│  侧边栏   │  聊天区域（被遮罩覆盖）                    │  设置面板  │
│          │                                          │  400px     │
│          │                                          │            │
│          │                                          │  LLM 配置  │
│          │                                          │  ────────  │
│          │                                          │            │
│          │                                          │  提供商     │
│          │                                          │  [OpenAI▾] │
│          │                                          │            │
│          │                                          │  API 地址   │
│          │                                          │  [        ]│
│          │                                          │            │
│          │                                          │  API Key   │
│          │                                          │  [••••••• ]│
│          │                                          │            │
│          │                                          │  模型      │
│          │                                          │  [gpt-4o  ]│
│          │                                          │            │
│          │                                          │  [测试连接] │
│          │                                          │            │
│          │                                          │  ────────  │
│          │                                          │            │
│          │                                          │  偏好设置   │
│          │                                          │  ────────  │
│          │                                          │            │
│          │                                          │  深色模式   │
│          │                                          │  [开关   ] │
│          │                                          │            │
│          │                                          │  [保存]    │
│          │                                          │  [取消]    │
│          │                                          │            │
└──────────┴──────────────────────────────────────────┴────────────┘
```

**设置面板样式规范：**

| 属性 | 值 |
|------|-----|
| 面板宽度 | 400px |
| 面板位置 | 从右侧滑入 |
| 遮罩 | 半透明黑色（`rgba(0,0,0,0.3)`），点击关闭 |
| 动画 | slide-in-right，300ms，ease-out |
| 面板背景 | 页面背景色 |
| 面板阴影 | 左侧阴影 `0 0 40px rgba(0,0,0,0.1)` |
| 标题 | "设置"，20px，font-weight: 600，带关闭按钮 |
| 分组标题 | 14px，font-weight: 600，灰色，大写 |
| 表单标签 | 14px，font-weight: 500 |
| 输入框 | 使用 shadcn/ui Input 组件 |
| 选择器 | 使用 shadcn/ui Select 组件 |
| 测试连接按钮 | 次要样式，full-width，带 loading 状态 |
| 保存按钮 | 主色，full-width |
| 取消按钮 | 灰色文字按钮 |

---

## 4. 交互流程

### 4.1 新建讨论

```
用户点击 [+ 新建讨论]
    │
    ▼
输入框获得焦点，placeholder 变为 "说说你想讨论什么..."
    │
    ▼
用户输入文字 或 粘贴图片
    │
    ▼
用户点击 [发送] 或 按 Enter
    │
    ▼
侧边栏新增讨论项（自动生成标题，取输入的前 20 字符）
    │
    ▼
消息列表显示用户消息
    │
    ▼
NPC 开始依次讨论（见 4.3）
```

### 4.2 发送消息

```
用户在输入框输入文字
    │
    ├── 纯文字 → 直接发送
    │
    ├── 粘贴图片 → 图片出现在附加区 → 输入文字（可选）→ 发送
    │
    └── 拖拽图片 → 图片出现在附加区 → 输入文字（可选）→ 发送
    │
    ▼
消息出现在消息列表中
    │
    ├── 纯文字：右对齐气泡
    │
    └── 带图片：右对齐气泡 + 图片缩略图
    │
    ▼
输入框清空，附加图片区清空
    │
    ▼
NPC 开始响应
```

### 4.3 NPC 讨论（核心交互）

这是整个产品最重要的交互节奏。NPC 不是同时出现，而是一个接一个。

```
用户消息出现
    │
    ▼
等待 800ms（模拟思考）
    │
    ▼
第一个 NPC 头像 + 名称出现，消息区域显示打字指示器（三个跳动的点）
    │
    ▼
文字逐字出现（打字机效果，每字符 30ms）
    │
    ▼
消息完成，等待 600ms
    │
    ▼
第二个 NPC 头像 + 名称出现，打字指示器
    │
    ▼
文字逐字出现
    │
    ▼
消息完成，等待 600ms
    │
    ▼
第三个 NPC 头像 + 名称出现，打字指示器
    │
    ▼
文字逐字出现
    │
    ▼
讨论完成，等待用户输入 或 出现选择卡片
```

**打字指示器样式：**

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ●  老陈                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  ● ● ●                                               │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

三个圆点依次跳动，每个点 6px，NPC 颜色，动画周期 1.2s。

**节奏控制细节：**

| 阶段 | 延迟 | 说明 |
|------|------|------|
| 用户消息 → 第一个 NPC | 800ms | 模拟 NPC 思考 |
| NPC 消息完成 → 下一个 NPC | 600ms | NPC 之间的间隔 |
| 打字速度 | 30ms/字符 | 逐字出现，不是一次性渲染 |
| 最后一个 NPC → 选择卡片 | 400ms | 选择卡片出现前的缓冲 |

### 4.4 出现选择点

```
NPC 讨论过程中，引擎检测到分歧
    │
    ▼
最后一个 NPC 发言结束
    │
    ▼
等待 400ms
    │
    ▼
选择卡片以淡入动画出现
    │
    ▼
卡片内容：
  - 问题描述（来自阿哲的收敛语）
  - 选项列表（每个选项一个卡片）
  - 每个选项下方显示 NPC 倾向
    │
    ▼
用户可以：
  - 点击某个选项 → 进入选择确认
  - 继续打字补充 → 补充后再选择
```

### 4.5 用户选择

```
用户点击某个选项卡片
    │
    ▼
选项卡片进入选中状态（高亮 + 勾选标记）
    │
    ▼
其他选项降低对比度（opacity: 0.5）
    │
    ▼
卡片底部出现确认文字："你选择了 A"
    │
    ▼
NPC 根据用户选择继续讨论
    │
    ▼
讨论向下推进
```

### 4.6 图片上传

**三种上传方式：**

#### 4.6.1 点击上传

```
用户点击 [📎] 按钮
    │
    ▼
弹出文件选择对话框
    │
    ▼
用户选择图片文件（支持 png, jpg, webp, gif）
    │
    ▼
图片出现在输入框上方的附加区
    │
    ▼
用户输入文字（可选）→ 发送
```

#### 4.6.2 粘贴上传

```
用户在任意位置按 Cmd/Ctrl + V
    │
    ▼
如果剪贴板有图片：
  - 图片出现在输入框上方的附加区
  - 输入框保持焦点
    │
    ▼
用户输入文字（可选）→ 发送
```

#### 4.6.3 拖拽上传

```
用户拖拽图片文件到窗口任意位置
    │
    ▼
窗口出现全屏覆盖层：
  ┌────────────────────────────────────────────┐
  │                                            │
  │                                            │
  │                                            │
  │           松开以上传图片                      │
  │                                            │
  │                                            │
  │                                            │
  └────────────────────────────────────────────┘
    │
    ▼
用户松开鼠标
    │
    ▼
图片出现在输入框上方的附加区
```

**图片附加区：**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────┐  ┌──────┐                                              │
│  │  ×   │  │  ×   │                                              │
│  │ 图片 │  │ 图片 │                                              │
│  │ 48px │  │ 48px │                                              │
│  └──────┘  └──────┘                                              │
│                                                                  │
│  ┌────┐                                                          │
│  │ 📎 │  在这里输入你的想法...                        ┌────┐      │
│  └────┘                                               │ ➤  │      │
│                                                       └────┘      │
└──────────────────────────────────────────────────────────────────┘
```

**图片附加区样式：**

| 属性 | 值 |
|------|-----|
| 缩略图大小 | 48px x 48px |
| 缩略图圆角 | 8px |
| 缩略图间距 | 8px |
| 删除按钮 | 右上角圆形，16px，带 × 图标 |
| 最大图片数 | 5 张 |
| 超出限制 | 上传按钮禁用，提示"最多上传 5 张图片" |

### 4.7 切换讨论

```
用户点击侧边栏中的另一个讨论项
    │
    ▼
当前讨论的滚动位置保存
    │
    ▼
聊天区域以淡入动画切换到新讨论
    │
    ▼
新讨论的消息列表渲染
    │
    ▼
滚动到最新消息
    │
    ▼
侧边栏高亮更新
```

### 4.8 导出讨论

```
用户点击讨论标题栏的 [导出] 按钮
    │
    ▼
弹出菜单：
  - 导出为 JSON
  - 导出为 Markdown
    │
    ▼
用户选择格式
    │
    ▼
弹出系统保存对话框
    │
    ▼
文件保存到用户选择的位置
```

---

## 5. 视觉设计

### 5.1 颜色方案

#### NPC 颜色

| NPC | 主色 | 浅色模式背景 | 深色模式背景 | 用途 |
|-----|------|-------------|-------------|------|
| 小林 | `#22c55e` | `rgba(34,197,94,0.08)` | `rgba(34,197,94,0.12)` | 头像、名称、气泡边框、引用色条 |
| 老陈 | `#3b82f6` | `rgba(59,130,246,0.08)` | `rgba(59,130,246,0.12)` | 头像、名称、气泡边框、引用色条 |
| 阿哲 | `#a855f7` | `rgba(168,85,247,0.08)` | `rgba(168,85,247,0.12)` | 头像、名称、气泡边框、引用色条 |

#### 主题色

| 用途 | 浅色模式 | 深色模式 |
|------|---------|---------|
| 主色（按钮、链接） | `#2563eb` | `#3b82f6` |
| 主色 hover | `#1d4ed8` | `#2563eb` |
| 主色 pressed | `#1e40af` | `#1d4ed8` |

#### 背景色

| 区域 | 浅色模式 | 深色模式 |
|------|---------|---------|
| 页面背景 | `#ffffff` | `#0a0a0a` |
| 侧边栏背景 | `#fafafa` | `#111111` |
| 消息区域背景 | `#ffffff` | `#0a0a0a` |
| 输入区域背景 | `#ffffff` | `#0a0a0a` |
| 卡片背景 | `#fafafa` | `#1a1a1a` |
| 悬浮层背景 | `#ffffff` | `#1a1a1a` |

#### 文字色

| 用途 | 浅色模式 | 深色模式 |
|------|---------|---------|
| 主文字 | `#171717` | `#e5e5e5` |
| 次文字 | `#737373` | `#a3a3a3` |
| 占位文字 | `#a3a3a3` | `#525252` |
| 链接 | `#2563eb` | `#3b82f6` |

#### 边框色

| 用途 | 浅色模式 | 深色模式 |
|------|---------|---------|
| 默认边框 | `#e5e5e5` | `#262626` |
| 分割线 | `#f0f0f0` | `#1a1a1a` |
| 输入框边框 | `#d4d4d8` | `#3f3f46` |
| 输入框焦点 | `#2563eb` | `#3b82f6` |

### 5.2 字体

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "PingFang SC",       /* macOS 中文 */
  "Microsoft YaHei",   /* Windows 中文 */
  "Helvetica Neue",
  Arial,
  sans-serif;
```

| 用途 | 字号 | 行高 | 字重 |
|------|------|------|------|
| 应用名称 | 16px | 1.2 | 700 |
| 页面标题 | 20px | 1.3 | 600 |
| 区域标题 | 14px | 1.4 | 600 |
| 消息文字 | 15px | 1.6 | 400 |
| NPC 名称 | 14px | 1.2 | 600 |
| 时间戳 | 12px | 1.2 | 400 |
| 按钮文字 | 14px | 1.2 | 500 |
| 标签文字 | 12px | 1.2 | 500 |
| 输入框文字 | 15px | 1.5 | 400 |

### 5.3 间距

| 用途 | 值 |
|------|-----|
| 页面内边距 | 20px |
| 消息间距 | 16px |
| 消息气泡内边距 | 12px 16px |
| 侧边栏内边距 | 12px |
| 侧边栏项间距 | 4px |
| 输入区域内边距 | 16px 20px |
| 卡片内边距 | 20px |
| 选项间距 | 12px |

### 5.4 圆角

| 元素 | 圆角 |
|------|------|
| 消息气泡 | 12px（指向发送者的角为 4px） |
| 选择卡片 | 12px |
| 选项卡片 | 8px |
| 图片 | 8px |
| 按钮 | 8px |
| 输入框 | 12px |
| 侧边栏项 | 8px |
| 头像 | 50%（圆形） |

### 5.5 阴影

| 元素 | 阴影 |
|------|------|
| 设置面板 | `0 0 40px rgba(0,0,0,0.1)` |
| 下拉菜单 | `0 4px 12px rgba(0,0,0,0.08)` |
| 选择卡片 hover | `0 2px 8px rgba(0,0,0,0.06)` |
| 图片预览弹窗 | `0 8px 32px rgba(0,0,0,0.2)` |

### 5.6 动画和过渡效果

#### 消息出现动画

```
@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- 时长：300ms
- 缓动：ease-out
- 每条消息独立动画

#### 打字指示器动画

```
@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}
```

- 三个点依次延迟 200ms
- 总周期：1.2s
- 循环：infinite

#### 打字机效果

```
消息文字逐字符渲染
每字符间隔：30ms
不使用 CSS 动画，使用 JavaScript 控制
```

#### 选择卡片出现

```
@keyframes choiceFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- 时长：400ms
- 缓动：ease-out

#### 侧边栏折叠/展开

```
折叠内容区域：
  max-height 过渡：200ms ease-in-out
  opacity 过渡：200ms ease-in-out
```

#### 设置面板滑入

```
@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
```

- 时长：300ms
- 缓动：ease-out
- 遮罩同步淡入

#### 图片上传覆盖层

```
覆盖层淡入：200ms
文字从下方滑入：300ms，延迟 100ms
```

#### 滚动行为

```
新消息出现时：
  平滑滚动到底部：behavior: 'smooth'
  如果用户不在底部：显示"有新消息"提示，点击滚到底部
```

---

## 6. 组件清单

### 6.1 App

**职责：** 应用根组件，管理全局状态和布局。

```typescript
interface AppProps {
  // 无外部 props，状态由内部管理
}

// 内部状态
interface AppState {
  currentWorkspaceId: string | null
  currentChatId: string | null
  isSettingsOpen: boolean
  theme: 'light' | 'dark' | 'system'
}
```

### 6.2 Sidebar

**职责：** 侧边栏容器，管理讨论列表和导航。

```typescript
interface SidebarProps {
  workspaces: Workspace[]
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onOpenSettings: () => void
  onDeleteChat: (chatId: string) => void
  onExportChat: (chatId: string, format: 'json' | 'markdown') => void
}
```

### 6.3 WorkspaceItem

**职责：** 单个工作区，可折叠/展开，包含讨论列表。

```typescript
interface WorkspaceItemProps {
  workspace: Workspace
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onExportChat: (chatId: string, format: 'json' | 'markdown') => void
}

interface Workspace {
  id: string
  name: string
  chats: ChatSummary[]
}

interface ChatSummary {
  id: string
  title: string
  lastActiveAt: Date
  messageCount: number
}
```

### 6.4 ChatView

**职责：** 主聊天区域容器，管理消息列表和输入。

```typescript
interface ChatViewProps {
  chatId: string | null
  messages: Message[]
  isLoading: boolean
  onSendMessage: (content: string, images?: ImageAttachment[]) => void
  onSelectChoice: (choiceId: string, optionId: string) => void
  onExport: (format: 'json' | 'markdown') => void
}
```

### 6.5 ChatHeader

**职责：** 讨论标题栏，显示标题和操作按钮。

```typescript
interface ChatHeaderProps {
  title: string
  messageCount: number
  onExport: (format: 'json' | 'markdown') => void
}
```

### 6.6 MessageList

**职责：** 消息列表，管理滚动和消息渲染。

```typescript
interface MessageListProps {
  messages: Message[]
  isTyping: boolean
  typingCharacterId: string | null
  onSelectChoice: (choiceId: string, optionId: string) => void
}
```

### 6.7 MessageItem

**职责：** 消息项多态组件，根据类型渲染不同内容。

```typescript
interface MessageItemProps {
  message: Message
  activeChoice?: Choice
  onSelectChoice?: (choiceId: string, optionId: string) => void
}

// Message、ImageAttachment、Choice、ChoiceOption、CharacterPreference
// 均引用第 7 节定义
```

### 6.8 UserMessage

**职责：** 用户消息气泡。

```typescript
interface UserMessageProps {
  content: string
  images: ImageAttachment[]
  createdAt: string
}
```

### 6.9 NPCMessage

**职责：** NPC 消息气泡，带颜色标识和头像。

```typescript
interface NPCMessageProps {
  characterId: string
  characterName: string
  characterColor: string
  content: string
  images: ImageAttachment[]
  quote?: MessageQuote
  createdAt: string
}

// MessageQuote 引用第 7 节定义
```

### 6.10 TypingIndicator

**职责：** NPC 打字指示器（三个跳动的点）。

```typescript
interface TypingIndicatorProps {
  characterId: string
  characterColor: string
  characterName: string
}
```

### 6.11 ChoiceCard

**职责：** 选择点卡片，展示选项和 NPC 倾向。

```typescript
interface ChoiceCardProps {
  question: string
  options: ChoiceOption[]
  selectedOptionId?: string
  onSelect: (optionId: string) => void
  disabled: boolean         // 已选择后不可更改
}
```

### 6.12 ChoiceOptionItem

**职责：** 选择卡片中的单个选项。

```typescript
interface ChoiceOptionItemProps {
  option: ChoiceOption
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
}
```

### 6.13 InputArea

**职责：** 输入区域，管理文字输入和图片上传。

```typescript
interface InputAreaProps {
  onSend: (content: string, images?: ImageAttachment[]) => void
  disabled: boolean         // NPC 讨论中禁用输入
  placeholder?: string
}
```

### 6.14 ImageUploadButton

**职责：** 图片上传按钮，触发文件选择。

```typescript
interface ImageUploadButtonProps {
  onUpload: (images: ImageAttachment[]) => void
  disabled: boolean
  currentCount: number
  maxCount: number          // 最大图片数（5）
}
```

### 6.15 ImagePreview

**职责：** 图片附加区的缩略图预览。

```typescript
interface ImagePreviewProps {
  images: ImageAttachment[]
  onRemove: (imageId: string) => void
}
```

### 6.16 ImageLightbox

**职责：** 图片全屏预览弹窗。

```typescript
interface ImageLightboxProps {
  image: ImageAttachment
  isOpen: boolean
  onClose: () => void
}
```

### 6.17 SettingsPanel

**职责：** 设置面板容器。

```typescript
interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onSave: (settings: AppSettings) => void
}

interface AppSettings {
  llm: LLMSettings
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
}

interface LLMSettings {
  provider: 'openai' | 'claude'
  baseUrl: string
  apiKey: string
  model: string
}
```

### 6.18 LLMConfig

**职责：** LLM 配置表单。

```typescript
interface LLMConfigProps {
  settings: LLMSettings
  onChange: (settings: LLMSettings) => void
  onTestConnection: () => Promise<TestResult>
}

interface TestResult {
  success: boolean
  message: string
  latency?: number
}
```

### 6.19 DragOverlay

**职责：** 拖拽图片时的全屏覆盖层。

```typescript
interface DragOverlayProps {
  isVisible: boolean
  onDrop: (images: ImageAttachment[]) => void
}
```

### 6.20 EmptyState

**职责：** 空状态显示（无讨论时）。

```typescript
interface EmptyStateProps {
  onStartChat: () => void
}
```

---

## 7. 数据类型定义

> 前端统一使用 camelCase，后端/SQLite 使用 snake_case，存储层负责转换。

### 7.1 核心数据结构

```typescript
// 工作区
interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string       // ISO 8601
  updatedAt: string
}

// 讨论
interface Chat {
  id: string
  workspaceId: string
  title: string
  status: 'active' | 'converged' | 'archived'
  createdAt: string
  updatedAt: string
}

// 消息
interface Message {
  id: string
  chatId: string
  role: 'user' | 'character' | 'system'
  characterId?: string
  content: string
  images: ImageAttachment[]
  metadata?: MessageMetadata
  createdAt: string
}

interface MessageMetadata {
  turnNumber?: number
  hasDivergence?: boolean
  model?: string
  latencyMs?: number
}

// 图片附件
interface ImageAttachment {
  id: string
  filename: string
  mimeType: string
  localPath: string       // 本地文件路径（持久化）
  data: string            // base64（传给 LLM）
  width?: number
  height?: number
}

// 选择点
interface Choice {
  id: string
  chatId: string
  triggerMessageId?: string
  question: string
  options: ChoiceOption[]
  selectedOptionId?: string
  status: 'pending' | 'resolved' | 'skipped'
  createdAt: string
  resolvedAt?: string
}

// 选择选项
interface ChoiceOption {
  id: string
  label: string           // "A", "B", "C"
  description: string
  characterPreferences: CharacterPreference[]
}

// NPC 倾向
interface CharacterPreference {
  characterId: string
  leaning: 'strong' | 'prefer' | 'neutral' | 'against'
  reason?: string
}

// 消息引用
interface MessageQuote {
  messageId: string
  characterId: string
  characterName: string
  characterColor: string
  content: string
}

// NPC 角色（完整结构）
interface Character {
  id: string
  name: string
  color: string
  avatar: string
  personality: string
  speakingStyle: string
  capabilities: string[]
  triggerConditions: string[]
  systemPrompt: string
  isBuiltin: boolean
  createdAt: string
}

// 用户设置
interface AppSettings {
  llm: {
    provider: 'openai' | 'claude'
    baseUrl: string
    apiKey: string
    model: string
  }
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
}
```

---

## 8. 状态管理

### 8.1 状态分层

```
全局状态（Zustand / React Context）
├── currentWorkspaceId
├── currentChatId
├── isSettingsOpen
├── theme
└── settings

聊天状态（Zustand / React Context）
├── messages[]
├── isTyping
├── typingCharacterId
├── currentChoice
└── isLoading

UI 状态（组件本地 state）
├── inputValue
├── attachedImages[]
├── isDragOver
├── sidebarCollapsed
└── lightboxImage
```

### 8.2 状态管理方案

使用 Zustand 管理全局状态，组件本地状态用 React useState。

```typescript
// stores/appStore.ts
interface AppStore {
  currentWorkspaceId: string | null
  currentChatId: string | null
  isSettingsOpen: boolean
  theme: 'light' | 'dark' | 'system'
  settings: AppSettings

  setCurrentWorkspace: (id: string) => void
  setCurrentChat: (id: string) => void
  openSettings: () => void
  closeSettings: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  updateSettings: (settings: Partial<AppSettings>) => void
}

// stores/chatStore.ts
interface ChatStore {
  messages: Message[]
  isTyping: boolean
  typingCharacterId: string | null
  currentChoice: Choice | null
  isLoading: boolean

  addMessage: (message: Message) => void
  setTyping: (characterId: string | null) => void
  setCurrentChoice: (choice: Choice | null) => void
  selectChoiceOption: (choiceId: string, optionId: string) => void
  setLoading: (loading: boolean) => void
  loadMessages: (chatId: string) => Promise<void>
}
```

---

## 9. 响应式考虑

虽然是桌面应用，但需要考虑不同窗口大小。

### 9.1 最小窗口尺寸

| 属性 | 值 |
|------|-----|
| 最小宽度 | 900px |
| 最小高度 | 600px |

### 9.2 断点处理

| 窗口宽度 | 侧边栏 | 消息区域 |
|----------|--------|---------|
| >= 1200px | 280px，固定 | 自适应 |
| 900px - 1199px | 240px，固定 | 自适应 |
| < 900px | 可折叠，点击展开为 overlay | 全宽 |

### 9.3 消息气泡最大宽度

消息气泡最大宽度始终为消息区域宽度的 70%，在窄窗口下会自动缩小。

---

## 10. 可访问性

### 10.1 键盘导航

- Tab：在侧边栏、消息区域、输入框之间切换
- Enter：发送消息（输入框有焦点时）
- Escape：关闭设置面板、关闭图片预览
- Cmd/Ctrl + V：粘贴图片
- 方向键：在选择卡片中导航选项

### 10.2 屏幕阅读器

- 所有交互元素有 aria-label
- 消息有 role="log" 和 aria-live="polite"
- 选择卡片有 role="radiogroup"
- 图片有 alt 文字（描述图片内容）

### 10.3 颜色对比度

- 所有文字与背景的对比度 >= 4.5:1
- NPC 颜色在浅色/深色模式下都保证可读性
- 不仅依赖颜色传达信息，同时使用文字标签

---

## 11. 组件实现优先级

### P0 — 必须实现（阶段 1）

| 组件 | 说明 |
|------|------|
| App | 根组件和布局 |
| Sidebar | 侧边栏基础结构 |
| WorkspaceItem | 工作区和讨论列表 |
| ChatView | 聊天区域容器 |
| MessageList | 消息列表 |
| NPCMessage | NPC 消息气泡（带颜色、头像） |
| UserMessage | 用户消息气泡 |
| TypingIndicator | 打字指示器 |
| ChoiceCard | 选择点卡片 |
| InputArea | 输入区域 |
| ImageUploadButton | 图片上传 |
| ImagePreview | 图片缩略图 |
| DragOverlay | 拖拽覆盖层 |
| EmptyState | 空状态 |

### P1 — 应该实现（阶段 2）

| 组件 | 说明 |
|------|------|
| SettingsPanel | 设置面板 |
| LLMConfig | LLM 配置表单 |
| ImageLightbox | 图片全屏预览 |
| ChatHeader | 讨论标题栏（含导出） |

### P2 — 可以延后（阶段 3+）

| 组件 | 说明 |
|------|------|
| MessageQuote | 消息引用显示 |
| ChatContextMenu | 讨论右键菜单 |
| SearchInChat | 讨论内搜索 |
| ExportDialog | 导出对话框 |
