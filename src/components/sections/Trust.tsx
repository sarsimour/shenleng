import React from "react";
import { Handshake, Landmark, Building2 } from "lucide-react";

const clients = ["丰岛", "费列罗", "恒瑞医药", "万华化学", "雀巢", "亿滋"];

const reasons = [
  "不把风险转嫁给客户，执行问题可追责",
  "遇到异常先处理，再复盘，不让货代反复解释",
  "文章和SOP沉淀持续输出，团队认知长期升级",
];

export default function Trust() {
  return (
    <section className="py-24 bg-slate-100/60">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold tracking-wider text-brand-primary uppercase">合作信任</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              货代愿意持续合作，核心是“确定性”
            </h2>
            <p className="mt-4 text-slate-600 leading-7">
              我们不是靠一次报价竞争，而是靠长期稳定的执行结果。尤其在高货值、强时效场景，确定性比价格更重要。
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-brand-deep">10+</p>
                <p className="mt-1 text-sm text-slate-600">行业经验</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-brand-deep">50+</p>
                <p className="mt-1 text-sm text-slate-600">自有车辆</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-brand-deep">24h</p>
                <p className="mt-1 text-sm text-slate-600">实时值守</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2 text-brand-deep">
              <Handshake size={18} />
              <p className="text-sm font-semibold uppercase tracking-wider">长期合作原因</p>
            </div>
            <ul className="mt-5 space-y-4">
              {reasons.map((reason) => (
                <li key={reason} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {reason}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-slate-500">部分合作客户</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {clients.map((client, index) => (
                  <div
                    key={client}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-3 text-sm font-bold text-slate-600"
                  >
                    {index % 2 === 0 ? <Landmark size={14} className="mr-1 text-slate-400" /> : <Building2 size={14} className="mr-1 text-slate-400" />}
                    {client}
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
