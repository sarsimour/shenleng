"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "首页", href: "/" },
  { name: "服务范围", href: "/#services" },
  { name: "核心优势", href: "/#advantages" },
  { name: "关于我们", href: "/about" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="text-2xl font-bold text-brand-deep tracking-tight">申冷物流</span>
            <span className="hidden sm:inline-block h-6 w-[1px] bg-slate-200 mx-2" />
            <span className="hidden sm:inline-block text-sm text-slate-500 font-medium">SHENLENG</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-slate-900 hover:text-brand-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 items-center">
          <a href="tel:123456789" className="flex items-center gap-2 text-brand-deep font-semibold text-sm mr-4">
            <Phone size={16} />
            <span>咨询热线</span>
          </a>
          <Button size="sm">获取专业解决方案</Button>
        </div>

        {/* Mobile menu button */}
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
      {mounted && mobileMenuOpen && createPortal(
        <div className="relative z-[100]">
          {/* Transparent overlay for closing when clicking outside */}
          <div 
            className="fixed inset-0 bg-slate-900/10 lg:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile menu panel - Floating Card style */}
          <div className="fixed top-20 right-4 w-64 origin-top-right overflow-hidden rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-900/5 lg:hidden animate-in zoom-in-95 fade-in duration-200">
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
                <a href="tel:123456789" className="flex items-center gap-2 text-brand-deep font-bold text-sm mb-3">
                  <Phone size={14} />
                  <span>123-4567-8910</span>
                </a>
                <Button className="w-full text-xs py-3 rounded-lg shadow-md">
                  获取专业解决方案
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
