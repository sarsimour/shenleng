import type { CollectionConfig } from "payload";

export const SiteAccessLogs: CollectionConfig = {
  slug: "siteAccessLogs",
  admin: {
    useAsTitle: "path",
    defaultColumns: ["eventType", "method", "path", "statusCode", "botType", "botName", "createdAt"],
    group: "Analytics",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "eventType",
      type: "text",
      required: true,
      defaultValue: "request_seen",
      index: true,
      label: "Event Type",
    },
    {
      name: "source",
      type: "text",
      index: true,
      label: "Source",
    },
    {
      name: "method",
      type: "text",
      required: true,
      index: true,
      label: "Method",
    },
    {
      name: "path",
      type: "text",
      required: true,
      index: true,
      label: "Path",
    },
    {
      name: "query",
      type: "text",
      label: "Query",
    },
    {
      name: "statusCode",
      type: "number",
      index: true,
      label: "Status Code",
    },
    {
      name: "durationMs",
      type: "number",
      label: "Duration (ms)",
    },
    {
      name: "referrer",
      type: "text",
      label: "Referrer",
    },
    {
      name: "referrerHost",
      type: "text",
      index: true,
      label: "Referrer Host",
    },
    {
      name: "ipHash",
      type: "text",
      index: true,
      label: "IP Hash (Anonymized)",
    },
    {
      name: "userAgent",
      type: "text",
      label: "User Agent",
    },
    {
      name: "botType",
      type: "text",
      index: true,
      label: "Bot Type",
    },
    {
      name: "botName",
      type: "text",
      index: true,
      label: "Bot Name",
    },
    {
      name: "isBot",
      type: "checkbox",
      index: true,
      label: "Is Bot",
    },
    {
      name: "isSearchBot",
      type: "checkbox",
      index: true,
      label: "Is Search Bot",
    },
    {
      name: "isAIBot",
      type: "checkbox",
      index: true,
      label: "Is AI Bot",
    },
    {
      name: "deviceType",
      type: "text",
      index: true,
      label: "Device Type",
    },
    {
      name: "country",
      type: "text",
      index: true,
      label: "Country",
    },
    {
      name: "region",
      type: "text",
      index: true,
      label: "Region",
    },
    {
      name: "requestId",
      type: "text",
      index: true,
      label: "Request ID",
    },
  ],
};
