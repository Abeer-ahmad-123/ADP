import type { Metadata } from "next";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminHeroImageForm from "@/app/admin/_components/AdminHeroImageForm";
import { PARTY_NAME } from "@/data/partyContent";
import {
  type AdminSearchParams,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";
import {
  getHeroFlagCaption,
  getHeroFlagImageSrc,
} from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Homepage",
};

export default async function AdminHomepagePage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const [heroFlagCaption, heroFlagImageSrc] = await Promise.all([
    getHeroFlagCaption(),
    getHeroFlagImageSrc(),
  ]);

  return (
    <AdminChrome
      description={`Manage the ${PARTY_NAME} homepage hero display.`}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Homepage"
    >
      <AdminHeroImageForm
        heroFlagCaption={heroFlagCaption}
        heroFlagImageSrc={heroFlagImageSrc}
      />
    </AdminChrome>
  );
}
