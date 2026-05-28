export type BotCategory = "human" | "search_bot" | "ai_bot" | "tool_bot" | "unknown_bot";

export type DeviceType = "mobile" | "desktop" | "tablet" | "bot" | "unknown";

export type BotClassification = {
  botType: BotCategory;
  botName: string;
  isBot: boolean;
  isSearchBot: boolean;
  isAIBot: boolean;
};

type BotRule = {
  name: string;
  type: Exclude<BotCategory, "human">;
  pattern: RegExp;
};

const BOT_RULES: BotRule[] = [
  { name: "Baiduspider", type: "search_bot", pattern: /baiduspider/i },
  { name: "Sogou Spider", type: "search_bot", pattern: /sogou.*spider|sogou web spider/i },
  { name: "360Spider", type: "search_bot", pattern: /360spider|haosouspider/i },
  { name: "Bingbot", type: "search_bot", pattern: /bingbot/i },
  { name: "Googlebot", type: "search_bot", pattern: /googlebot/i },
  { name: "YandexBot", type: "search_bot", pattern: /yandexbot/i },
  { name: "Bytespider", type: "ai_bot", pattern: /bytespider/i },
  { name: "DoubaoBot", type: "ai_bot", pattern: /doubaobot|doubao/i },
  { name: "GPTBot", type: "ai_bot", pattern: /gptbot/i },
  { name: "ClaudeBot", type: "ai_bot", pattern: /claudebot|anthropic-ai/i },
  { name: "PerplexityBot", type: "ai_bot", pattern: /perplexitybot/i },
  { name: "Applebot", type: "ai_bot", pattern: /applebot/i },
  { name: "Common Crawl", type: "ai_bot", pattern: /ccbot|commoncrawl/i },
  { name: "curl", type: "tool_bot", pattern: /curl/i },
  { name: "wget", type: "tool_bot", pattern: /wget/i },
  { name: "Python", type: "tool_bot", pattern: /python-requests|python/i },
  { name: "Go HTTP Client", type: "tool_bot", pattern: /go-http-client/i },
  { name: "Java HTTP Client", type: "tool_bot", pattern: /java\/|apache-httpclient/i },
  { name: "Headless Browser", type: "tool_bot", pattern: /headless|playwright|puppeteer/i },
  { name: "Lighthouse", type: "tool_bot", pattern: /lighthouse/i },
  { name: "Uptime Monitor", type: "tool_bot", pattern: /uptime|monitor|statuscake|pingdom/i },
];

const GENERIC_BOT_PATTERN = /bot|spider|crawler|scrapy|httpclient/i;

export function classifyUserAgent(userAgent: string | null | undefined): BotClassification {
  const ua = userAgent?.trim() || "";
  if (!ua) {
    return {
      botType: "unknown_bot",
      botName: "unknown",
      isBot: true,
      isSearchBot: false,
      isAIBot: false,
    };
  }

  const match = BOT_RULES.find((rule) => rule.pattern.test(ua));
  if (match) {
    return {
      botType: match.type,
      botName: match.name,
      isBot: true,
      isSearchBot: match.type === "search_bot",
      isAIBot: match.type === "ai_bot",
    };
  }

  if (GENERIC_BOT_PATTERN.test(ua)) {
    return {
      botType: "unknown_bot",
      botName: "generic_bot",
      isBot: true,
      isSearchBot: false,
      isAIBot: false,
    };
  }

  return {
    botType: "human",
    botName: "",
    isBot: false,
    isSearchBot: false,
    isAIBot: false,
  };
}

export function detectDeviceType(
  userAgent: string | null | undefined,
  classification = classifyUserAgent(userAgent),
): DeviceType {
  if (classification.isBot) return "bot";

  const ua = userAgent?.toLowerCase() || "";
  if (!ua) return "unknown";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/iphone|android|mobile|windows phone/.test(ua)) return "mobile";
  if (/macintosh|windows nt|x11|linux/.test(ua)) return "desktop";
  return "unknown";
}
