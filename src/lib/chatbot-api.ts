export const API_BASE = "/api/proxy";
const ANONYMOUS_PASSWORD = "anonymous_placeholder";
const APP_ID_HEADER = "X-App-ID";
const DEFAULT_APP_ID = process.env.NEXT_PUBLIC_VERSECORE_APP_ID || "logistics-web";

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatar?: ChatbotAvatar | string | null;
  avatar_url?: string | null;
}

export interface ChatbotAvatar {
  inner_url?: string | null;
  public_url?: string | null;
  content_type?: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: string;
}

interface BackendMessageContent {
  content_type: string;
  content: string;
  order: number;
  meta_info?: {
    fallbackText?: string;
  } | null;
}

interface BackendChatMessage {
  id: string;
  role: string;
  timestamp: string;
  contents: BackendMessageContent[];
}

// Keys for localStorage
const AUTH_TOKEN_KEY = "shenleng_chat_token";
const AUTH_USER_KEY = "shenleng_chat_user";

type StoredUser = { username: string };

let authInFlight: Promise<string> | null = null;

function withAppIdHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  merged.set(APP_ID_HEADER, DEFAULT_APP_ID);
  return merged;
}

function readStoredUsername(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredUser> | null;
    if (parsed && typeof parsed.username === "string" && parsed.username.trim()) {
      return parsed.username;
    }
  } catch {
    // Backward compatibility for malformed old data
    if (raw.trim()) return raw.trim();
  }

  return null;
}

function saveAuth(username: string, token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username }));
}

function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function loginWithUsername(username: string): Promise<string | null> {
  const loginRes = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: withAppIdHeaders({ "Content-Type": "application/x-www-form-urlencoded" }),
    body: new URLSearchParams({
      username,
      password: ANONYMOUS_PASSWORD,
      grant_type: "password",
    }),
  });

  if (!loginRes.ok) return null;

  const data = await loginRes.json();
  const token = data?.access_token;

  return typeof token === "string" && token ? token : null;
}

async function createAnonymousUsername(): Promise<string> {
  const regRes = await fetch(`${API_BASE}/users/anonymous`, {
    method: "POST",
    headers: withAppIdHeaders(),
  });

  if (!regRes.ok) {
    const body = await regRes.text();
    console.error("Anonymous creation failed", body);
    throw new Error(`Guest registration failed (${regRes.status})`);
  }

  const user = await regRes.json();
  const username = user?.phone ?? user?.username;

  if (typeof username !== "string" || !username) {
    throw new Error("Guest registration response missing username");
  }

  return username;
}

async function obtainAuthToken(): Promise<string> {
  const cachedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (cachedToken) return cachedToken;

  // Idempotent path: if we already have a previous anonymous username, try login directly first.
  const storedUsername = readStoredUsername();
  if (storedUsername) {
    const reusedToken = await loginWithUsername(storedUsername);
    if (reusedToken) {
      saveAuth(storedUsername, reusedToken);
      return reusedToken;
    }
  }

  // Fallback path: create a fresh anonymous user and login.
  const username = await createAnonymousUsername();
  const token = await loginWithUsername(username);

  if (!token) {
    throw new Error("Guest login failed");
  }

  saveAuth(username, token);
  return token;
}

export async function getAuthToken(forceRefresh = false): Promise<string> {
  if (typeof window === "undefined") return "";

  if (forceRefresh) {
    clearAuth();
  } else {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return token;
  }

  if (authInFlight) return authInFlight;

  authInFlight = (async () => {
    try {
      return await obtainAuthToken();
    } finally {
      authInFlight = null;
    }
  })();

  return authInFlight;
}

async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let token = await getAuthToken();
  const headers = withAppIdHeaders(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(input, { ...init, headers });
  if (res.status !== 401) return res;

  // Token expired/invalid: re-auth once and retry.
  token = await getAuthToken(true);
  const retryHeaders = withAppIdHeaders(init.headers);
  retryHeaders.set("Authorization", `Bearer ${token}`);
  res = await fetch(input, { ...init, headers: retryHeaders });
  return res;
}

