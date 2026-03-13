"use client";

import React, { useEffect, useState, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import { X, Send, Loader2, Phone } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { startChatSession, sendMessageStream, Chatbot } from "@/lib/chatbot-api";

const WELCOME_MESSAGE = `👋 您好！欢迎咨询申冷物流。

我们专注港口冷藏集装箱运输，提供：
✅ 全程制冷，GPS温控可追溯
✅ 自营车队，最高150万责任险
✅ 上海港区快速响应能力

如需了解报价或服务详情，请直接输入您的问题，我会尽力为您解答。`;

const REQUIRED_CHATBOT_ID = process.env.NEXT_PUBLIC_LOGISTICS_CHATBOT_ID?.trim() || "";
const CONFIGURED_CHATBOT_NAME =
  process.env.NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME?.trim() || "申冷售前顾问";

export function ChatWindow() {
  const { closeChat } = useChat();
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    async function init() {
      // 先显示固定欢迎信息
      setMessages([{ role: "ai", content: WELCOME_MESSAGE }]);

      try {
        setIsLoading(true);
        if (!REQUIRED_CHATBOT_ID) {
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              content:
                "系统配置缺失：未设置 NEXT_PUBLIC_LOGISTICS_CHATBOT_ID，暂时无法连接 AI 客服。",
            },
          ]);
          return;
        }

        const fixedBot: Chatbot = {
          id: REQUIRED_CHATBOT_ID,
          name: CONFIGURED_CHATBOT_NAME,
          description: "Configured Shenleng sales assistant",
        };
        setChatbot(fixedBot);

        const sid = await startChatSession(REQUIRED_CHATBOT_ID);
        setSessionId(sid);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "AI 客服暂时不可用，您可以直接拨打电话获得即时支持。",
          },
        ]);
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
    <div className="fixed inset-x-2 bottom-4 z-50 h-[600px] max-h-[80vh] w-auto rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col md:inset-x-auto md:right-4 md:w-[400px]">
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
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        ))}
        
        {/* 电话拨打按钮 - AI 未连通时保持可见 */}
        {(!sessionId || !chatbot) && (
          <div className="flex justify-start mb-4">
            <a
              href="tel:021-38930219"
              className="inline-flex items-center gap-2 bg-brand-deep text-white px-4 py-2.5 rounded-lg hover:bg-brand-deep/90 transition font-medium text-sm shadow-md"
            >
              <Phone size={18} />
              <span>📞 立即拨打：021-38930219</span>
            </a>
          </div>
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
            placeholder={chatbot ? "输入您的问题..." : "AI 客服连接中，您也可以直接拨打电话"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!chatbot || (isLoading && messages[messages.length -1]?.role === 'user')} 
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !chatbot || isLoading}
            className="bg-brand-deep text-white p-2 rounded-full hover:bg-brand-deep/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
