import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import ValueProp from "@/components/sections/ValueProp";
import Trust from "@/components/sections/Trust";
import News from "@/components/sections/News";
import { JsonLd } from "@/components/common/JsonLd";

export default function Home() {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "上海申冷国际物流有限公司",
    "alternateName": "申冷物流",
    "url": "https://www.sl-cold.com",
    "logo": "https://www.sl-cold.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "021-38930219",
      "contactType": "customer service",
      "areaServed": "CN",
      "availableLanguage": "Chinese"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "华洲路94号",
      "addressLocality": "上海市",
      "addressRegion": "浦东新区",
      "postalCode": "200000",
      "addressCountry": "CN"
    },
    "description": "专业的港口冷藏集装箱运输服务商，提供安全、准时、全程制冷的冷链物流解决方案。"
  };

  return (
    <>
      <JsonLd data={organizationData} />
      <Hero />
      <Services />
      <ValueProp />
      <News />
      <Trust />
    </>
  );
}
