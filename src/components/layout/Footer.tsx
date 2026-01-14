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
              专业的港口冷藏集装箱运输服务商。安全、准时、全程制冷，以客户为中心、以品质求生存。
            </p>
            <div className="flex flex-col space-y-3">
              <a href="tel:021-38930219" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={16} />
                <span>021-38930219 / 021-50673637</span>
              </a>
              <a href="mailto:wangyw@sl-cold.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={16} />
                <span>wangyw@sl-cold.com</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>上海市浦东新区华洲路94号</span>
              </div>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">服务</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="/services/container" className="text-sm leading-6 hover:text-white">冷藏集装箱</Link></li>
                  <li><Link href="/services/warehouse" className="text-sm leading-6 hover:text-white">内装仓储</Link></li>
                  <li><Link href="/development" className="text-sm leading-6 hover:text-white">企业建设</Link></li>
                  <li><Link href="/articles" className="text-sm leading-6 hover:text-white">新闻中心</Link></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">关于</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="/about" className="text-sm leading-6 hover:text-white">公司介绍</Link></li>
                  <li><Link href="/contact" className="text-sm leading-6 hover:text-white">联系我们</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs leading-5 text-slate-400">
            &copy; {new Date().getFullYear()} 上海申冷国际物流有限公司 版权所有
          </p>
          <div className="flex gap-x-6">
             <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white">
               沪ICP备18000932号-1
             </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
