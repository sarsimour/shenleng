import React from "react";
import { Truck, Warehouse, Zap, RefreshCw, FileCheck2 } from "lucide-react";

const services = [
  {
    title: "港口冷藏集装箱运输",
    icon: Truck,
    desc: "覆盖上海港、宁波港的冷藏箱进出口运输。适配货代高频提还箱和多门点调度。",
    output: "交付：提箱计划、进港节点、全程温控记录",
    sla: "典型响应：10-30 分钟",
  },
  {
    title: "暂落箱与插电托管",
    icon: Zap,
    desc: "船期调整、堆场拥堵等场景下提供持续插电与状态巡检，避免冷链中断。",
    output: "交付：插电值守记录、温度异常提醒",
    sla: "支持：24h 值守",
  },
  {
    title: "港区冷箱插电托管",
    icon: Warehouse,
    desc: "围绕港区时效与温控稳定，提供短时托管、插电值守与状态巡检。",
    output: "交付：插电值守记录、温控巡检回传",
    sla: "支持：高频波动场景",
  },
  {
    title: "异常件处理与联运衔接",
    icon: RefreshCw,
    desc: "换箱、修箱、临时改港、堵港排队等异常由专人处理，降低沟通损耗。",
    output: "交付：异常处理方案与过程留痕",
    sla: "机制：7x24 快速响应",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-white scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-14 max-w-3xl">
          <p className="text-sm font-semibold tracking-wider text-brand-primary uppercase">
            货代合作场景
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            每个服务都对应一个可执行的交付清单
          </h2>
          <p className="mt-4 text-slate-600 leading-7">
            我们不只描述“能做什么”，而是明确告诉你“怎么做、交付什么、出现异常怎么办”，减少反复沟通。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-deep text-white">
                <service.icon size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{service.desc}</p>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-deep">
                  <FileCheck2 size={15} />
                  {service.output}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {service.sla}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
