import React from "react";
import { AlarmClockCheck, ClipboardList, Route, ShieldCheck } from "lucide-react";

const workflow = [
  {
    title: "接单校验",
    icon: ClipboardList,
    detail: "确认箱型、温区、门点、截港时间与风口参数，避免“信息缺项”导致现场返工。",
    time: "T+0",
  },
  {
    title: "执行调度",
    icon: Route,
    detail: "按港区与路况动态分配运力，关键节点同步，异常预警前置。",
    time: "T+10min",
  },
  {
    title: "异常处理",
    icon: AlarmClockCheck,
    detail: "堵港、换箱、设备告警由专人接管，快速给出可执行方案。",
    time: "T+30min",
  },
  {
    title: "结果回传",
    icon: ShieldCheck,
    detail: "回传温控轨迹与操作记录，形成可复盘交付，支持后续索赔与质量追踪。",
    time: "交付后",
  },
];

export default function ValueProp() {
  return (
    <section id="advantages" className="py-24 bg-brand-navy text-white overflow-hidden relative scroll-mt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_80%_0%,rgba(30,157,230,0.2)_0%,rgba(10,27,45,0)_70%)]" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-14 max-w-3xl">
          <p className="text-sm font-semibold tracking-wider text-brand-accent uppercase">
            执行方法
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            货代最怕的不确定，我们把它流程化
          </h2>
          <p className="mt-4 text-blue-100/85 leading-7">
            申冷把复杂冷链拆成标准动作，避免“靠经验、靠临场、靠运气”的不稳定执行。
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {workflow.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-accent/30 text-white">
                    <item.icon size={20} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                </div>
                <span className="rounded-full border border-brand-accent/40 px-3 py-1 text-xs font-semibold text-brand-accent">
                  {item.time}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-blue-100/85">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
