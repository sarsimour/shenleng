import React from "react";

const clients = [
  "丰岛", "费列罗", "恒瑞医药", "万华化学", "雀巢", "亿滋"
];

export default function Trust() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-x-8 gap-y-16 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              众多行业领先企业<br />选择申冷物流
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              他们选择我们不是因为价格最低，而是因为在食品、医药、化工等高货值领域，稳定性和安全性是不可逾越的底线。
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-brand-deep">10+</span>
                <span className="text-sm text-slate-500 font-medium">行业经验</span>
              </div>
              <div className="w-px bg-slate-200 h-10 self-center" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-brand-deep">50+</span>
                <span className="text-sm text-slate-500 font-medium">自有车辆</span>
              </div>
              <div className="w-px bg-slate-200 h-10 self-center" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-brand-deep">24h</span>
                <span className="text-sm text-slate-500 font-medium">实时监控</span>
              </div>
            </div>
          </div>
          <div className="mx-auto grid w-full max-w-xl grid-cols-2 items-center gap-y-12 sm:grid-cols-3 lg:mx-0 lg:max-w-none">
            {clients.map((client) => (
              <div key={client} className="flex justify-center px-4">
                <span className="text-2xl font-bold text-slate-300 hover:text-brand-deep transition-colors cursor-default select-none">
                  {client}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
