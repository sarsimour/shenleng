const API_BASE = "/api/proxy";

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: string;
}

// Key for localStorage
const AUTH_TOKEN_KEY = "shenleng_chat_token";
const AUTH_USER_KEY = "shenleng_chat_user";

export async function getAuthToken(): Promise<string> {
  if (typeof window === "undefined") return "";
  
  let token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) return token;

  try {
    // 1. Create Anonymous User
    const regRes = await fetch(`${API_BASE}/users/anonymous`, {
      method: "POST",
    });
    
    if (!regRes.ok) {
        console.error("Anonymous creation failed", await regRes.text());
        throw new Error("Guest registration failed");
    }

    const user = await regRes.json();
    const username = user.phone;

    // 2. Login with placeholder password
    // Backend handles password validation for "anonymous_" users automatically
    const loginRes = await fetch(`${API_BASE}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username,
        password: "anonymous_placeholder",
        grant_type: "password"
      }),
    });

    if (!loginRes.ok) throw new Error("Guest login failed");

    const data = await loginRes.json();
    token = data.access_token;
    localStorage.setItem(AUTH_TOKEN_KEY, token!); 
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username }));
    
    return token!;
  } catch (err) {
    console.error("Auth error:", err);
    throw err;
  }
}

export async function getChatbots(): Promise<Chatbot[]> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/chatbots`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch chatbots");
  return res.json();
}

export async function startChatSession(chatbotId: string): Promise<string> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/chatbots/${chatbotId}/chat/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to start chat session");
  const data = await res.json();
  return data.id;
}

export async function* sendMessageStream(
  chatbotId: string,
  sessionId: string,
  message: string
): AsyncGenerator<string, void, unknown> {
  const token = await getAuthToken();
  
  // WealthOS-compatible payload structure
  const payload = {
    contents: [
      {
        content_type: "text",
        content: message,
        order: 0
      }
    ]
  };

  const res = await fetch(`${API_BASE}/chatbots/${chatbotId}/chat/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to send message");
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; 

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        // Handle StreamEvent structure from WealthOS
        // types: 'text', 'ai_message', etc.
        if (event.content) {
          if (typeof event.content === 'string') {
             yield event.content;
          } else if (typeof event.content === 'object' && event.content.text) {
             // Handle structured content part
             yield event.content.text;
          }
        }
      } catch (e) {
        console.warn("Failed to parse stream line:", line, e);
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer);
      if (event.content) {
         if (typeof event.content === 'string') {
             yield event.content;
          } else if (typeof event.content === 'object' && event.content.text) {
             yield event.content.text;
          }
      }
    } catch (e) {
      console.warn("Failed to parse final stream line:", buffer, e);
    }
  }
}
