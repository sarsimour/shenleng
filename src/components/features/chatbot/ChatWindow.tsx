"use client";

import React, { useEffect, useState, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import { X, Send, Loader2 } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { getChatbots, startChatSession, sendMessageStream, Chatbot } from "@/lib/chatbot-api";

export function ChatWindow() {
  const { closeChat } = useChat();
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const bots = await getChatbots();
        if (bots.length > 0) {
          // Prefer "Test Chatbot" or the first one
          const selectedBot = bots.find(b => b.name === "Test Chatbot") || bots[0];
          setChatbot(selectedBot);
          
          const sid = await startChatSession(selectedBot.id);
          setSessionId(sid);
          
          setMessages([{ role: "ai", content: `您好！我是${selectedBot.name}。有什么我可以帮您的吗？` }]);
        } else {
          setError("暂无可用客服。");
        }
      } catch (err) {
        console.error(err);
        setError("无法连接到客服系统。");
      } finally {
        setIsLoading(false);
      }
    }

    if (!sessionId) {
      init();
    }
  }, [sessionId]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatbot || !sessionId || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      // Add placeholder for AI response
      setMessages((prev) => [...prev, { role: "ai", content: "" }]);

      const stream = sendMessageStream(chatbot.id, sessionId, userMsg);
      
      let fullContent = "";
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages((prev) => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.role === "ai") {
            lastMsg.content = fullContent;
          }
          return newMsgs;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "ai", content: "抱歉，出错了，请稍后再试。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-brand-deep text-white p-4 flex justify-between items-center shrink-0">
        <div className="font-bold text-lg flex items-center gap-2">
           {chatbot ? chatbot.name : "在线客服"}
        </div>
        <button onClick={closeChat} className="hover:bg-white/20 rounded-full p-1 transition">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" ref={scrollRef}>
        {error ? (
          <div className="text-center text-red-500 mt-10">{error}</div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
           <div className="flex justify-start mb-4">
             <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
               <Loader2 size={16} className="animate-spin text-gray-500" />
               <span className="text-sm text-gray-500">思考中...</span>
             </div>
           </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-deep/50 text-sm"
            placeholder="输入您的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!error || (isLoading && messages[messages.length -1]?.role === 'user')} 
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !!error || isLoading}
            className="bg-brand-deep text-white p-2 rounded-full hover:bg-brand-deep/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
