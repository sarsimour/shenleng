import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import ValueProp from "@/components/sections/ValueProp";
import Trust from "@/components/sections/Trust";
import News from "@/components/sections/News";
import RealityProof from "@/components/sections/RealityProof";
import { JsonLd } from "@/components/common/JsonLd";
import { absoluteUrl, serviceKeywords, shenlengCompany } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: shenlengCompany.legalName,
        alternateName: [shenlengCompany.brandName, shenlengCompany.englishName],
        url: absoluteUrl("/"),
        logo: absoluteUrl("/images/gong-si-jian-jie-content-3.JPG"),
        description: shenlengCompany.description,
        keywords: serviceKeywords.join(", "),
        contactPoint: {
          "@type": "ContactPoint",
          telephone: shenlengCompany.phoneNumbers[0],
          contactType: "customer service",
          areaServed: "CN",
          availableLanguage: "Chinese",
        },
        address: {
          "@type": "PostalAddress",
          ...shenlengCompany.address,
        },
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: `${shenlengCompany.brandName}官网`,
        url: absoluteUrl("/"),
        publisher: {
          "@id": absoluteUrl("/#organization"),
        },
        inLanguage: "zh-CN",
      },
      {
        "@type": "Service",
        "@id": absoluteUrl("/services/container#service"),
        name: "上海港冷链车队与冷藏集装箱运输服务",
        serviceType: "冷藏集装箱进出口公路运输",
        provider: {
          "@id": absoluteUrl("/#organization"),
        },
        areaServed: shenlengCompany.areaServed,
        url: absoluteUrl("/services/container"),
        keywords: serviceKeywords.join(", "),
        description:
          "面向货代、外贸工厂和冷链客户，提供上海港冷链车队、冷箱全程制冷运输、冷箱温度异常处理和冷箱暂落箱服务。",
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <Hero />
      <Services />
      <RealityProof />
      <ValueProp />
      <News />
      <Trust />
    </>
  );
}
