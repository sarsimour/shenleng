import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B3C5D", // 冷链深蓝（港口感）
          light: "#1F6AA1",
        },
        accent: "#F5A623", // 行动按钮用
        muted: "#F6F8FA",  // 浅灰背景
      },
    },
  },
  plugins: [],
};

export default config;