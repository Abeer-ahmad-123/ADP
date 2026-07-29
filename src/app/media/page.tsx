import JsonLd from "@/components/JsonLd";
import {
  MediaArchive,
  PublicArchivePage,
} from "@/components/PublicArchivePage";
import { getPublicMediaItems } from "@/lib/contentRepository";
import {
  absoluteUrl,
  createPageMetadata,
  createWebPageJsonLd,
  getSeoRoute,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = getSeoRoute("/media");

export const metadata = createPageMetadata(route);

export default async function MediaPage() {
  const items = await getPublicMediaItems();

  return (
    <>
      <JsonLd
        data={[
          createWebPageJsonLd(route),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: items.map((item, index) => ({
              "@type": "ListItem",
              item: {
                "@type": item.kind === "Audio" ? "AudioObject" : "VideoObject",
                description: item.summary,
                name: item.title,
                ...(item.mediaUrl ? { contentUrl: absoluteUrl(item.mediaUrl) } : {}),
                ...(item.thumbnailUrl
                  ? { thumbnailUrl: absoluteUrl(item.thumbnailUrl) }
                  : {}),
              },
              position: index + 1,
            })),
            name: "Awam Dost Party media library",
          },
        ]}
      />
      <PublicArchivePage
        copy="Audio and video reels for citizens, volunteers, and district teams."
        eyebrow="Media library"
        heroKind="media"
        title="Audio and video reels."
      >
        <MediaArchive items={items} />
      </PublicArchivePage>
    </>
  );
}
