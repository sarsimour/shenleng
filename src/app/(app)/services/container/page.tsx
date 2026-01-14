import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "冷藏集装箱 - 申冷物流",
  description: "冷藏集装箱被普遍用于国际冷藏货物的海铁公路运输，申冷物流提供专业的冷藏集装箱运输服务。",
};

export default function ContainerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <nav className="text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-brand-primary">首页</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900">冷藏集装箱</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            冷藏集装箱
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            专业冷藏集装箱运输服务，确保您的货物全程保鲜
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 pb-24">
        <div className="prose prose-lg prose-slate max-w-none">
          <p>
            <strong>冷藏集装箱被普遍用于国际冷藏货物的海铁公路运输。</strong>
          </p>
          <p>
            冷藏集装箱又被称为冷柜、冷箱、冷冻箱、冷藏箱、冻柜等，多用于进出口运输，不仅包括海运冷藏集装箱还包括铁路冷藏集装箱，
            冷藏集装箱多为高柜，代码为RF/RH等，白色箱身，内部为平整的金属箱壁，瓦楞状铝制底板，上下留有风道
            （上方为载货红线以上空间，下方为瓦楞底板的缝隙，以及前后各留一定距离，形成可供冷风循环的通道），
            制冷剂多为R134a，比较先进的冷箱会内置温度检测仪，还有可以实现箱内湿度调节的喷淋及对箱体内的空气成分进行控制的含氮箱，
            主要冷机品牌有开利、三菱、大金等。
          </p>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg my-8">
            <Image
              src="/media/leng-cang-ji-zhuang-xiang-content-1.jpg"
              alt="冷藏集装箱"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <h2>冷箱适运货物品种</h2>
          <p>
            海鲜、冷冻蔬菜、冻肉、水果、奶油、药品、疫苗、新型材料、电子元器件、半导体、浓缩原液等需要恒温或者低温运输的产品。
          </p>

          <h2>冷藏集装箱陆上拖运注意事项</h2>
          
          <h3>1. 箱况检查</h3>
          <p>
            冷藏集装箱在提箱时，必须对箱子的外观进行检查，看是否有明显的破损和补丁，同时也要对箱体的内部进行检查，
            是否有异味，污损、漏水、冷机异响等等。确保集装箱的品质符合运输要求，避免因此产生其他不必要的损失。
          </p>

          <h3>2. 温度</h3>
          <p>
            不同货物的温度要求有很大差别，温度的范围从-24℃到+24℃不等。冷藏食品的温度设置普遍较低，如海鲜大部分要求-18℃及以下；
            药品和试剂等温度设置普遍较高，一般为+18℃及以上。温度的设置必须正确，需要提箱时进行反复确认，
            运输途中的实时温度也不能脱离正常范围，需要驾驶员在整个运输过程中对集装箱的温度进行持续关注，有异常情况时及时反馈和处理。
          </p>

          <h3>3. 通风口设置</h3>
          <p>
            不同货物对于集装箱通风口的要求也有所不同，从完全关闭到打开100％不等。
            温度和通风口设置这两项参数，堆场的电工一般是会设置好才会允许提离堆场，
            但是堆场电工的检查并不严谨，所以，驾驶员仍然进行复检和确认，以免出现纰漏。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/media/leng-cang-ji-zhuang-xiang-content-2.png"
                alt="冷藏集装箱控制面板"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/media/leng-cang-ji-zhuang-xiang-content-3.jpg"
                alt="冷藏集装箱内部"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>

          <h2>化霜原理</h2>
          <p>
            对于设定温度较低的冷箱在制冷时，内部蒸发器的表面温度会达到零度以下，蒸发器的表面可能会结霜，
            厚霜层会导致空气流动受阻，影响空调器的温度调节能力，所以都在空调器上设有化霜电路，
            当霜冻累计到一定程度或者到达设定的时间时，集装箱会进行化霜。具体表现为温度大幅度升高，且至少会持续一个小时以上。
          </p>
          <p>
            集装箱的化霜程序启动是为了升高温度解除霜冻，这是正常现象不用担心，只是看起来很像是发生了故障，
            一般表现为风扇停转，指示灯常亮，温度飙升等等。需要注意的是，在化霜的过程中需要持续制冷，
            绝对不要关停发电机，如果集装箱在化霜的过程中被关停制冷，很可能会导致集装箱发生硬件或者软件故障。
            化霜在冷藏集装箱运输过程中比较常见而且出问题较多，需要重点关注。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/media/leng-cang-ji-zhuang-xiang-content-4.jpg"
                alt="冷藏集装箱运输"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/media/leng-cang-ji-zhuang-xiang-content-5.jpg"
                alt="冷藏集装箱设备"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/media/leng-cang-ji-zhuang-xiang-content-6.jpg"
                alt="冷藏集装箱车队"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-deep transition-colors shadow-lg"
          >
            咨询冷藏集装箱运输服务
          </Link>
        </div>
      </div>
    </div>
  );
}
