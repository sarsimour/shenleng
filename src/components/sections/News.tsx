import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPayload } from "payload";
import config from "@/payload.config";

export default async function News() {
  const payload = await getPayload({ config });
  
  const result = await payload.find({
    collection: "articles",
    sort: "-publishedAt",
    limit: 3,
  });

  const articles = result.docs;

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
          {articles.map((article: any) => {
            const dateStr = article.publishedAt 
              ? new Date(article.publishedAt).toLocaleDateString('zh-CN') 
              : "";
            
            // 获取封面图 URL
            const coverImageUrl = typeof article.coverImage === 'object' && article.coverImage 
              ? article.coverImage.url 
              : null;

            return (
              <article key={article.id} className="flex flex-col group cursor-pointer">
                <Link href={`/articles/${article.slug}`} className="flex flex-col h-full">
                  <div className="aspect-[16/9] w-full bg-slate-100 rounded-2xl mb-6 overflow-hidden relative border border-slate-100">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-brand-deep text-[10px] font-bold uppercase tracking-wider rounded-full border border-brand-deep/10 shadow-sm">
                        {article.isLegacy ? "历史存档" : "最新动态"}
                      </span>
                    </div>
                    
                    {coverImageUrl ? (
                      <Image
                        src={coverImageUrl}
                        alt={article.title}
                        fill
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
                  
                  <div className="flex items-center text-brand-deep text-sm font-bold group-hover:gap-2 transition-all">
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