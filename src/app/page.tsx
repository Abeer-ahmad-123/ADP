import JsonLd from "@/components/JsonLd";
import PartyLanding from "@/components/PartyLanding";
import {
  createPageMetadata,
  createWebPageJsonLd,
  getSeoRoute,
} from "@/lib/seo";

const route = getSeoRoute("/");

export const metadata = createPageMetadata(route);

export default function Home() {
  return (
    <>
      <JsonLd data={createWebPageJsonLd(route)} />
      <PartyLanding />
    </>
  );
}
