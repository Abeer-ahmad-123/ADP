import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import {
  DEFAULT_HERO_IMAGE_SRC,
  getHeroImageSrc,
  setHeroImageSrc,
} from "@/lib/siteSettings";
import { deletePublicUpload, saveHeroImageUpload } from "@/lib/uploadStore";

export const runtime = "nodejs";

function redirectToAdmin(request: Request, status: string) {
  const url = new URL("/admin", request.url);
  url.searchParams.set("status", status);
  url.hash = "hero-image";

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

  let nextHeroImageSrc = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!isFilledFile(file)) {
      return redirectToAdmin(request, "hero-image-invalid");
    }

    const currentHeroImageSrc = await getHeroImageSrc();
    nextHeroImageSrc = await saveHeroImageUpload(file);

    await setHeroImageSrc(nextHeroImageSrc);

    if (
      currentHeroImageSrc !== DEFAULT_HERO_IMAGE_SRC &&
      currentHeroImageSrc !== nextHeroImageSrc
    ) {
      await deletePublicUpload(currentHeroImageSrc);
    }

    return redirectToAdmin(request, "hero-image-updated");
  } catch (error) {
    if (nextHeroImageSrc) {
      await deletePublicUpload(nextHeroImageSrc);
    }

    console.error("Admin hero image update failed.", error);

    return redirectToAdmin(request, "hero-image-error");
  }
}
