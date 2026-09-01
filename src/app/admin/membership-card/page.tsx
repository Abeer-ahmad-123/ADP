import type { Metadata } from "next";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminMembershipCardImageForm from "@/app/admin/_components/AdminMembershipCardImageForm";
import { PARTY_NAME } from "@/data/partyContent";
import {
  type AdminSearchParams,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";
import { getMembershipCardImageSrc } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membership Card",
};

export default async function AdminMembershipCardPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const membershipCardImageSrc = await getMembershipCardImageSrc();

  return (
    <AdminChrome
      description={`Manage the ${PARTY_NAME} membership card image shown on generated cards.`}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Membership card"
    >
      <AdminMembershipCardImageForm
        membershipCardImageSrc={membershipCardImageSrc}
      />
    </AdminChrome>
  );
}
