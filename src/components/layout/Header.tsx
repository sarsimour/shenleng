"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, Phone, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/contexts/ChatContext";

const navigation = [
  { name: "首页", href: "/" },
  { name: "冷藏集装箱", href: "/services/container" },
  { name: "企业建设", href: "/development" },
  { name: "新闻中心", href: "/articles" },
  { name: "关于我们", href: "/about" },
  { name: "联系我们", href: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openChat } = useChat();
  const canUseDOM = typeof window !== "undefined";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="hidden lg:block border-b border-slate-200/70 bg-slate-900 text-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs lg:px-8">
          <div className="flex items-center gap-5">
            <span>服务对象：货代公司 / 外贸工厂 / 进口商</span>
            <span>24h 异常响应机制</span>
            <span>全程温控可追溯</span>
          </div>
          <span className="font-semibold text-slate-100">上海港 · 宁波港</span>
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-deep text-white font-bold">
              SL
            </div>
            <span className="text-2xl font-bold text-brand-deep tracking-tight">申冷物流</span>
            <span className="hidden sm:inline-block h-6 w-[1px] bg-slate-200 mx-2" />
            <span className="hidden sm:inline-block text-xs text-slate-500 font-semibold tracking-[0.18em]">SHENLENG LOGISTICS</span>
          </Link>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-7">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-[15px] font-semibold leading-6 text-slate-900 hover:text-brand-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 items-center">
          <a
            href="tel:021-38930219"
            data-analytics-target="header_phone"
            data-analytics-label="021-38930219"
            className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-brand-deep font-semibold text-sm"
          >
            <Phone size={16} />
            <span>021-38930219</span>
          </a>
          <Button
            size="sm"
            className="rounded-full px-5 font-semibold"
            data-analytics-event="chat_open"
            data-analytics-target="header_chat"
            data-analytics-label="10分钟获取运输建议"
            onClick={openChat}
          >
            10分钟获取运输建议
          </Button>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* Mobile menu - Rendered via Portal */}
      {canUseDOM && mobileMenuOpen && createPortal(
        <div className="relative z-[100]">
          {/* Transparent overlay for closing when clicking outside */}
          <div 
            className="fixed inset-0 bg-slate-900/10 lg:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile menu panel - Floating Card style */}
          <div className="fixed top-20 right-4 w-72 origin-top-right overflow-hidden rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-900/5 lg:hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="flex flex-col gap-y-1">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">导航菜单</span>
                <button
                  type="button"
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <p>货代公司友好：异常件优先处理</p>
                <p className="mt-1 flex items-center gap-1 text-brand-deep font-semibold">
                  <Clock3 size={12} />
                  7x24 值守
                </p>
              </div>
              
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center rounded-lg px-3 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="my-2 border-t border-slate-100" />
              
              <div className="px-2 py-2">
                <a
                  href="tel:021-38930219"
                  data-analytics-target="mobile_menu_phone"
                  data-analytics-label="021-38930219"
                  className="flex items-center gap-2 text-brand-deep font-bold text-sm mb-3"
                >
                  <Phone size={14} />
                  <span>021-38930219</span>
                </a>
                <Button
                  className="w-full text-xs py-3 rounded-lg shadow-md"
                  data-analytics-event="chat_open"
                  data-analytics-target="mobile_menu_chat"
                  data-analytics-label="立即沟通运力与报价"
                  onClick={() => { setMobileMenuOpen(false); openChat(); }}
                >
                  立即沟通运力与报价
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
