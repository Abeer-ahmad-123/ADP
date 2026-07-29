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

const route = getSeoRoute("/blogs");

export const metadata = createPageMetadata(route);

export default async function BlogsPage() {
  const items = await getPublicContentItems("blog");

  return (
    <>
      <JsonLd
        data={[
          createWebPageJsonLd(route),
          createArchiveItemListJsonLd({
            items,
            name: "Awam Dost Party blogs",
            path: route.path,
          }),
        ]}
      />
      <PublicArchivePage
        copy="Policy essays, organizing notes, and explainers for citizens and members."
        eyebrow="Blogs"
        heroKind="blogs"
        title="Ideas, notes, and public essays."
      >
        <PublicItemGrid emptyLabel="No blogs have been published yet." items={items} />
      </PublicArchivePage>
    </>
  );
}
