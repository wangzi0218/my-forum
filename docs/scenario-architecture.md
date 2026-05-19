# 场景包架构

## 核心理念

这个产品的本质是「多人角色讨论框架」。PM 产品讨论只是它的一个实例。

抽象到最底层：一群「角色」在「讨论组」里讨论「话题」，用户参与并做决策。

这个框架可以支持：
- PM 产品讨论（默认场景）
- 工程方案评审
- 设计评审
- 面试准备
- 写作助手
- 其他任何需要多人讨论的场景

## 架构分层

```
┌─────────────────────────────────────────┐
│  场景包（Scenario）                      │
│  一组角色 + 对应的 prompt + 触发逻辑     │
├─────────────────────────────────────────┤
│  角色（Character）                       │
│  名字、头像、颜色、人设、说话风格        │
├─────────────────────────────────────────┤
│  讨论引擎（Engine）                      │
│  管理讨论流、分歧检测、选择点生成        │
├─────────────────────────────────────────┤
│  LLM 层（Provider）                      │
│  OpenAI / Claude 统一接口                │
├─────────────────────────────────────────┤
│  存储层（Store）                          │
│  SQLite + JSON                           │
├─────────────────────────────────────────┤
│  界面层（UI）                             │
│  群聊 IM                                 │
└─────────────────────────────────────────┘
```

**关键：讨论引擎不知道具体角色是谁，只管"有 N 个角色在讨论"。**

## 场景包结构

```
scenarios/
└── pm-discussion/
    ├── index.ts          # 场景入口
    ├── characters.ts     # 角色定义
    ├── prompts.ts        # system prompt
    ├── triggers.ts       # 选择点触发条件
    └── topics.ts         # 话题源（后续扩展）
```

### characters.ts

定义场景中的角色：

```typescript
export const characters = [
  {
    id: 'xiao-lin',
    name: '小林',
    color: '#22c55e',
    personality: '追问问题，把事情想清楚',
    // ...
  },
  {
    id: 'lao-chen',
    name: '老陈',
    color: '#3b82f6',
    personality: '看事实、看数据、看现实',
    // ...
  },
  {
    id: 'a-zhe',
    name: '阿哲',
    color: '#a855f7',
    personality: '收敛讨论、排优先级、做判断',
    // ...
  }
]
```

### prompts.ts

定义每个角色的 system prompt：

```typescript
export const prompts = {
  'xiao-lin': `你是小林，团队里最年轻的，但最较真。
别人说"做个功能"，你一定先问"为什么"。
你的核心能力是：识别方案先行、拆解模糊需求、追问假设。
说话风格：直接、爱追问、偶尔有点尖锐但出发点是好的。
...`,
  // ...
}
```

### triggers.ts

定义什么时候触发选择点：

```typescript
export const triggers = {
  // NPC 之间有明显分歧时
  divergence: true,
  // 讨论超过 N 轮时建议收敛
  maxTurnsBeforeConverge: 6,
  // 需要用户确认方向时
  directionConfirm: true,
}
```

## 讨论引擎接口

讨论引擎通过接口和场景包交互，不直接依赖具体实现：

```typescript
interface Scenario {
  id: string
  name: string
  characters: Character[]
  getSystemPrompt(characterId: string): string
  shouldTriggerChoice(messages: Message[]): boolean
  generateChoice(messages: Message[]): ChoiceTemplate | null
}
```

引擎只关心：
- 有哪些角色
- 每个角色的 prompt 是什么
- 什么时候该触发选择点

不关心：
- 角色叫什么名字
- 角色是什么性格
- 具体用什么方法论

## 扩展新场景

添加新场景只需要 3 步：

### 1. 创建场景目录

```
scenarios/
├── pm-discussion/      # 已有
└── engineering-review/ # 新增
    ├── index.ts
    ├── characters.ts
    ├── prompts.ts
    └── triggers.ts
```

### 2. 定义角色

```typescript
// engineering-review/characters.ts
export const characters = [
  {
    id: 'architect',
    name: '架构师',
    color: '#ef4444',
    personality: '关注系统设计和技术风险',
  },
  {
    id: 'tester',
    name: '测试',
    color: '#f59e0b',
    personality: '关注边界情况和可测试性',
  },
  {
    id: 'pm',
    name: '产品经理',
    color: '#22c55e',
    personality: '关注用户体验和业务价值',
  }
]
```

### 3. 定义 prompt 和触发逻辑

和 PM 讨论场景一样的结构，只是内容不同。

**引擎、LLM 层、存储层、UI 层全部复用。**

## 后续扩展：用户自定义角色

后续可以让用户：
- 创建新角色（填名字、选颜色、写人设）
- 修改已有角色的性格
- 给角色加载额外的 Skill（方法论）
- 创建新场景（选择参与的角色）

这些都通过配置实现，不需要改引擎。

## 后续扩展：Skill 系统

Skill 是角色的能力扩展，和场景包松耦合：

```
scenarios/
└── pm-discussion/
    ├── characters.ts
    ├── prompts.ts
    ├── triggers.ts
    └── skills/           # 新增
        ├── jtbd.ts
        ├── kano.ts
        └── heuristic.ts
```

- 每个角色有默认擅长的 Skill
- 但 Skill 是独立模块，可以被任何角色调用
- 用户可以给角色"换装备"
- 用户可以添加自定义 Skill

第一版不做 Skill 系统，但架构上预留这个位置。
