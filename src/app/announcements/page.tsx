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

const route = getSeoRoute("/announcements");

export const metadata = createPageMetadata(route);

export default async function AnnouncementsPage() {
  const items = await getPublicContentItems("announcement");

  return (
    <>
      <JsonLd
        data={[
          createWebPageJsonLd(route),
          createArchiveItemListJsonLd({
            items,
            name: "Awam Dost Party announcements",
            path: route.path,
          }),
        ]}
      />
      <PublicArchivePage
        copy="Official notices, schedules, public updates, and chairman announcements."
        eyebrow="Announcements"
        heroKind="announcements"
        title="Official party announcements."
      >
        <PublicItemGrid
          emptyLabel="No announcements have been published yet."
          items={items}
        />
      </PublicArchivePage>
    </>
  );
}
