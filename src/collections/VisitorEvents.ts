import type { CollectionConfig } from "payload";

export const VisitorEvents: CollectionConfig = {
  slug: "visitorEvents",
  admin: {
    useAsTitle: "path",
    defaultColumns: ["path", "utmSource", "referrerHost", "createdAt"],
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
      name: "pageTitle",
      type: "text",
      label: "Page Title",
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
      name: "sessionId",
      type: "text",
      index: true,
      label: "Session ID",
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
      name: "utmSource",
      type: "text",
      index: true,
      label: "UTM Source",
    },
    {
      name: "utmMedium",
      type: "text",
      index: true,
      label: "UTM Medium",
    },
    {
      name: "utmCampaign",
      type: "text",
      index: true,
      label: "UTM Campaign",
    },
    {
      name: "utmContent",
      type: "text",
      label: "UTM Content",
    },
    {
      name: "utmTerm",
      type: "text",
      label: "UTM Term",
    },
  ],
};
