import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import {
  DEFAULT_MEMBERSHIP_CARD_IMAGE_SRC,
  getMembershipCardImageSrc,
  setMembershipCardImageSrc,
} from "@/lib/siteSettings";
import {
  deletePublicUpload,
  saveMembershipCardImageUpload,
} from "@/lib/uploadStore";

export const runtime = "nodejs";

function redirectToAdmin(request: Request, status: string) {
  const url = new URL("/admin/membership-card", request.url);
  url.searchParams.set("status", status);
  url.hash = "membership-card-image";

  return redirectAfterPost(url);
}

function isFilledFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return redirectToPathAfterPost(request, "/admin/login");
  }

  let uploadedMembershipCardImageSrc = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!isFilledFile(file)) {
      return redirectToAdmin(request, "membership-card-image-invalid");
    }

    const currentMembershipCardImageSrc = await getMembershipCardImageSrc();
    const nextMembershipCardImageSrc = await saveMembershipCardImageUpload(file);
    uploadedMembershipCardImageSrc = nextMembershipCardImageSrc;

    await setMembershipCardImageSrc(nextMembershipCardImageSrc);

    if (
      currentMembershipCardImageSrc !== DEFAULT_MEMBERSHIP_CARD_IMAGE_SRC &&
      currentMembershipCardImageSrc !== nextMembershipCardImageSrc
    ) {
      await deletePublicUpload(currentMembershipCardImageSrc);
    }

    return redirectToAdmin(request, "membership-card-image-updated");
  } catch (error) {
    if (uploadedMembershipCardImageSrc) {
      await deletePublicUpload(uploadedMembershipCardImageSrc);
    }

    console.error("Admin membership card image update failed.", error);

    return redirectToAdmin(request, "membership-card-image-error");
  }
}
