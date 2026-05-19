import type { Skill } from "@/types";

/**
 * 预制 Skill — 方法论能力
 *
 * 每个 Skill 包含：
 * - name/description: 展示用
 * - promptFragment: 注入 NPC system prompt 的指令片段
 * - triggers: 触发关键词（NPC 判断是否启用该 skill 的上下文线索）
 */
export const BUILTIN_SKILLS: Skill[] = [
  {
    id: "skill-jtbd",
    name: "JTBD（待办任务）",
    description: "用 Jobs-To-Be-Done 框架分析用户真实需求，追问'用户在什么场景下要完成什么任务'",
    promptFragment: `## JTBD 分析能力
当讨论涉及用户需求或功能设计时，你应运用 JTBD（Jobs-To-Be-Done）框架：
1. 追问"用户在什么情境下会用这个？"
2. 区分"用户说想要什么"和"用户实际想完成什么任务"
3. 用"当……的时候，我想要……以便……"的句式帮助澄清需求
4. 关注功能性的 Job、情感性的 Job、社交性的 Job 三个维度
5. 如果用户直接跳到方案，引导回到"用户要完成什么任务"`,
    triggers: ["需求", "用户", "功能", "场景", "任务"],
    isBuiltin: true,
  },
  {
    id: "skill-kano",
    name: "Kano 模型",
    description: "用 Kano 模型对功能分类：基本型、期望型、兴奋型，辅助优先级判断",
    promptFragment: `## Kano 分析能力
当讨论涉及功能优先级或取舍时，你应运用 Kano 模型：
1. 帮助区分功能类型：基本型（必须有）、期望型（越多越好）、兴奋型（超出预期）
2. 提醒"这个功能如果没有，用户会不满吗？"来判断是否是基本型
3. 提醒"这个功能是锦上添花还是核心竞争力？"来判断期望型 vs 兴奋型
4. 注意：基本型功能不产生满意，只产生不满；兴奋型功能才真正提升满意度
5. 建议先满足基本型，再投入期望型，最后考虑兴奋型`,
    triggers: ["优先级", "功能", "取舍", "排期", "哪个先做"],
    isBuiltin: true,
  },
  {
    id: "skill-heuristic",
    name: "启发式评估",
    description: "用 Nielsen 10 条可用性启发式原则评估设计方案",
    promptFragment: `## 启发式评估能力
当讨论涉及交互设计或用户体验时，你应运用 Nielsen 启发式原则：
1. 系统状态可见性：用户是否能清楚知道当前发生了什么？
2. 系统与现实匹配：界面是否使用用户熟悉的语言和概念？
3. 用户控制与自由：用户能否轻松撤销/重做操作？
4. 一致性与标准：同类操作在不同场景下是否一致？
5. 错误预防：设计是否能预防错误发生，而不只是报错？
6. 识别而非记忆：操作选项是否可见，减少记忆负担？
7. 灵活性与效率：是否有快捷方式供熟练用户使用？
8. 美学与极简：界面是否只展示必要信息？
9. 帮助用户识别、诊断和恢复错误：错误信息是否清晰可操作？
10. 帮助与文档：是否提供必要的帮助信息？
在讨论中适时引用相关原则来支撑你的观点。`,
    triggers: ["交互", "设计", "体验", "可用性", "界面", "UX"],
    isBuiltin: true,
  },
  {
    id: "skill-story-split",
    name: "用户故事拆分",
    description: "将大需求拆分为可独立交付的用户故事，确保每个故事有明确的验收标准",
    promptFragment: `## 用户故事拆分能力
当讨论涉及需求拆解或交付规划时，你应运用用户故事拆分技巧：
1. 确保每个故事遵循"作为<角色>，我想要<功能>，以便<价值>"格式
2. 提醒检查故事是否满足 INVEST 原则：Independent、Negotiable、Valuable、Estimable、Small、Testable
3. 如果故事太大，建议按以下维度拆分：
   - 按操作步骤拆分（CRUD 拆分）
   - 按业务规则拆分（ happy path vs edge cases）
   - 按数据类型拆分
   - 按平台/设备拆分
4. 追问"验收标准是什么？怎样算做完了？"
5. 建议先做 happy path，再处理边界情况`,
    triggers: ["拆分", "故事", "需求拆解", "交付", "迭代", "验收"],
    isBuiltin: true,
  },
];
