import React from "react";
import { Container, Truck, Warehouse, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "港口冷藏集装箱运输",
    description: "专注上海港、宁波港冷藏箱进出口运输。自有冷藏车、挂板与发电机，确保提箱、进港全程不断链。",
    icon: Truck,
    highlight: "自营车队，责任不外包",
  },
  {
    title: "暂落箱与插电服务",
    description: "提供专业堆场暂落与24小时连续插电服务。解决船期变动导致的冷藏箱存储压力。",
    icon: Zap,
    highlight: "24小时状态监控",
  },
  {
    title: "冷链内装与仓储",
    description: "高标准冷库内装服务，支持散货拼箱。专业团队操作，确保货物在装箱过程中的温度稳定性。",
    icon: Warehouse,
    highlight: "医药/食品级操作标准",
  },
  {
    title: "多式联运及异常处理",
    description: "熟悉港口规则，快速处理换箱、修箱、异常调度。通过多式联运优化长途冷链运输成本。",
    icon: RefreshCw,
    highlight: "快速解决港口异常",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-slate-50 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-brand-primary">专业服务范围</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            全方位的冷链物流解决方案
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            我们不仅仅是运输者，更是您冷链供应链中可靠的问题解决专家。
          </p>
        </div>
        
        <div className="mx-auto grid max-w-none grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex flex-col bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-deep/5 text-brand-deep">
                <service.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
              <p className="text-slate-600 text-sm leading-6 mb-6 flex-grow">
                {service.description}
              </p>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-brand-primary font-semibold text-xs uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                {service.highlight}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
