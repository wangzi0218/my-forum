import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { db } from "@/store/database";
import type { Character } from "@/types";

const DEFAULT_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

export function CharacterManager() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCharacters = useCallback(async () => {
    try {
      const chars = await db.listCharacters();
      setCharacters(chars);
    } catch {
      // 加载失败
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`确定要删除角色「${name}」吗？此操作不可撤销。`)) return;
    await db.deleteCharacter(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground-secondary dark:text-dark-foreground-secondary">
          角色管理
        </h3>
        <p className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground-secondary dark:text-dark-foreground-secondary">
          角色管理
        </h3>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus size={12} />
            新建
          </button>
        )}
      </div>

      {showCreate && (
        <CharacterForm
          onSave={async (char) => {
            const id = char.id ?? `custom-${Date.now()}`;
            const fullChar = { ...char, id };
            await db.createCharacter(fullChar);
            setCharacters((prev) => [...prev, fullChar as Character]);
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="space-y-2">
        {characters.length === 0 && !showCreate && (
          <p className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary text-center py-4">
            暂无自定义角色，点击上方「新建」创建第一个。
          </p>
        )}
        {characters.map((char) => (
          <div key={char.id}>
            {editingId === char.id ? (
              <CharacterForm
                character={char}
                onSave={async (updated) => {
                  const { id: _, createdAt: __, ...fields } = { ...updated, id: char.id, createdAt: char.createdAt };
                  await db.updateCharacter(char.id, fields);
                  setCharacters((prev) => prev.map((c) => c.id === char.id ? { ...c, ...fields } : c));
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-border dark:border-dark-border p-3 group">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
                  style={{ backgroundColor: char.color }}
                >
                  {char.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{char.name}</span>
                    {char.isBuiltin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-background-chat dark:bg-dark-background-chat text-foreground-secondary dark:text-dark-foreground-secondary">
                        内置
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary truncate mt-0.5">
                    {char.personality}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(char.id)}
                    className="p-1 hover:bg-background-chat dark:hover:bg-dark-background-chat rounded transition-colors"
                    title="编辑"
                  >
                    <Pencil size={14} className="text-foreground-secondary dark:text-dark-foreground-secondary" />
                  </button>
                  {!char.isBuiltin && (
                    <button
                      onClick={() => handleDelete(char.id, char.name)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CharacterForm
// ---------------------------------------------------------------------------

interface CharacterFormProps {
  character?: Character;
  onSave: (char: Omit<Character, "createdAt">) => void | Promise<void>;
  onCancel: () => void;
}

function CharacterForm({ character, onSave, onCancel }: CharacterFormProps) {
  const [name, setName] = useState(character?.name ?? "");
  const [color, setColor] = useState(character?.color ?? DEFAULT_COLORS[0]!);
  const [avatar, setAvatar] = useState(character?.avatar ?? "");
  const [personality, setPersonality] = useState(character?.personality ?? "");
  const [speakingStyle, setSpeakingStyle] = useState(character?.speakingStyle ?? "");
  const [systemPrompt, setSystemPrompt] = useState(character?.systemPrompt ?? "");

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({
      id: character?.id ?? "",
      name: name.trim(),
      color,
      avatar: avatar.trim() || name.trim()[0]!,
      personality: personality.trim(),
      speakingStyle: speakingStyle.trim(),
      capabilities: character?.capabilities ?? [],
      triggerConditions: character?.triggerConditions ?? [],
      systemPrompt: systemPrompt.trim(),
      isBuiltin: character?.isBuiltin ?? false,
    });
  };

  return (
    <div className="rounded-lg border border-primary/30 p-3 space-y-3">
      {/* Name + Avatar + Color */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary">名字</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm bg-background-chat dark:bg-dark-background-chat rounded-md border border-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="角色名称"
          />
        </div>
        <div className="w-16 space-y-1.5">
          <label className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary">头像</label>
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm bg-background-chat dark:bg-dark-background-chat rounded-md border border-border dark:border-dark-border text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="字"
            maxLength={2}
          />
        </div>
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <label className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary">颜色</label>
        <div className="flex gap-1.5">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Personality */}
      <div className="space-y-1.5">
        <label className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary">性格</label>
        <input
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm bg-background-chat dark:bg-dark-background-chat rounded-md border border-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="简短描述这个角色的性格特点"
        />
      </div>

      {/* Speaking Style */}
      <div className="space-y-1.5">
        <label className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary">说话风格</label>
        <input
          value={speakingStyle}
          onChange={(e) => setSpeakingStyle(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm bg-background-chat dark:bg-dark-background-chat rounded-md border border-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="直接、爱追问、偶尔有点尖锐"
        />
      </div>

      {/* System Prompt */}
      <div className="space-y-1.5">
        <label className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          className="w-full px-2.5 py-1.5 text-sm bg-background-chat dark:bg-dark-background-chat rounded-md border border-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          placeholder="完整的角色设定 prompt，定义这个 NPC 是谁、怎么说话、关注什么"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Check size={14} />
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border dark:border-dark-border rounded-md hover:bg-background-chat dark:hover:bg-dark-background-chat transition-colors"
        >
          <X size={14} />
          取消
        </button>
      </div>
    </div>
  );
}
