import React from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

const mockArticles = [
  {
    title: "如何解决港口冷藏箱暂落与插电的成本与安全平衡？",
    summary: "在船期不稳定的当下，货代和货主常面临冷藏箱在港口堆场的积压问题。申冷物流通过自营堆场与24小时监控，提供了一套高效的解决方案...",
    date: "2025-12-20",
    readTime: "5 min read",
    slug: "solve-port-cold-chain-costs",
    category: "行业洞察"
  },
  {
    title: "高价值医药冷链：为什么“过程可验证”比“结果不坏”更重要？",
    summary: "对于医药行业而言，温度偏差可能导致整批货物报废。我们通过数字化监控系统，将“经验冷链”升级为“数据冷链”，实现全程透明...",
    date: "2025-12-15",
    readTime: "8 min read",
    slug: "pharma-cold-chain-data",
    category: "专业深度"
  },
  {
    title: "申冷物流：上海港首批进口备案冷运车队的服务标准",
    summary: "作为行业领先的冷运服务商，申冷物流始终坚持“责任不外包”。本文将带您了解我们从提箱到进港的12项标准操作流程...",
    date: "2025-12-10",
    readTime: "4 min read",
    slug: "shenleng-service-standards",
    category: "公司动态"
  }
];

export default function News() {
  return (
    <section id="news" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold leading-7 text-brand-primary">行业洞察 & 公司动态</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              传递市场信息，共享冷链专业经验
            </p>
          </div>
          <Link href="/articles">
            <Button variant="outline" className="rounded-full group">
              查看全部文章
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mockArticles.map((article) => (
            <article key={article.slug} className="flex flex-col group cursor-pointer">
              <Link href={`/articles/${article.slug}`} className="flex flex-col h-full">
                <div className="aspect-[16/9] w-full bg-slate-100 rounded-2xl mb-6 overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-brand-deep text-xs font-bold rounded-full border border-brand-deep/10">
                      {article.category}
                    </span>
                  </div>
                  {/* Placeholder for Image */}
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <span className="text-slate-300 font-medium italic text-sm">文章封面图占位</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {article.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {article.readTime}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-primary transition-colors leading-snug">
                  {article.title}
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                  {article.summary}
                </p>
                
                <div className="flex items-center text-brand-deep text-sm font-bold group-hover:gap-2 transition-all">
                  阅读更多 <ArrowRight size={16} className="ml-1" />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
