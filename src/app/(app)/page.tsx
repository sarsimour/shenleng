import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import ValueProp from "@/components/sections/ValueProp";
import Trust from "@/components/sections/Trust";
import News from "@/components/sections/News";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <ValueProp />
      <News />
      <Trust />
    </>
  );
}
