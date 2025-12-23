import React from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-24 lg:pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(59,130,246,0.05)_0%,rgba(255,255,255,0)_100%)]" />
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-center">
          {/* Left: Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-deep/5 border border-brand-deep/10 text-brand-deep text-sm font-medium mb-8">
              <ShieldCheck size={16} />
              <span>专业冷链 · 解决问题 · 敢于负责</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6 leading-[1.15]">
              把冷链交给我们，<br />
              <span className="text-brand-deep">您只需要关心生意</span>
            </h1>
            
            <p className="text-lg leading-8 text-slate-600 mb-10 max-w-xl">
              在冷链运输中，您担心断电、晚点或无人负责？申冷物流通过自营资产与数字化监控，让您的每一票货物都安全、准时、可追溯。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" className="rounded-full px-8">
                获取专业解决方案
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8">
                了解服务细节
              </Button>
            </div>

            <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-8">
              {[
                { icon: CheckCircle2, text: "全程制冷，过程可验证" },
                { icon: Zap, text: "港口异常快速处理能力" },
                { icon: ShieldCheck, text: "最高 150 万单车责任险" },
                { icon: CheckCircle2, text: "全自营团队，责任不外包" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <item.icon className="text-brand-accent" size={18} />
                  <span>{item.text}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: Visual / Image Placeholder */}
          <div className="mt-16 lg:mt-0 relative">
            <div className="aspect-[4/3] rounded-2xl bg-slate-100 overflow-hidden shadow-2xl border border-slate-200">
              {/* Using a placeholder service or abstract background for now */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-deep/20 to-transparent flex items-center justify-center p-12">
                 <div className="text-center">
                    <div className="inline-block p-4 rounded-3xl bg-white shadow-xl mb-4">
                       <ShieldCheck size={48} className="text-brand-deep" />
                    </div>
                    <div className="text-slate-400 font-medium italic">专业冷链物流场景占位</div>
                 </div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
                alt="Logistics background" 
                className="w-full h-full object-cover mix-blend-overlay opacity-60"
              />
            </div>
            
            {/* Stats Overlay */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden sm:block">
              <div className="text-3xl font-bold text-brand-deep">100%</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">全程温控覆盖率</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
