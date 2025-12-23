import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <span className="text-2xl font-bold text-white">申冷物流</span>
            <p className="text-sm leading-6">
              专业的港口冷藏集装箱运输服务商。我们以资产为基础、以制度为保障、以责任为核心，为您的冷链业务保驾护航。
            </p>
            <div className="flex flex-col space-y-3">
              <a href="tel:123456789" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={16} />
                <span>123-4567-8910</span>
              </a>
              <a href="mailto:contact@shenleng.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={16} />
                <span>contact@shenleng.com</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>上海市某某区某某路 888 号</span>
              </div>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">服务</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="/services" className="text-sm leading-6 hover:text-white">冷藏集装箱运输</Link></li>
                  <li><Link href="/services" className="text-sm leading-6 hover:text-white">暂落箱与插电</Link></li>
                  <li><Link href="/services" className="text-sm leading-6 hover:text-white">内装仓储</Link></li>
                  <li><Link href="/services" className="text-sm leading-6 hover:text-white">多式联运</Link></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">关于</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="/about" className="text-sm leading-6 hover:text-white">公司介绍</Link></li>
                  <li><Link href="/advantages" className="text-sm leading-6 hover:text-white">核心优势</Link></li>
                  <li><Link href="/contact" className="text-sm leading-6 hover:text-white">联系我们</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs leading-5 text-slate-400">
            &copy; {new Date().getFullYear()} 申冷物流 (SHENLENG) 版权所有. 
          </p>
          <div className="flex gap-x-6">
             <span className="text-xs text-slate-400">沪ICP备12345678号-1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
