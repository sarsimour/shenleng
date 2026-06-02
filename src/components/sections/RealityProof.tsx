import React from "react";
import Image from "next/image";
import { Camera, Clock3 } from "lucide-react";

const shots = [
  {
    title: "夜间进港作业",
    desc: "晚高峰时段进港窗口，重点盯防排队和温控稳定。",
    src: "/images/qi-ye-jian-she-content-4.JPG",
  },
  {
    title: "堆场插电现场",
    desc: "船期波动时的暂落箱与插电托管，避免冷链断档。",
    src: "/images/nei-zhuang-cang-chu-content-3.jpg",
  },
  {
    title: "门点提箱执行",
    desc: "门点时间敏感场景，调度与车队实时协同。",
    src: "/images/leng-cang-ji-zhuang-xiang-content-4.jpg",
  },
];

export default function RealityProof() {
  return (
    <section id="proof" className="py-24 bg-slate-100/70 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-wider text-brand-primary uppercase">
              现场执行证据
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              我们保留作业真实感，不做过度包装
            </h2>
            <p className="mt-4 text-slate-600 leading-7">
              对货代团队来说，真实作业能力比视觉“精修”更重要。我们记录一线作业现场，让每一次托付都看得见执行细节。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
            <Camera size={14} />
            现场原图优先
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {shots.map((shot) => (
            <article key={shot.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3]">
                <Image
                  src={shot.src}
                  alt={shot.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900">{shot.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{shot.desc}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-deep">
                  <Clock3 size={12} />
                  一线作业记录
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
