"use client";

import React from "react";
import { useChat } from "@/contexts/ChatContext";
import { MessageSquare } from "lucide-react";

export function ChatButton() {
  const { toggleChat, isOpen } = useChat();

  if (isOpen) return null; // Hide button when window is open

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-deep text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center hidden lg:flex"
      aria-label="Open Chat"
    >
      <MessageSquare size={28} />
    </button>
  );
}
