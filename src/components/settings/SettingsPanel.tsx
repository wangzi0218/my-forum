import { useState } from "react";
import { X, Bot, Users, Zap } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { createProvider } from "@/llm/factory";
import { SkillManager } from "./SkillManager";
import { CharacterManager } from "./CharacterManager";
import type { LLMProviderType } from "@/types";

type SettingsTab = "llm" | "characters" | "skills";

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Bot }> = [
  { id: "llm", label: "模型", icon: Bot },
  { id: "characters", label: "角色", icon: Users },
  { id: "skills", label: "技能", icon: Zap },
];

export function SettingsPanel() {
  const closeSettings = useAppStore((s) => s.closeSettings);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [activeTab, setActiveTab] = useState<SettingsTab>("llm");
  const [provider, setProvider] = useState<LLMProviderType>(settings.llm.provider);
  const [baseUrl, setBaseUrl] = useState(settings.llm.baseUrl);
  const [apiKey, setApiKey] = useState(settings.llm.apiKey);
  const [model, setModel] = useState(settings.llm.model);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSave = async () => {
    await updateSettings({
      llm: { provider, baseUrl, apiKey, model },
    });
    closeSettings();
  };

  const handleTest = async () => {
    if (!apiKey) {
      setTestResult("请先填写 API Key");
      return;
    }
    setTestResult("测试中...");
    try {
      const llmProvider = createProvider({ provider, baseUrl, apiKey, model });
      const result = await llmProvider.testConnection();
      if (result.success) {
        setTestResult(`连接成功 (${result.latencyMs}ms)`);
      } else {
        setTestResult(`连接失败：${result.error ?? "未知错误"}`);
      }
    } catch (err) {
      setTestResult(`测试出错：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={closeSettings}
      />

      {/* Panel */}
      <div className="ml-auto w-[420px] bg-background dark:bg-dark-background border-l border-border dark:border-dark-border flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-dark-border">
          <h2 className="text-base font-semibold">设置</h2>
          <button
            onClick={closeSettings}
            className="p-1 hover:bg-background-chat dark:hover:bg-dark-background-chat rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border dark:border-dark-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary font-medium"
                    : "text-foreground-secondary dark:text-dark-foreground-secondary hover:text-foreground dark:hover:text-dark-foreground"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "llm" && (
            <div className="space-y-4">
              {/* Provider */}
              <div className="space-y-1.5">
                <label className="text-sm">提供商</label>
                <div className="flex gap-2">
                  {(["openai", "claude"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setProvider(p);
                        if (p === "openai") {
                          setBaseUrl("https://api.openai.com/v1");
                        } else {
                          setBaseUrl("https://api.anthropic.com/v1");
                        }
                      }}
                      className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                        provider === p
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border dark:border-dark-border hover:bg-background-chat dark:hover:bg-dark-background-chat"
                      }`}
                    >
                      {p === "openai" ? "OpenAI" : "Claude"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Base URL */}
              <div className="space-y-1.5">
                <label className="text-sm">API 地址</label>
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background-chat dark:bg-dark-background-chat rounded-md border border-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-sm">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background-chat dark:bg-dark-background-chat rounded-md border border-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="sk-..."
                />
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <label className="text-sm">模型</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background-chat dark:bg-dark-background-chat rounded-md border border-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="gpt-4o"
                />
              </div>

              {/* Test */}
              <button
                onClick={handleTest}
                className="w-full px-3 py-2 text-sm border border-border dark:border-dark-border rounded-md hover:bg-background-chat dark:hover:bg-dark-background-chat transition-colors"
              >
                测试连接
              </button>
              {testResult && (
                <p className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary">
                  {testResult}
                </p>
              )}
            </div>
          )}

          {activeTab === "characters" && <CharacterManager />}
          {activeTab === "skills" && <SkillManager />}
        </div>

        {/* Footer — only show on LLM tab */}
        {activeTab === "llm" && (
          <div className="p-4 border-t border-border dark:border-dark-border">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity"
            >
              保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
