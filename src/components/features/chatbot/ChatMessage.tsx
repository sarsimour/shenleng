import React from "react";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "ai" | "system";
  content: string;
  isPending?: boolean;
  status?: string;
  avatarUrl?: string;
}

export function ChatMessage({ role, content, isPending = false, status, avatarUrl }: ChatMessageProps) {
  const isUser = role === "user";
  const displayContent = isPending && !content.trim() ? status || "正在处理..." : content;

  return (
    <div
      className={cn(
        "flex w-full gap-2 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 overflow-hidden rounded-full bg-brand-deep/10 flex items-center justify-center shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="申冷 AI 助手"
              className="h-full w-full object-cover"
            />
          ) : (
            <Bot size={16} className="text-brand-deep" />
          )}
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-brand-deep text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        )}
      >
        {isPending && !content.trim() ? (
          <span className="inline-flex items-center gap-2 text-gray-600">
            <Loader2 size={14} className="animate-spin shrink-0" />
            <span>{displayContent}</span>
          </span>
        ) : (
          displayContent
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
          <User size={16} className="text-brand-accent" />
        </div>
      )}
    </div>
  );
}
