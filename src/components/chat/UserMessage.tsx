import { useState } from "react";
import type { Message, ImageAttachment } from "@/types";
import { X } from "lucide-react";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[70%]">
        <div className="bg-background-chat dark:bg-dark-background-chat rounded-[var(--radius-bubble)] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}

          {/* Image attachments */}
          {message.images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap justify-end">
              {message.images.map((img) => (
                <ImageThumb key={img.id} image={img} />
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-foreground-secondary dark:text-dark-foreground-secondary mt-1 text-right">
          {new Date(message.createdAt).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function ImageThumb({ image }: { image: ImageAttachment }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="block rounded-lg overflow-hidden border border-border dark:border-dark-border hover:border-primary/50 transition-colors"
      >
        <img
          src={`data:${image.mimeType};base64,${image.data}`}
          alt={image.filename}
          className="max-w-[300px] max-h-[200px] object-cover"
        />
      </button>

      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-background dark:bg-dark-background rounded-full flex items-center justify-center shadow-lg"
            >
              <X size={16} />
            </button>
            <img
              src={`data:${image.mimeType};base64,${image.data}`}
              alt={image.filename}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
