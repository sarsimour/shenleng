"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/contexts/ChatContext";
import {
  ShieldCheck,
  ThermometerSnowflake,
  Clock3,
  Siren,
  CircleCheckBig,
} from "lucide-react";

const capabilities = [
  "上海港/宁波港冷藏箱进出口运输",
  "冷箱插电托管与状态巡检",
  "异常件快速响应与多式联运衔接",
];

const dashboard = [
  { label: "常规调度响应", value: "10-30 分钟" },
  { label: "单车责任险", value: "最高 150 万" },
  { label: "温控监控", value: "全程可追溯" },
  { label: "服务模式", value: "全自营" },
];

export default function Hero() {
  const { openChat } = useChat();

  return (
    <section className="relative overflow-hidden pt-20 pb-20 lg:pt-28 lg:pb-24">
      <div className="absolute inset-0 -z-10 pattern-grid opacity-40" />
      <div className="absolute -top-24 right-[-160px] -z-10 h-[420px] w-[420px] rounded-full bg-brand-accent/15 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-deep/15 bg-white px-3 py-1.5 text-sm font-semibold text-brand-deep">
              <ShieldCheck size={15} />
              货代团队的冷链执行伙伴
            </div>

            <h1 className="text-4xl font-bold leading-[1.12] text-slate-900 sm:text-5xl lg:text-6xl">
              报价快、执行稳、
              <br />
              <span className="text-brand-deep">异常件有兜底</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              你关心的不只是运价，而是准点提箱、全程制冷、出了异常有人扛责。申冷把这些环节做成可执行、可追踪、可复盘的标准化服务。
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {capabilities.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <CircleCheckBig className="mt-0.5 shrink-0 text-brand-accent" size={15} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={openChat} size="lg" className="rounded-full px-8 font-semibold">
                立即沟通运力与报价
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 font-semibold"
                onClick={() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" })}
              >
                查看现场执行证据
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  <Clock3 size={14} />
                  准时率
                </div>
                <div className="mt-2 text-2xl font-bold text-brand-deep">99%+</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  <ThermometerSnowflake size={14} />
                  温控覆盖
                </div>
                <div className="mt-2 text-2xl font-bold text-brand-deep">100%</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  <Siren size={14} />
                  异常响应
                </div>
                <div className="mt-2 text-2xl font-bold text-brand-deep">7x24</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="relative aspect-[5/4]">
                <Image
                  src="/images/jin-chu-kou-yun-shu-content-1.JPG"
                  alt="申冷物流港区作业现场"
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071524]/70 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-deep">
                  现场实拍 · 非精修图
                </div>
                <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/25 bg-black/35 p-4 text-white backdrop-blur-sm">
                  <p className="text-sm text-slate-100">当前服务重点</p>
                  <p className="mt-1 text-xl font-bold">港口冷藏箱进出口运输与异常件兜底</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-0 border-t border-slate-200">
                {dashboard.map((item) => (
                  <div key={item.label} className="border-r border-b border-slate-200 px-4 py-3 last:border-r-0 even:border-r-0">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-1 text-base font-bold text-brand-deep">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
