"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ShieldCheck, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

const bannerImages = [
  { src: "/media/banner-1.jpg", alt: "申冷物流 - 安全准时全程制冷" },
  { src: "/media/banner-2.jpg", alt: "申冷物流 - 专业冷藏集装箱运输" },
  { src: "/media/banner-3.jpg", alt: "申冷物流 - 港口冷链运输车队" },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { openChat } = useChat();

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

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
              <Button size="lg" className="rounded-full px-8" onClick={openChat}>
                获取专业解决方案
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full px-8"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
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

          {/* Right: Image Carousel */}
          <div className="mt-16 lg:mt-0 relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 relative group">
              {/* Carousel Images */}
              {bannerImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    unoptimized
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
                aria-label="上一张"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
                aria-label="下一张"
              >
                <ChevronRight size={24} />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {bannerImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentSlide
                        ? "bg-white w-8"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`跳转到第 ${index + 1} 张图片`}
                  />
                ))}
              </div>

              {/* Slogan Overlay */}
              <div className="absolute bottom-12 left-6 right-6 text-white pointer-events-none">
                <div className="text-2xl sm:text-3xl font-bold tracking-wider drop-shadow-lg">
                  安全 | 准时 | 全程制冷
                </div>
              </div>
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
