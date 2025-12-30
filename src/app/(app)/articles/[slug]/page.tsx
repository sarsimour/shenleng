import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Share2, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPayload } from "payload";
import config from "@/payload.config";

async function getArticleData(slug: string) {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "articles",
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  });

  return result.docs[0] || null;
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleData(slug);
  
  if (!article) return { title: "文章未找到" };

  return {
    title: `${article.title} - 申冷物流`,
    description: article.summary,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleData(slug) as any;

  if (!article) {
    notFound();
  }

  const dateStr = article.publishedAt 
    ? new Date(article.publishedAt).toLocaleDateString('zh-CN') 
    : "";

  return (
    <article className="min-h-screen bg-white pb-24">
      {/* Article Header */}
      <div className="bg-slate-50 border-b">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Link href="/#news" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-deep mb-8 transition-colors">
            <ArrowLeft size={16} />
            返回动态列表
          </Link>
          
          <div className="flex items-center gap-3 mb-4 text-xs text-slate-400 font-medium">
            <Calendar size={14} />
            {dateStr}
            <span className="mx-1">•</span>
            <span>{article.baseViews || 0} 次阅读</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
            {article.title}
          </h1>
        </div>
      </div>

      {/* Article Body */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-12 flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
          {article.isLegacy ? (
            // 渲染旧版 HTML
            <div 
              className="legacy-article-content prose prose-lg prose-slate max-w-none 
                prose-img:rounded-2xl prose-img:shadow-lg prose-table:border prose-table:border-slate-200"
              dangerouslySetInnerHTML={{ __html: article.legacyHtml }} 
            />
          ) : (
            // 这里以后对接 Lexical 渲染器
            <div className="prose prose-lg prose-slate max-w-none">
              <p>新文章 RichText 渲染待接入...</p>
            </div>
          )}
          
          <div className="mt-16 pt-8 border-t flex flex-wrap justify-between items-center gap-4 text-sm text-slate-400">
            <div>*本文由申冷物流专业团队发布</div>
            <div className="flex gap-4">
               <button className="flex items-center gap-2 hover:text-brand-deep transition-colors">
                 <Share2 size={16} /> 分享
               </button>
            </div>
          </div>
        </div>

        {/* Sidebar CTA */}
        <div className="lg:w-1/3">
          <div className="sticky top-24 bg-brand-deep rounded-2xl p-8 text-white shadow-xl shadow-brand-deep/20">
            <h3 className="text-xl font-bold mb-4">需要专业的冷链物流建议？</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              我们的专家团队随时准备为您解决复杂的冷链挑战，提供定制化的运输与保障方案。
            </p>
            <div className="space-y-4">
              <a href="tel:123456789" className="flex items-center justify-center gap-2 w-full bg-white text-brand-deep font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors">
                <Phone size={18} />
                立即拨打电话
              </a>
              <Button variant="secondary" className="w-full py-6 rounded-xl text-base">
                获取专业解决方案
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}