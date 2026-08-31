import JsonLd from "@/components/JsonLd";
import PartyLanding from "@/components/PartyLanding";
import {
  createPageMetadata,
  createWebPageJsonLd,
  getSeoRoute,
} from "@/lib/seo";
import { getHeroFlagImageSrc } from "@/lib/siteSettings";

const route = getSeoRoute("/");

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata(route);

export default async function Home() {
  const heroFlagImageSrc = await getHeroFlagImageSrc();

  return (
    <>
      <JsonLd data={createWebPageJsonLd(route)} />
      <PartyLanding heroFlagImageSrc={heroFlagImageSrc} />
    </>
  );
}
