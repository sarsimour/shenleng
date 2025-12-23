import React from "react";
import { Eye, ShieldCheck, Award, MessageSquare } from "lucide-react";

const values = [
  {
    name: "过程可验证，拒绝“经验主义”",
    description: "全车配备 GPS + 发电机云监控系统。准时率与温控全程可追溯，数据实时上传，不靠口头保证。",
    icon: Eye,
  },
  {
    name: "资产与制度托底",
    description: "冷链不是靠调度拼出来的，而是靠自有资产和严格制度支撑。我们把事情做重，只为让您更省心。",
    icon: Award,
  },
  {
    name: "风险兜底，不扯皮",
    description: "单车物流责任险最高 150 万，可按需加购单票货物险。出了问题我们敢于负责，风险我们扛。",
    icon: ShieldCheck,
  },
  {
    name: "快速响应的专家团队",
    description: "上海港首批进口备案冷运车队。懂冷藏箱、懂堆场、懂调度，遇到异常情况快速处理，减少您的沟通成本。",
    icon: MessageSquare,
  },
];

export default function ValueProp() {
  return (
    <section id="advantages" className="py-24 bg-brand-deep text-white overflow-hidden relative scroll-mt-20">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
        <Award size={400} />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-brand-accent">为什么选择申冷</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            一次不出问题，比什么都重要
          </p>
          <p className="mt-6 text-lg leading-8 text-blue-100/70">
            我们理解冷链业务的脆弱性，因此我们建立了最稳固的保障体系，让您无需反复解释。
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {values.map((value) => (
              <div key={value.name} className="relative pl-16">
                <dt className="text-xl font-bold leading-7">
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-accent text-white shadow-lg">
                    <value.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  {value.name}
                </dt>
                <dd className="mt-4 text-base leading-7 text-blue-100/70">
                  {value.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