export async function authedProxyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return authedFetch(`${API_BASE}${normalizedPath}`, init);
}

export async function getChatbots(): Promise<Chatbot[]> {
  const res = await authedFetch(`${API_BASE}/chatbots`);
  if (!res.ok) throw new Error("Failed to fetch chatbots");
  return res.json();
}

export async function getChatbot(chatbotId: string): Promise<Chatbot> {
  const res = await authedFetch(`${API_BASE}/chatbots/${chatbotId}`);
  if (!res.ok) throw new Error("Failed to fetch chatbot");
  const data = await res.json();
  const chatbot = data?.chatbot ?? data;

  if (!chatbot || typeof chatbot.id !== "string") {
    throw new Error("Chatbot response missing chatbot");
  }

  return chatbot;
}

export function getChatbotAvatarUrl(chatbot: Pick<Chatbot, "avatar" | "avatar_url"> | null): string | undefined {
  if (!chatbot) return undefined;

  if (typeof chatbot.avatar_url === "string" && chatbot.avatar_url.trim()) {
    return chatbot.avatar_url;
  }

  if (typeof chatbot.avatar === "string" && chatbot.avatar.startsWith("http")) {
    return chatbot.avatar;
  }

  if (
    chatbot.avatar &&
    typeof chatbot.avatar === "object" &&
    typeof chatbot.avatar.public_url === "string" &&
    chatbot.avatar.public_url.trim()
  ) {
    return chatbot.avatar.public_url;
  }

  return undefined;
}

export async function startChatSession(chatbotId: string): Promise<string> {
  const res = await authedFetch(`${API_BASE}/chatbots/${chatbotId}/chat/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to start chat session");
  const data = await res.json();
  return data.id;
}

function normalizeHistoryRole(role: string): ChatMessage["role"] {
  if (role === "assistant" || role === "ai") return "ai";
  if (role === "system") return "system";
  return "user";
}

function extractHistoryContent(contents: BackendMessageContent[]): string {
  return [...contents]
    .sort((left, right) => left.order - right.order)
    .map((item) => {
      if (item.content_type === "text") return item.content;
      if (item.content_type === "interaction" && item.meta_info?.fallbackText) {
        return item.meta_info.fallbackText;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function getChatHistory(
  chatbotId: string,
  sessionId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const res = await authedFetch(
    `${API_BASE}/chatbots/${chatbotId}/chat/${sessionId}/history?limit=${limit}`,
  );
  if (!res.ok) throw new Error("Failed to fetch chat history");

  const history = (await res.json()) as BackendChatMessage[];

  return history
    .slice()
    .reverse()
    .map((message) => ({
      id: message.id,
      role: normalizeHistoryRole(message.role),
      content: extractHistoryContent(message.contents || []),
      timestamp: message.timestamp,
    }))
    .filter((message) => message.content);
}

export async function* sendMessageStream(
  chatbotId: string,
  sessionId: string,
  message: string,
): AsyncGenerator<string, void, unknown> {
  // WealthOS-compatible payload structure
  const payload = {
    contents: [
      {
        content_type: "text",
        content: message,
        order: 0,
      },
    ],
  };

  const res = await authedFetch(`${API_BASE}/chatbots/${chatbotId}/chat/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
        if (event.content) {
          if (typeof event.content === "string") {
            yield event.content;
          } else if (typeof event.content === "object" && event.content.text) {
            yield event.content.text;
          }
        }
      } catch (e) {
        console.warn("Failed to parse stream line:", line, e);
      }
    }
  }

  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer);
      if (event.content) {
        if (typeof event.content === "string") {
          yield event.content;
        } else if (typeof event.content === "object" && event.content.text) {
          yield event.content.text;
        }
      }
    } catch (e) {
      console.warn("Failed to parse final stream line:", buffer, e);
    }
  }
}
