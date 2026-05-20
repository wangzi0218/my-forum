import { Settings } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { getCharacter } from "@/lib/characters";

interface ChatHeaderProps {
  onOpenSettings?: () => void;
}

export function ChatHeader({ onOpenSettings }: ChatHeaderProps) {
  const currentChatId = useAppStore((s) => s.currentChatId);
  const chats = useAppStore((s) => s.chats);
  const currentChat = chats.find((c) => c.id === currentChatId);

  const chatCharacters = (currentChat?.characterIds ?? [])
    .map((id) => getCharacter(id))
    .filter(Boolean);

  if (!currentChat) return null;

  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border dark:border-dark-border">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{currentChat.title}</div>
        <div className="flex items-center gap-1 mt-0.5">
          {chatCharacters.slice(0, 6).map((char) => (
            <div
              key={char!.id}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium text-white"
              style={{ backgroundColor: char!.color }}
              title={char!.name}
            >
              {char!.avatar}
            </div>
          ))}
          {chatCharacters.length > 6 && (
            <span className="text-[10px] text-foreground-secondary dark:text-dark-foreground-secondary">
              +{chatCharacters.length - 6}
            </span>
          )}
        </div>
      </div>
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="p-1.5 hover:bg-background-chat dark:hover:bg-dark-background-chat rounded-md transition-colors"
          title="群聊设置"
        >
          <Settings size={16} className="text-foreground-secondary dark:text-dark-foreground-secondary" />
        </button>
      )}
    </div>
  );
}
