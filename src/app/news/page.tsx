import JsonLd from "@/components/JsonLd";
import {
  PublicArchivePage,
  PublicItemGrid,
} from "@/components/PublicArchivePage";
import { getPublicContentItems } from "@/lib/contentRepository";
import {
  createArchiveItemListJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
  getSeoRoute,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = getSeoRoute("/news");

export const metadata = createPageMetadata(route);

export default async function NewsPage() {
  const items = await getPublicContentItems("news");

  return (
    <>
      <JsonLd
        data={[
          createWebPageJsonLd(route),
          createArchiveItemListJsonLd({
            items,
            name: "Awam Dost Party news",
            path: route.path,
          }),
        ]}
      />
      <PublicArchivePage
        copy="Public updates about organizing, membership, manifesto access, and party work."
        eyebrow="News"
        heroKind="news"
        title="Latest party news."
      >
        <PublicItemGrid emptyLabel="No news has been published yet." items={items} />
      </PublicArchivePage>
    </>
  );
}
