import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { getPayload } from "payload";
import config from "@/payload.config";

export const metadata = {
  title: "行业洞察与公司动态 - 申冷物流",
  description: "申冷物流发布的最新行业分析、冷链知识与公司新闻。",
};

export default async function ArticlesIndex() {
  const payload = await getPayload({ config });
  
  const result = await payload.find({
    collection: "articles",
    sort: "-publishedAt",
    limit: 50,
    depth: 1, // 确保获取 Media 对象的完整数据
  });

  const articles = result.docs;

  return (
    <div className="min-h-screen bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            行业洞察与动态
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            分享冷链物流的一线经验与思考
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article: any) => {
            const dateStr = article.publishedAt 
              ? new Date(article.publishedAt).toLocaleDateString('zh-CN') 
              : "";
            
            const coverImageUrl = article.coverImage?.filename 
              ? `/media/${article.coverImage.filename}` 
              : null;

            return (
              <article key={article.id} className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <Link href={`/articles/${article.slug}`} className="flex flex-col h-full">
                  <div className="aspect-[16/9] w-full bg-slate-200 relative overflow-hidden">
                    {coverImageUrl ? (
                      <Image
                        src={coverImageUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 italic">
                        无封面图
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {dateStr}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {article.baseViews || 0} 阅读
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-brand-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                      {article.summary}
                    </p>
                    
                    <div className="flex items-center text-brand-deep text-sm font-bold group-hover:gap-2 transition-all">
                      阅读全文 <ArrowRight size={16} className="ml-1" />
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
