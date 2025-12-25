import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Share2, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Mock data function
async function getArticleData(slug: string) {
  return {
    title: "如何解决港口冷藏箱暂落与插电的成本与安全平衡？",
    date: "2025-12-20",
    readTime: "5 min read",
    category: "行业洞察",
    content: `<p>内容加载中...</p>`,
    summary: "摘要加载中..."
  };
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleData(slug);
  return {
    title: `${article.title} - 申冷物流行业洞察`,
    description: article.summary,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleData(slug);

  return (
    <article className="min-h-screen bg-white pb-24">
      <div className="bg-slate-50 border-b">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Link href="/#news" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-deep mb-8 transition-colors">
            <ArrowLeft size={16} />
            返回动态列表
          </Link>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
            {article.title}
          </h1>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-12">
        <div className="prose prose-lg prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
    </article>
  );
}
