import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildDivergencePrompt,
  buildChoiceGenerationPrompt,
  buildConvergencePrompt,
} from "../prompts";
import { CHARACTERS } from "@/scenarios/pm-discussion/characters";
import type { Message } from "@/types";

const mockCharacter = CHARACTERS[0]!;

const mockMessages: Message[] = [
  {
    id: "1",
    chatId: "chat-1",
    role: "user",
    content: "我想做一个用户反馈收集功能",
    images: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    chatId: "chat-1",
    role: "character",
    characterId: "xiao-lin",
    content: "为什么要做这个？现在的反馈渠道有什么问题？",
    images: [],
    createdAt: new Date().toISOString(),
  },
];

describe("buildSystemPrompt", () => {
  it("includes character system prompt", () => {
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, []);
    expect(prompt).toContain("你是小林");
  });

  it("includes message history", () => {
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, []);
    expect(prompt).toContain("我想做一个用户反馈收集功能");
    expect(prompt).toContain("为什么要做这个");
  });

  it("includes background when provided", () => {
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, [], "这是一个电商项目");
    expect(prompt).toContain("项目背景");
    expect(prompt).toContain("电商项目");
  });

  it("excludes background section when not provided", () => {
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, []);
    expect(prompt).not.toContain("项目背景");
  });

  it("includes previous context when provided", () => {
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, [], undefined, "上次讨论了用户注册流程");
    expect(prompt).toContain("之前的讨论");
    expect(prompt).toContain("用户注册流程");
  });

  it("includes active skills when provided", () => {
    const skills = [
      {
        id: "skill-jtbd",
        name: "JTBD",
        description: "test",
        promptFragment: "## JTBD 分析能力\n使用 JTBD 框架",
        triggers: [],
        isBuiltin: true,
      },
    ];
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, [], undefined, undefined, skills);
    expect(prompt).toContain("方法论技能");
    expect(prompt).toContain("JTBD 分析能力");
  });

  it("does not include skills section when no skills provided", () => {
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, []);
    expect(prompt).not.toContain("方法论技能");
  });

  it("includes behavior rules", () => {
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, []);
    expect(prompt).toContain("行为规则");
    expect(prompt).toContain("不要无底线顺着用户");
  });

  it("includes no-bracket rule", () => {
    const prompt = buildSystemPrompt(mockCharacter, mockMessages, []);
    expect(prompt).toContain("不要用括号包裹内心活动");
  });
});

describe("buildDivergencePrompt", () => {
  it("generates divergence analysis prompt", () => {
    const prompt = buildDivergencePrompt(mockMessages);
    expect(prompt).toContain("分歧");
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("hasDivergence");
  });

  it("includes message history", () => {
    const prompt = buildDivergencePrompt(mockMessages);
    expect(prompt).toContain("我想做一个用户反馈收集功能");
  });
});

describe("buildChoiceGenerationPrompt", () => {
  it("generates choice prompt with divergence info", () => {
    const divergenceInfo = JSON.stringify({ hasDivergence: true, score: 0.8 });
    const prompt = buildChoiceGenerationPrompt(divergenceInfo, mockMessages);
    expect(prompt).toContain("选择点");
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("question");
    expect(prompt).toContain("options");
  });
});

describe("buildConvergencePrompt", () => {
  it("generates convergence analysis prompt", () => {
    const prompt = buildConvergencePrompt(mockMessages, "小林, 老陈, 阿哲");
    expect(prompt).toContain("收敛");
    expect(prompt).toContain("小林, 老陈, 阿哲");
    expect(prompt).toContain("shouldConverge");
  });
});
