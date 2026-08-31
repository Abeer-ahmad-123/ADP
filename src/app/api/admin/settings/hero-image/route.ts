import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import {
  DEFAULT_HERO_FLAG_IMAGE_SRC,
  getHeroFlagImageSrc,
  setHeroFlagImageSrc,
} from "@/lib/siteSettings";
import { deletePublicUpload, saveHeroFlagImageUpload } from "@/lib/uploadStore";

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

  let nextHeroFlagImageSrc = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!isFilledFile(file)) {
      return redirectToAdmin(request, "hero-image-invalid");
    }

    const currentHeroFlagImageSrc = await getHeroFlagImageSrc();
    nextHeroFlagImageSrc = await saveHeroFlagImageUpload(file);

    await setHeroFlagImageSrc(nextHeroFlagImageSrc);

    if (
      currentHeroFlagImageSrc !== DEFAULT_HERO_FLAG_IMAGE_SRC &&
      currentHeroFlagImageSrc !== nextHeroFlagImageSrc
    ) {
      await deletePublicUpload(currentHeroFlagImageSrc);
    }

    return redirectToAdmin(request, "hero-image-updated");
  } catch (error) {
    if (nextHeroFlagImageSrc) {
      await deletePublicUpload(nextHeroFlagImageSrc);
    }

    console.error("Admin hero flag image update failed.", error);

    return redirectToAdmin(request, "hero-image-error");
  }
}
