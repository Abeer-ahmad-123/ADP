import JsonLd from "@/components/JsonLd";
import {
  LeadershipArchive,
  PublicArchivePage,
} from "@/components/PublicArchivePage";
import { getPublicLeadershipProfiles } from "@/lib/contentRepository";
import {
  createPageMetadata,
  createWebPageJsonLd,
  getSeoRoute,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = getSeoRoute("/leadership");

export const metadata = createPageMetadata(route);

export default async function LeadershipPage() {
  const profiles = await getPublicLeadershipProfiles();

  return (
    <>
      <JsonLd
        data={[
          createWebPageJsonLd(route),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: profiles.map((profile, index) => ({
              "@type": "ListItem",
              item: {
                "@type": "Person",
                description: profile.summary,
                jobTitle: profile.role,
                name: profile.name,
              },
              position: index + 1,
            })),
            name: "Awam Dost Party leadership profiles",
          },
        ]}
      />
      <PublicArchivePage
        copy="Public roles, responsibilities, announcements, and local organizing leadership."
        eyebrow="Leadership"
        heroKind="leadership"
        title="Leadership profiles."
      >
        <LeadershipArchive profiles={profiles} />
      </PublicArchivePage>
    </>
  );
}
