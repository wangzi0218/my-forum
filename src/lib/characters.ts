import type { Character } from "@/types";
import { CHARACTERS as PM_CHARACTERS } from "@/scenarios/pm-discussion/characters";
import { CHARACTERS as ENG_CHARACTERS } from "@/scenarios/engineering-review/characters";

/**
 * 统一角色注册表 — 合并所有场景的角色
 * 供 TypingIndicator、NPCMessage 等组件查找角色信息
 */
const ALL_CHARACTERS = [...PM_CHARACTERS, ...ENG_CHARACTERS];

const characterMap = new Map<string, Character>(ALL_CHARACTERS.map((c) => [c.id, c]));

export function getCharacter(id: string): Character | undefined {
  return characterMap.get(id);
}

export function getCharacterName(id: string): string {
  return characterMap.get(id)?.name ?? "NPC";
}

export function getCharacterColor(id: string): string {
  return characterMap.get(id)?.color ?? "#6b7280";
}
