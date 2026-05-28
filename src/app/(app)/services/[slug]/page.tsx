import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/common/JsonLd";
import { absoluteUrl, shenlengCompany } from "@/lib/site";
import { getServiceLandingPage, serviceLandingPages } from "@/lib/service-pages";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return serviceLandingPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getServiceLandingPage(slug);
  if (!page) return {};

  return {
    title: `${page.title} - 申冷物流`,
    description: page.metaDescription,
    keywords: page.keywords.join(", "),
    alternates: {
      canonical: page.path,
    },
  };
}

export default async function ServiceLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getServiceLandingPage(slug);
  if (!page) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": absoluteUrl(`${page.path}#service`),
        name: page.title,
        serviceType: page.primaryKeyword,
        provider: {
          "@type": "Organization",
          name: shenlengCompany.legalName,
          url: absoluteUrl("/"),
        },
        areaServed: shenlengCompany.areaServed,
        url: absoluteUrl(page.path),
        keywords: page.keywords.join(", "),
        description: page.summary,
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl(`${page.path}#faq`),
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <div className="min-h-screen bg-white">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-18">
            <div>
              <nav className="mb-5 text-sm text-slate-500">
                <Link href="/" className="hover:text-brand-primary">
                  首页
                </Link>
                <span className="mx-2">/</span>
                <Link href="/services/container" className="hover:text-brand-primary">
                  冷藏集装箱运输
                </Link>
                <span className="mx-2">/</span>
                <span className="text-slate-900">{page.shortTitle}</span>
              </nav>
              <p className="mb-3 text-sm font-semibold text-brand-primary">{page.primaryKeyword}</p>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950 md:text-5xl">
                {page.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 md:text-lg">
                {page.summary}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white hover:bg-brand-deep"
                  data-analytics-event="cta_click"
                  data-analytics-target="service_landing_contact"
                  data-analytics-label={page.title}
                >
                  联系申冷确认报价
                </Link>
                <a
                  href="tel:021-38930219"
                  className="inline-flex rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 hover:border-brand-primary hover:text-brand-primary"
                  data-analytics-target="service_landing_phone"
                  data-analytics-label="021-38930219"
                >
                  021-38930219
                </a>
              </div>
            </div>
            <div className="relative min-h-[260px] overflow-hidden rounded-lg bg-slate-200 shadow-sm">
              <Image
                src="/images/jin-chu-kou-yun-shu-content-1.JPG"
                alt={`${page.title}服务现场`}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">适用需求</h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                {page.suitableFor.map((item) => (
                  <li key={item} className="border-l-2 border-brand-primary pl-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">服务流程</h2>
              <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                {page.process.map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">报价前请准备</h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                {page.quoteFields.map((item) => (
                  <li key={item} className="border-l-2 border-slate-300 pl-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
            <h2 className="text-2xl font-semibold text-slate-950">申冷公开车队事实</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {shenlengCompany.fleetFacts.map((fact) => (
                <div key={fact} className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800">
                  {fact}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-950">常见问题</h2>
          <div className="mt-6 divide-y divide-slate-200">
            {page.faq.map((item) => (
              <div key={item.question} className="py-5">
                <h3 className="text-base font-semibold text-slate-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.answer}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-lg bg-slate-900 p-6 text-white">
            <h2 className="text-xl font-semibold">需要确认能否承接或报价</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              请提供货物、温度、路线、箱型箱量和时间窗口。官网 AI 售前可以先收集需求，复杂线路或特殊操作会转人工确认。
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              data-analytics-event="cta_click"
              data-analytics-target="service_landing_bottom_contact"
              data-analytics-label={page.title}
            >
              查看联系方式
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
