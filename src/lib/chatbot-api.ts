const API_BASE = "/api/proxy";
const ANONYMOUS_PASSWORD = "anonymous_placeholder";

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

// Keys for localStorage
const AUTH_TOKEN_KEY = "shenleng_chat_token";
const AUTH_USER_KEY = "shenleng_chat_user";

type StoredUser = { username: string };

let authInFlight: Promise<string> | null = null;

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
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(input, { ...init, headers });
  if (res.status !== 401) return res;

  // Token expired/invalid: re-auth once and retry.
  token = await getAuthToken(true);
  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${token}`);
  res = await fetch(input, { ...init, headers: retryHeaders });
  return res;
}

export async function getChatbots(): Promise<Chatbot[]> {
  const res = await authedFetch(`${API_BASE}/chatbots`);
  if (!res.ok) throw new Error("Failed to fetch chatbots");
  return res.json();
}

export async function startChatSession(chatbotId: string): Promise<string> {
  const res = await authedFetch(`${API_BASE}/chatbots/${chatbotId}/chat/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to start chat session");
  const data = await res.json();
  return data.id;
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
