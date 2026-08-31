import JsonLd from "@/components/JsonLd";
import PartyLanding from "@/components/PartyLanding";
import {
  createPageMetadata,
  createWebPageJsonLd,
  getSeoRoute,
} from "@/lib/seo";
import {
  getHeroFlagCaption,
  getHeroFlagImageSrc,
} from "@/lib/siteSettings";

const route = getSeoRoute("/");

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata(route);

export default async function Home() {
  const [heroFlagCaption, heroFlagImageSrc] = await Promise.all([
    getHeroFlagCaption(),
    getHeroFlagImageSrc(),
  ]);

  return (
    <>
      <JsonLd data={createWebPageJsonLd(route)} />
      <PartyLanding
        heroFlagCaption={heroFlagCaption}
        heroFlagImageSrc={heroFlagImageSrc}
      />
    </>
  );
}
