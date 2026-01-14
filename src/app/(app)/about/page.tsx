import React from "react";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "关于我们 - 申冷物流",
  description: "上海申冷国际物流有限公司是一家专门从事冷藏集装箱运输的企业，采用全自营的经营模式。",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            关于申冷物流
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            专注港口冷藏集装箱运输近20年，以全自营模式提供安全、准时、全程制冷的优质服务
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 pb-24">
        <div className="prose prose-lg prose-slate max-w-none">
          <p>
            <strong>上海申冷国际物流有限公司</strong>是一家专门从事<strong>冷藏集装箱运输</strong>的企业，
            目前我们的主营业务是<strong>港口冷藏集装箱进出口公路运输</strong>，采用了<strong>全自营</strong>的经营模式，
            所有车辆、车板、发电机均为车队自有自营，目前拥有冷箱拖车<strong>21</strong>部，
            其中六桥车两辆（未来两年将着重发展六桥车），云监控进口冷机<strong>10</strong>部，
            挂板<strong>26</strong>块，并且我们的规模仍在以年<strong>40%</strong>的速度发展，
            在运力规模和专业程度方面在上海港首屈一指，可以为客户提供优质、稳定、高可控的冷箱运输服务。
          </p>

          <p>
            申冷物流浸淫港口冷运将近<strong>20</strong>年，拥有深厚的专业知识、广泛的行业人脉和丰富的运输经验，
            不仅能够为客户提供专业优质的冷箱运输服务，还能独立解决很多冷箱运输过程中的衍生问题，
            如温度调节、化霜时间调节、冷箱紧急维修、堆场换箱、难制冷冷冻箱进港等，让客户更加省心托付。
          </p>

          <h2>我们的服务承诺</h2>
          <p>
            申冷物流的slogan是<strong>安全、准时、全程制冷</strong>，我们一直围绕着这三方面进行企业建设，
            在制度层面设计了较为完善的奖惩条例，从根本上规范驾驶员的作业行为。
          </p>

          <ul>
            <li>
              <strong>安全</strong>：奖励安全驾驶的优秀员工，严格处罚危险作业行为，加装相关辅助硬件设施，
              如行车影像、防护栏、反光衣、合理安排作业计划，保证驾驶员有充分的休息时间等。
            </li>
            <li>
              <strong>准时</strong>：我们将其作为主要的服务指标来抓，与驾驶员的绩效收入直接挂钩，
              同时对驾驶员进行培训，让其真正意识到准时到达指定位置的重要性，所以我们的准时率很高，
              在99%以上，除非是特殊情况，如节假日集中出货、严重拥堵等不可抗力的情况下，
              均能做到准时提箱、准时到厂、准时进港。
            </li>
            <li>
              <strong>制冷</strong>：更是我们的强项，配备进口冷机。申冷是出口冷运出身，
              我们的冷机可以满足客户全程制冷和高要求制冷的需求，对于-18℃及以下温度要求的冷箱均能进行运输过程中的全程制冷，
              另外我们现在新购置的10部进口云监控冷机，还能够实时查看到制冷状况和冷机运行实况，
              让港口冷运变得可视化，让制冷环节无忧。
            </li>
          </ul>

          <h2>发展愿景</h2>
          <p>
            <strong>申冷物流的下一目标是成长为全国性的冷藏集装箱运输企业</strong>，逐步扩大规模，
            同时高度聚焦在冷藏集装箱的运输以及有限的衍生服务上，未来申冷的业务版图将分为以下几大部分：
          </p>
          <ul>
            <li>港口冷箱进出口公路运输</li>
            <li>冷箱内装仓储</li>
            <li>冷箱多式联运</li>
            <li>冷链城配与集货</li>
            <li>冷货干线运输</li>
          </ul>

          <p>
            目前申冷已经取得上海铁路冷藏集装箱的作业资质，能够为客户提供上海至全国主要城市的冷箱公铁联运服务。
            申冷将持续专注冷运，打造出冷运品牌车队、超级车队，成为冷箱运输领域的NO.1。
          </p>

          <h2>信息化建设</h2>
          <p>
            未来申冷在专注冷运的同时，将积极投入资源到<strong>信息化</strong>建设上，
            用信息化的手段提高客户满意度、提高工作效率、提高服务质量、降低物流成本，
            让客户平价享受优质的冷运服务，目前企业的信息化系统，新观见系统和逍遥系统正在积极研发中。
            信息化、科技化、智能化，将是申冷未来10年的发展主题。
          </p>

          <p>
            申冷物流将持续贯彻以客户为中心、以品质求生存的核心理念，追求与客户共同成长，
            努力营造与客户之间良好的合作关系，让客户安心、省心、放心托付。
          </p>

          <p className="text-center text-xl font-bold text-brand-deep mt-12">
            安全、准时、全程制冷、信息化 — 申冷物流
          </p>
        </div>

        {/* Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
            <Image
              src="/media/gong-si-jian-jie-content-1.jpg"
              alt="申冷物流车队"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
            <Image
              src="/media/gong-si-jian-jie-content-2.jpg"
              alt="申冷物流设备"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
