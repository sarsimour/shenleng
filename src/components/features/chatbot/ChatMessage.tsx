import React from "react";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "ai" | "system";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-2 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-deep/10 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-brand-deep" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-brand-deep text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        )}
      >
        {content}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
          <User size={16} className="text-brand-accent" />
        </div>
      )}
    </div>
  );
}
