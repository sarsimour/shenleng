"use client";

import React from "react";
import { useChat } from "@/contexts/ChatContext";
import { ChatWindow } from "./ChatWindow";
import { ChatButton } from "./ChatButton";

export function ChatWidget() {
  const { isOpen } = useChat();

  return (
    <>
      <ChatButton />
      {isOpen && <ChatWindow />}
    </>
  );
}
