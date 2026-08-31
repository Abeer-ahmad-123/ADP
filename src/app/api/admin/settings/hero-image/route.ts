import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import {
  DEFAULT_HERO_FLAG_IMAGE_SRC,
  setHeroFlagCaption,
  getHeroFlagImageSrc,
  setHeroFlagImageSrc,
} from "@/lib/siteSettings";
import { deletePublicUpload, saveHeroFlagImageUpload } from "@/lib/uploadStore";

export const runtime = "nodejs";

function redirectToAdmin(request: Request, status: string) {
  const url = new URL("/admin/homepage", request.url);
  url.searchParams.set("status", status);
  url.hash = "hero-image";

  return redirectAfterPost(url);
}

function isFilledFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function readCaption(formData: FormData) {
  return String(formData.get("caption") || "")
    .trim()
    .slice(0, 180);
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return redirectToPathAfterPost(request, "/admin/login");
  }

  let uploadedHeroFlagImageSrc = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const caption = readCaption(formData);
    const hasNewFile = isFilledFile(file);

    const currentHeroFlagImageSrc = await getHeroFlagImageSrc();
    const nextHeroFlagImageSrc = hasNewFile
      ? await saveHeroFlagImageUpload(file)
      : currentHeroFlagImageSrc;

    uploadedHeroFlagImageSrc = hasNewFile ? nextHeroFlagImageSrc : "";

    await Promise.all([
      setHeroFlagCaption(caption),
      ...(hasNewFile ? [setHeroFlagImageSrc(nextHeroFlagImageSrc)] : []),
    ]);

    if (
      hasNewFile &&
      currentHeroFlagImageSrc !== DEFAULT_HERO_FLAG_IMAGE_SRC &&
      currentHeroFlagImageSrc !== nextHeroFlagImageSrc
    ) {
      await deletePublicUpload(currentHeroFlagImageSrc);
    }

    return redirectToAdmin(request, "hero-image-updated");
  } catch (error) {
    if (uploadedHeroFlagImageSrc) {
      await deletePublicUpload(uploadedHeroFlagImageSrc);
    }

    console.error("Admin hero flag image update failed.", error);

    return redirectToAdmin(request, "hero-image-error");
  }
}
