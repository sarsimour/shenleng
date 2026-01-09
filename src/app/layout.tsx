import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileCTA } from "@/components/layout/MobileCTA";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "申冷物流 - 专业的港口冷藏集装箱运输服务商",
  description: "申冷物流专注提供安全、准时、全程制冷的港口冷链物流解决方案。自营车队、GPS监控、高额保险，为您的冷链业务保驾护航。",
  keywords: "冷链物流, 港口运输, 冷藏集装箱, 上海港, 申冷物流",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <Footer />
        <MobileCTA />
      </body>
    </html>
  );
}