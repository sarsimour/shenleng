import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "内装仓储 - 申冷物流",
  description: "申冷物流提供专业的冷藏集装箱内装仓储服务，包括出口内装、进口内装、短时仓储和返程带货。",
};

export default function WarehousePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <nav className="text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-brand-primary">首页</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900">内装仓储</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            内装仓储
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            节省成本、优化供应链、提高运输效率的专业内装服务
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 pb-24">
        <div className="prose prose-lg prose-slate max-w-none">
          <p>
            <strong>内装主要是为了节省成本、优化供应链、提高运输效率等方面的考量所设计出的一种折中的进出口运输方案。</strong>
          </p>

          <h2>出口内装</h2>
          <p>
            出口货物通过普通货车从外地运往港口城市，再由集装箱车队从堆场提出空集装箱，把出口货物拣选后装入集装箱加封，
            然后进港落箱，这种运输方式俗称为内装。
          </p>
          <p>
            申冷的自有场地在外高桥四、五、六期港口3KM距离的范围内，对于内装作业而言非常便利，提箱和进港距离很短，
            内装业务的作业时间会低于平均水平。我们有专做内装业务的车辆，并且门点运输车辆在空闲时也能对内装业务提供运力，
            这样我们的内装运力既有刚性又有弹性，抗波动能力强，可以满足客户的多种需求。
          </p>
          <p>
            申冷自有场地内有冷藏集装箱专用的380V工业电插头，可以供集装箱制冷，再加上我们的运力规模和挂板优势，
            让我们能为客户提供专业、快速、规模、全面的冷箱内装服务。
          </p>

          <h2>进口内装</h2>
          <p>
            以往内装多意味着出口内装作业，但是随着进口业务的发展，进口内装也开始快速发展，
            总体来说就是出口内装的反向作业，从堆场提出进口重箱之后，进行拆箱分装作业，把货物装到普通货车上发往内陆城市。
            进口业务在申冷的业务构成中占比也越来越高，我们对于冷箱进口业务的全流程极其熟悉，
            因此，对于有进口内装业务需求的客户，我们也能提供不逊色于出口内装服务的专业水平。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/images/nei-zhuang-cang-chu-content-1.jpg"
                alt="内装仓储作业"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/images/nei-zhuang-cang-chu-content-2.jpg"
                alt="内装仓储设施"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>

          <p>
            <strong>我们也正在积极尝试建立起完整的内装服务供应链，如组建冷藏厢货车车队用来负责内装冷藏货物的内陆运输。</strong>
          </p>

          <h2>短时/中转仓储服务</h2>
          <p>
            我们的仓库不是传统冷库，而是冷藏集装箱，主要是为内装客户提供货物短时间的中转仓储，
            以及其他客户偶尔的短期货物存放需求。冷箱用来作为冷库使用比较方便、灵活，
            同时冷箱的密封性、遮光性以及制冷效率也都不逊色于同等容积的传统冷库，甚至有过之而无不及。
            申冷用做临时冷库的都是海运冷箱，可以根据客户需求提供20英尺和40英尺的大小箱型。
          </p>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg my-8">
            <Image
              src="/images/nei-zhuang-cang-chu-content-3.jpg"
              alt="冷藏集装箱仓储"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <h2>返程带货</h2>
          <p>
            集装箱运输业务的特点就是出口运输的去程空驶、进口运输的返程空驶，空驶对于运力本身是极大的浪费，
            再加上现在的运价低迷、市场充斥着恶性价格竞争，因此为了提高运输效率、降低成本、优化运输模型，
            我们正在积极尝试返程带货的新业务。
          </p>
          <p>
            即出口业务的去程从上海往门点城市或路过城市带货、进口业务的返程从目的地城市往上海或者顺路城市带货，
            如果您有仓库/冷库/工厂等的点对点货源、快递货源、专线/零担运输货源以及临时性的货物运输需求等都可以和我们联系。
          </p>
          <p>
            目前我们的门点主要集中在江浙沪的主要城市，返程带货的货物种类不限于冷藏货物也可以是普通货物、快件等
            （我们的优势在于既可以运输冷藏货物也可以运输普通货物），但是对于货物拆装的时效性要求较高，
            如果您有相关需求或者对这种合作模式感兴趣，欢迎来电沟通。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/images/nei-zhuang-cang-chu-content-4.JPG"
                alt="内装作业现场"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/images/nei-zhuang-cang-chu-content-5.jpg"
                alt="冷藏运输车队"
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
            咨询内装仓储服务
          </Link>
        </div>
      </div>
    </div>
  );
}
