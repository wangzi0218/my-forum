# PM Workflow Harness

一个基于多人角色讨论的产品决策框架。

它不是聊天机器人，不是 PRD 生成器，不是项目管理系统。它是 3 个有专业判断力的 AI 同事，和你一起把模糊想法变成清晰的产品判断。

## 一句话定位

`PM Workflow Harness` 是一个「多人角色讨论框架」。PM 产品讨论是它的默认场景，但架构支持扩展到工程评审、设计评审等其他场景。

## 核心体验

你打开应用，看到的是一个群聊界面。3 个 NPC 同事在讨论你提出的问题：

- **小林** — 追问问题，把事情想清楚。她会说"你确认过吗"、"这个前提成立吗"。
- **老陈** — 看事实、看数据、看现实。他会说"你看过数据吗"、"之前有个类似的案例"。
- **阿哲** — 收敛讨论、排优先级、做判断。他会说"两个方向，你选"、"现在不是时候"。

他们之间会互相讨论、补充、反驳。当出现分歧时，会把选择权交给你。

**关键能力：**

- NPC 会说不，不会顺着你的 YY 往下走
- 讨论过程可见，你能看到 3 个人的思考碰撞
- 分歧时让你做选择，引导你真正参与思考
- 支持图片输入（竞品截图、数据报表、设计稿）

## 技术栈

- **桌面应用**：Tauri2 + Rust
- **前端**：React + TypeScript + Tailwind CSS + shadcn/ui
- **存储**：SQLite（本地）+ JSON（导出/备份）
- **LLM**：支持 OpenAI 和 Claude 两种 API 格式，用户自配

## 设计原则

```
群聊即界面，讨论即产品。
```

- 界面就是一个群聊 IM，足够轻
- 背后的方法论、状态、阶段全部藏起来
- NPC 像真实同事，不是审查机器
- 本地优先，数据不上云
- 场景可扩展，角色可定制

## 架构分层

```
场景包（Scenario）    — 一组角色 + 方法论 + 触发逻辑
角色（Character）     — 名字、人设、说话风格
讨论引擎（Engine）    — 管理讨论流、分歧检测、选择点
LLM 层（Provider）   — OpenAI / Claude 统一接口
存储层（Store）       — SQLite + JSON
界面层（UI）          — 群聊 IM
```

第一版只做 PM 讨论一个场景，但代码按场景包架构组织，后续可扩展。

## 第一版边界

**做：**
- 群聊 UI
- 3 个固定 NPC（小林、老陈、阿哲）
- LLM 调用（OpenAI + Claude 格式）
- 图片支持（base64）
- 本地存储（SQLite）
- JSON 导出/备份

**不做：**
- 方法论 skill 系统（后面做）
- 记忆系统（后面做）
- 状态面板、阶段指示器（不做，太重）
- 云端同步（后面做）
- 主动话题推送（后面做）
- 登录注册、团队权限

## 文档目录

- [产品 Brief](docs/product-brief.md)
- [NPC 人设](docs/npc-characters.md)
- [架构原则](docs/architecture-principles.md)
- [场景包架构](docs/scenario-architecture.md)
- [运行原则](docs/operating-principles.md)
- [技术栈](docs/tech-stack.md)
- [路线图](docs/roadmap.md)
- [对话样本](examples/seed-cases.md)
- [测试用例](tests/)

## 从哪里开始

1. [产品 Brief](docs/product-brief.md) — 这个产品是什么、解决什么问题
2. [NPC 人设](docs/npc-characters.md) — 3 个同事是谁、怎么说话
3. [对话样本](examples/seed-cases.md) — 真实对话长什么样
4. [架构原则](docs/architecture-principles.md) — 底层怎么设计
5. [路线图](docs/roadmap.md) — 先做什么、后做什么

## 和 PM Method Agent 的关系

PM Method Agent 是探索型内核和参考实现。这个项目吸收它的经验，但方向不同：

PM Method Agent 偏流程引擎，按步骤走。这个项目偏角色讨论，3 个 NPC 像真实同事一样和你碰撞想法。

保留：阶段关口、多轮承接、方案先行拦截。
改变：从"系统审查"变成"同事讨论"。
