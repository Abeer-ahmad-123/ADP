import JsonLd from "@/components/JsonLd";
import {
  GalleryArchive,
  PublicArchivePage,
} from "@/components/PublicArchivePage";
import { getPublicGalleryPhotos } from "@/lib/contentRepository";
import {
  absoluteUrl,
  createPageMetadata,
  createWebPageJsonLd,
  getSeoRoute,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = getSeoRoute("/gallery");

export const metadata = createPageMetadata(route);

export default async function GalleryPage() {
  const photos = await getPublicGalleryPhotos();

  return (
    <>
      <JsonLd
        data={[
          createWebPageJsonLd(route),
          {
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            image: photos.map((photo) => ({
              "@type": "ImageObject",
              caption: photo.summary,
              contentUrl: absoluteUrl(photo.imageUrl),
              name: photo.title,
            })),
            name: "Awam Dost Party photo gallery",
            url: absoluteUrl(route.path),
          },
        ]}
      />
      <PublicArchivePage
        copy="Photos from public meetings, organizing work, district teams, and party activities."
        eyebrow="Photo gallery"
        heroKind="gallery"
        title="Party photo gallery."
      >
        <GalleryArchive photos={photos} />
      </PublicArchivePage>
    </>
  );
}
