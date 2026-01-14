import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "企业建设 - 申冷物流",
  description: "申冷物流企业建设规划，包括人事管理、企业文化、制度建设和信息化建设。",
};

export default function DevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <nav className="text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-brand-primary">首页</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900">企业建设</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            企业建设
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            以客户为中心、以品质求生存，打造高品质冷运车队
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 pb-24">
        <div className="prose prose-lg prose-slate max-w-none">
          <h2>行业现状</h2>
          <p>
            现阶段而言，专业的冷藏集装箱车队很少，行业内的车队良莠不齐，处于一种比较原始的状态，
            同时行业还没有一个规范的管理体系和监督制度，运输服务的质量具有较大的任意性，客户的权益有时得不到保障。
          </p>
          <p>
            申冷没有改变行业的能力，但我们可以改变自己。我们决定通过努力完善车队自身的运输品质、
            全程监督车辆运输过程、对驾驶员进行定期培训、制定与实际业务相契合的运输规范和奖惩条例来提高申冷的服务质量，
            提高我们的服务稳定性。
          </p>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg my-8">
            <Image
              src="/images/qi-ye-jian-she-content-1.jpg"
              alt="企业建设"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <h2>服务优势</h2>
          
          <h3>1. 安全</h3>
          <p>
            申冷物流极其重视运输安全、货物安全以及人员安全，为此制定了完善的安全管理制度，
            将安全作为驾驶员考核的第一指标，安全方面表现差的驾驶员坚决予以辞退。
            此外在业务实践中，奖励安全驾驶的优秀员工，严格处罚危险作业行为，加装相关辅助硬件设施，
            如行车影像、防护栏、反光衣等；合理安排作业计划保证驾驶员有充分的休息时间等。
          </p>

          <h3>2. 准时</h3>
          <p>
            个人的守时是一种素养，企业的准时则是一种操守，准时到达指定位置是申冷的使命。
            准时提箱、准时到厂/到仓、准时进港/还箱，是我们的自我要求。2019年我们的全年准时率为99.1%，
            除了不可抗力的情况下（道路、堆场和港区严重拥堵、集中出货、突发故障、节假日驾驶员集体返乡等），
            申冷皆能做到准时。准时是申冷的金字招牌。
          </p>

          <h3>3. 制冷</h3>
          <p>
            制冷是冷箱运输的本质要求，关乎冷运车队的职业道德和良心。申冷一直坚持报价保持合理的利润空间，
            留有制冷的预算，所以不会因为运费低而不制冷。
          </p>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg my-8">
            <Image
              src="/images/qi-ye-jian-she-content-2.jpg"
              alt="制冷设备"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <p>
            我们通过制冷制度设计，把制冷油耗和驾驶员收入剥离开来，由车队承担制冷费用，
            避免了驾驶员因为私欲而干扰制冷质量。为了提高制冷效率、透明度以及降低冷机的故障率，
            我们从2020年以后不再采购旧式冷机，全部采购新型带有云监控系统的进口冷机，
            让进出口冷运在申冷进入了可视化时代。申冷自成立以来的0坏箱，就是申冷制冷质量过硬的证明。
          </p>

          <h3>4. 完整的进出口冷运服务供应链</h3>
          <p>
            我们目前可以为客户提供冷藏集装箱的进出口公路运输、公铁联运、内装仓储及返程带货服务，
            从而可以为客户的多样化需求提供完善的解决方案，省心、省事又省钱。
          </p>

          <h3>5. 以客户为中心、以品质求生存的服务价值观</h3>
          <p>
            申冷的价值观是以客户为中心、以品质求生存！我们认为没有正确的价值观就没有正确的发展方向。
            申冷的所有行为都出自于核心价值观的驱使，我们的核心竞争力也来自于我们价值观的推动。
          </p>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg my-8">
            <Image
              src="/images/qi-ye-jian-she-content-3.jpg"
              alt="企业文化"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <h2>企业建设规划</h2>

          <h3>Part 1. 人事管理</h3>
          <p>
            <strong>驾驶员</strong>是运输中最重要的部分之一，我们将会加大驾驶员的培训力度，培养驾驶员的职业技能和职业道德。
            我们给予驾驶员的薪资待遇和相应福利属于行业的领先水平，目的就是为了用高薪换高效，高薪换放心。
          </p>
          <p>
            <strong>调度员和操作</strong>负责接受客户委托和车辆的调派指挥，我们公司的调度和操作人员有着丰富的从业经验，
            均超过5年的行业经验，能够胜任车辆的指挥调派，最高效的发挥车辆运力。
          </p>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg my-8">
            <Image
              src="/images/qi-ye-jian-she-content-4.JPG"
              alt="团队建设"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <h3>Part 2. 企业文化宣贯</h3>
          <p>
            除了具体的、详细的、可以执行的奖惩制度与规范性文件之外，想要提高服务品质还要依靠企业文化、价值观的潜移默化的影响。
            我们的企业文化是脚踏实地、真诚、朴实，我们的价值观就是以客户为中心、以品质求生存。
          </p>

          <h3>Part 3. 制度建设</h3>
          <p>
            优秀的公司需要良好的制度，因此，我们会不断改革公司内部的管理模式和规章制度，
            建立起一个良好的公司运营体系，最大程度发挥员工的工作积极性，提高劳动效率和服务品质。
          </p>

          <h3>Part 4. 信息化建设</h3>
          <p>
            信息化、科技化、智能化是物流行业的未来，5G、人工智能、物联网是实现这些概念的工具。
            申冷要赢在未来，所以我们会在不断扩大规模、提高服务品质的同时，往信息化、智能化建设上不断投入资源，
            打造出适合冷运、适合客户和申冷的信息化系统和物联网工具。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/images/qi-ye-jian-she-content-5.jpg"
                alt="信息化建设"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <Image
                src="/images/qi-ye-jian-she-content-6.jpg"
                alt="智能化设备"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>

          <p className="text-center text-xl font-bold text-brand-deep mt-12">
            申冷物流，是一个有着梦想和追求的运输公司，我们的目标是成长为冷运行业里的顺丰、华为。
          </p>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg my-8">
            <Image
              src="/images/qi-ye-jian-she-content-7.jpg"
              alt="申冷物流团队"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-deep transition-colors shadow-lg"
          >
            联系我们
          </Link>
        </div>
      </div>
    </div>
  );
}
