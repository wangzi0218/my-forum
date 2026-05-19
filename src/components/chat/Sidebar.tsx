import { useState, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { Plus, Settings, ChevronRight, FolderOpen } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { Workspace, Chat, UUID } from "@/types";

export function Sidebar() {
  const openSettings = useAppStore((s) => s.openSettings);
  const workspaces = useAppStore((s) => s.workspaces);
  const chats = useAppStore((s) => s.chats);
  const currentChatId = useAppStore((s) => s.currentChatId);
  const setCurrentChat = useAppStore((s) => s.setCurrentChat);
  const setCurrentWorkspace = useAppStore((s) => s.setCurrentWorkspace);
  const addWorkspace = useAppStore((s) => s.addWorkspace);
  const addChat = useAppStore((s) => s.addChat);

  const handleNewChat = useCallback(async () => {
    // Find or create a default workspace
    let workspaceId: UUID;
    if (workspaces.length > 0) {
      workspaceId = workspaces[0]!.id;
    } else {
      const ws: Workspace = {
        id: generateId(),
        name: "默认工作区",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addWorkspace(ws);
      workspaceId = ws.id;
    }

    const chat: Chat = {
      id: generateId(),
      workspaceId,
      title: "新讨论",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await addChat(chat);
    setCurrentWorkspace(workspaceId);
    await setCurrentChat(chat.id);
  }, [workspaces, addWorkspace, addChat, setCurrentWorkspace, setCurrentChat]);

  const handleSelectChat = useCallback(
    async (chatId: UUID) => {
      await setCurrentChat(chatId);
    },
    [setCurrentChat],
  );

  // Group chats by workspace
  const workspaceGroups = workspaces.map((ws) => ({
    workspace: ws,
    chats: chats.filter((c) => c.workspaceId === ws.id),
  }));

  return (
    <aside className="w-[280px] shrink-0 border-r border-border dark:border-dark-border flex flex-col bg-background-secondary dark:bg-dark-background-secondary">
      {/* Header */}
      <div className="p-4 border-b border-border dark:border-dark-border">
        <h1 className="text-sm font-semibold text-foreground-secondary dark:text-dark-foreground-secondary">
          PM Workflow Harness
        </h1>
      </div>

      {/* Workspace & Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {workspaceGroups.length === 0 ? (
          <div className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary px-2 py-4 text-center">
            暂无讨论
          </div>
        ) : (
          workspaceGroups.map(({ workspace, chats: wsChats }) => (
            <WorkspaceItem
              key={workspace.id}
              workspace={workspace}
              chats={wsChats}
              currentChatId={currentChatId}
              onSelectChat={handleSelectChat}
            />
          ))
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border dark:border-dark-border flex gap-2">
        <button
          onClick={handleNewChat}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          新建讨论
        </button>
        <button
          onClick={openSettings}
          className="p-2 text-foreground-secondary dark:text-dark-foreground-secondary hover:text-foreground dark:hover:text-dark-foreground transition-colors rounded-md hover:bg-background dark:hover:bg-dark-background"
          aria-label="设置"
        >
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
}

interface WorkspaceItemProps {
  workspace: Workspace;
  chats: Chat[];
  currentChatId: UUID | null;
  onSelectChat: (chatId: UUID) => void;
}

function WorkspaceItem({
  workspace,
  chats,
  currentChatId,
  onSelectChat,
}: WorkspaceItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-1">
      {/* Workspace header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-2 py-2 text-sm font-semibold text-foreground-secondary dark:text-dark-foreground-secondary hover:text-foreground dark:hover:text-dark-foreground transition-colors rounded-md hover:bg-background dark:hover:bg-dark-background"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        />
        <FolderOpen size={14} className="shrink-0" />
        <span className="truncate">{workspace.name}</span>
      </button>

      {/* Chat list */}
      {isExpanded && (
        <div className="ml-2 space-y-0.5">
          {chats.length === 0 ? (
            <div className="px-3 py-2 text-xs text-foreground-secondary dark:text-dark-foreground-secondary">
              暂无讨论
            </div>
          ) : (
            chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === currentChatId}
                onClick={() => onSelectChat(chat.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

function ChatItem({ chat, isActive, onClick }: ChatItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? "bg-primary/10 text-primary border-l-[3px] border-l-primary"
          : "text-foreground dark:text-dark-foreground hover:bg-background dark:hover:bg-dark-background"
      }`}
    >
      <div className="truncate font-medium">{chat.title}</div>
      <div className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary mt-0.5">
        {formatRelativeTime(chat.updatedAt)}
      </div>
    </button>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString("zh-CN");
}
