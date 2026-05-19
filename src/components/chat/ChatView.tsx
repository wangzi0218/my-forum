import { useState, useCallback, useRef } from "react";
import { MessageList } from "@/components/chat/MessageList";
import { InputArea } from "@/components/chat/InputArea";
import { useChatStore } from "@/store/chatStore";
import { useAppStore } from "@/store/appStore";
import { EmptyState } from "@/components/chat/EmptyState";
import { DiscussionManager } from "@/engine/discussion";
import { CHARACTERS } from "@/scenarios/pm-discussion/characters";
import { generateId } from "@/lib/utils";
import type { Message, ImageAttachment } from "@/types";
import { Upload } from "lucide-react";

export function ChatView() {
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const createChoice = useChatStore((s) => s.createChoice);
  const selectChoiceOption = useChatStore((s) => s.selectChoiceOption);
  const startStreamingMessage = useChatStore((s) => s.startStreamingMessage);
  const appendStreamChunk = useChatStore((s) => s.appendStreamChunk);
  const finishStreaming = useChatStore((s) => s.finishStreaming);
  const llmSettings = useAppStore((s) => s.settings.llm);
  const currentChatId = useAppStore((s) => s.currentChatId);

  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleAddImages = useCallback((images: ImageAttachment[]) => {
    setPendingImages((prev) => {
      const remaining = 5 - prev.length;
      return [...prev, ...images.slice(0, remaining)];
    });
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    setPendingImages((prev) => prev.filter((i) => i.id !== imageId));
  }, []);

  const handleSelectChoice = useCallback(
    (choiceId: string, optionId: string) => {
      selectChoiceOption(choiceId, optionId);
    },
    [selectChoiceOption],
  );

  const handleSendMessage = useCallback(
    async (content: string, images: ImageAttachment[]) => {
      if (!currentChatId) return;

      // 1. 添加用户消息
      const userMessage: Message = {
        id: generateId(),
        chatId: currentChatId,
        role: "user",
        content,
        images,
        createdAt: new Date().toISOString(),
      };
      await addMessage(userMessage);

      // 2. 启动 NPC 讨论（流式）
      const engine = new DiscussionManager(llmSettings);

      try {
        const currentMessages = useChatStore.getState().messages;
        const result = await engine.processUserInputStream(
          currentChatId,
          content,
          images,
          currentMessages,
          CHARACTERS,
          // onChunk: 实时更新消息内容
          (_characterId, chunk) => {
            const streamingId = useChatStore.getState().streamingMessageId;
            if (streamingId) {
              appendStreamChunk(streamingId, chunk);
            }
          },
          // onMessageStart: 创建空消息，设置 typing 状态
          (msg) => {
            if (msg.characterId) {
              setTyping(msg.characterId);
            }
            startStreamingMessage(msg);
          },
        );

        // 流式完成，持久化每条消息
        for (const msg of result.messages) {
          await finishStreaming(msg.id);
        }
        setTyping(null);

        // 如果有选择点，设置到 store 并持久化
        if (result.choice) {
          await createChoice(result.choice);
        }
      } catch {
        setTyping(null);
      }
    },
    [currentChatId, addMessage, setTyping, createChoice, startStreamingMessage, appendStreamChunk, finishStreaming, llmSettings],
  );

  // Drag-and-drop handlers (full window coverage)
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length === 0) return;

      readImageFiles(files).then((images) => {
        if (images.length > 0) handleAddImages(images);
      });
    },
    [handleAddImages],
  );

  // Empty state when no messages
  if (messages.length === 0) {
    return (
      <main
        className="flex-1 flex flex-col relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <EmptyState />
        <InputArea
          onAddImages={handleAddImages}
          pendingImages={pendingImages}
          onRemoveImage={handleRemoveImage}
          onSendMessage={handleSendMessage}
        />
        <DragOverlay isVisible={isDragOver} />
      </main>
    );
  }

  return (
    <main
      className="flex-1 flex flex-col relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <MessageList onSelectChoice={handleSelectChoice} />
      <InputArea
        onAddImages={handleAddImages}
        pendingImages={pendingImages}
        onRemoveImage={handleRemoveImage}
        onSendMessage={handleSendMessage}
      />
      <DragOverlay isVisible={isDragOver} />
    </main>
  );
}

function DragOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-40 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-message-in">
      <div className="flex flex-col items-center gap-3 bg-background dark:bg-dark-background border-2 border-dashed border-primary rounded-xl px-8 py-6 shadow-lg">
        <Upload size={32} className="text-primary" />
        <span className="text-sm font-medium text-primary">
          松开以上传图片
        </span>
      </div>
    </div>
  );
}

async function readImageFiles(files: File[]): Promise<ImageAttachment[]> {
  const results: ImageAttachment[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = (reader.result as string).split(",")[1] ?? "";
        resolve(result);
      };
      reader.readAsDataURL(file);
    });

    results.push({
      id: generateId(),
      filename: file.name,
      mimeType: file.type,
      localPath: "",
      data: base64,
    });
  }

  return results;
}
