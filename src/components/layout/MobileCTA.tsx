"use client";

import React from "react";
import { Phone, MessageSquare } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

export function MobileCTA() {
  const { openChat } = useChat();

  return (
    <div className="lg:hidden fixed bottom-6 inset-x-6 z-40 flex gap-4">
      <a
        href="tel:123456789"
        className="flex-1 bg-brand-deep text-white flex items-center justify-center gap-2 py-3 rounded-full shadow-lg font-bold"
      >
        <Phone size={20} />
        <span>拨打电话</span>
      </a>
      <button
        onClick={openChat}
        className="flex-1 bg-brand-accent text-white flex items-center justify-center gap-2 py-3 rounded-full shadow-lg font-bold"
      >
        <MessageSquare size={20} />
        <span>在线咨询</span>
      </button>
    </div>
  );
}
