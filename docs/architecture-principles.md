# 架构原则

## 总原则

新项目采用：

```text
harness-first architecture, human-like interaction
```

这不是口号，而是分工：

- harness 负责状态、账本、边界和可复盘。
- 自然交互负责降低用户负担。
- LLM 负责理解和表达增强。
- runtime 负责关键控制，不把控制权全部交给模型。

## 为什么底层要用 harness

产品经理工作流里最难的是持续上下文，而不是单轮回答。

系统必须能回答：

- 这是新问题，还是继续刚才那个问题？
- 这句话是项目背景，还是当前案例补充？
- 这条信息应该长期记住，还是只用于本次？
- 当前应该继续追问，还是先给阶段结论？
- 用户说“先不做”，系统应该暂缓还是继续推进？
- 后面复盘时，能不能知道当时为什么这么判断？

这些都需要明确的运行时对象，而不能只靠 prompt。

## 为什么体验层要自然

如果系统只暴露 harness，用户会看到太多状态、字段和流程。

第一版应该避免：

- 表单过多
- 状态过多
- 输出像审查报告
- 每一步都要求用户选择
- 把产品经理日常语言翻译成系统术语

用户应该可以直接说：

```text
这个需求客户又提了，但我还是觉得有点虚，帮我看看。
```

系统应该自然承接，而不是要求用户先补完整模板。

## 分层设计

### 1. Runtime Layer

负责：

- workspace
- active case
- turn count
- query loop
- event log
- memory reference
- terminal state

### 2. Method Layer

负责：

- 问题定义
- 决策挑战
- 验证设计
- 阶段关口
- 停止条件

### 3. Memory Layer

负责：

- 项目背景
- 用户偏好
- 团队规则
- 当前案例临时事实
- 写入确认
- 撤回和覆盖

### 4. LLM Layer

负责：

- 语义理解
- 场景和角色抽取
- 文案自然化
- 草稿归一化

不负责：

- 静默写长期记忆
- 绕过阶段机
- 最终权限判断
- 强行替用户做业务决策

### 5. Interface Layer

负责：

- 本地网页
- CLI
- skill
- MCP

第一版只选一个主入口，其他入口先作为后续可能性。

## 最小数据对象

### Workspace

```text
id
name
project_profile
preferences
recent_cases
active_case_id
```

### Case

```text
id
workspace_id
raw_input
turns
stage
workflow_state
known_context
open_questions
decision
next_actions
```

### Memory

```text
id
workspace_id
type
content
source_turn_id
status
created_at
updated_at
```

### Event

```text
id
workspace_id
case_id
turn_id
type
payload
created_at
```

### Card

```text
summary
main_blocker
next_question
decision_hint
memory_notice
```

## 关键边界

- 记忆写入必须可见。
- 项目背景可以复用，但冲突时新输入优先。
- 用户可以说“不是这个项目”。
- 系统可以说“先别急着做方案”。
- LLM 失败时，核心流程仍要能给出保守结果。
- 所有关键状态变化要能被事件记录下来。

