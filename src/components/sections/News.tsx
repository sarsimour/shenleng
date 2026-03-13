import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPayload } from "payload";
import config from "@/payload.config";

type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt?: string;
  baseViews?: number;
  coverImage?: {
    filename?: string;
  } | null;
};

export default async function News() {
  let articles: ArticleListItem[] = [];
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "articles",
      sort: "-publishedAt",
      limit: 3,
      depth: 1, // 确保获取 Media 对象的完整数据
    });
    articles = result.docs as ArticleListItem[];
  } catch (error) {
    console.warn("[home] news fallback to empty list", error);
  }

  return (
    <section id="news" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-3xl">
            <h2 className="text-base font-semibold leading-7 text-brand-primary">专业文章与实战思考</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              这是申冷的业务方法库，不是普通企业宣传稿
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">政策与趋势解读</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">冷链执行复盘</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">团队管理与SOP</span>
            </div>
          </div>
          <Link href="/articles">
            <Button variant="outline" className="rounded-full group">
              查看全部文章
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article) => {
            const dateStr = article.publishedAt 
              ? new Date(article.publishedAt).toLocaleDateString('zh-CN') 
              : "";
            
            // 使用 filename 手动拼接路径，确保与 Next.js 静态目录匹配
            const coverImageUrl = article.coverImage?.filename 
              ? `/media/${article.coverImage.filename}` 
              : null;

            return (
              <article key={article.id} className="flex flex-col group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <Link href={`/articles/${article.slug}`} className="flex flex-col h-full">
                  <div className="aspect-[16/9] w-full bg-slate-100 rounded-xl mb-5 overflow-hidden relative border border-slate-100">
                    {coverImageUrl ? (
                      <Image
                        src={coverImageUrl}
                        alt={article.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <span className="text-slate-300 font-medium italic text-sm text-center px-4">
                          {article.title}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-brand-primary" />
                      {dateStr}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-brand-primary" />
                      {article.baseViews || 0} 阅读
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-primary transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                    {article.summary}
                  </p>
                  
                  <div className="mt-auto flex items-center text-brand-deep text-sm font-bold group-hover:gap-2 transition-all">
                    阅读全文 <ArrowRight size={16} className="ml-1" />
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
