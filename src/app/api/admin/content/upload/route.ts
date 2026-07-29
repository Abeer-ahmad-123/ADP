import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { createContentEntry } from "@/lib/contentRepository";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import {
  deletePublicUpload,
  saveGalleryImageUpload,
  saveMediaUpload,
} from "@/lib/uploadStore";
import type { ContentKind } from "@/types/party";

export const runtime = "nodejs";

type UploadContentKind = Extract<
  ContentKind,
  "audio" | "gallery_photo" | "video_reel"
>;

function redirectToUploadSection(request: Request, status: string, kind: string) {
  const url = new URL(
    kind === "gallery_photo" ? "/admin/gallery" : "/admin/media",
    request.url,
  );
  url.searchParams.set("status", status);

  return redirectAfterPost(url);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function isUploadContentKind(value: string): value is UploadContentKind {
  return value === "audio" || value === "video_reel" || value === "gallery_photo";
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return redirectToPathAfterPost(request, "/admin/login");
  }

  const formData = await request.formData();
  const kind = readText(formData, "kind");
  const title = readText(formData, "title");
  const summary = readText(formData, "summary");

  if (!isUploadContentKind(kind) || title.length < 2) {
    return redirectToUploadSection(request, "upload-invalid", kind);
  }

  let mediaUrl = "";

  try {
    mediaUrl =
      kind === "gallery_photo"
        ? await saveGalleryImageUpload(formData.get("file"))
        : await saveMediaUpload({
            file: formData.get("file"),
            kind,
          });

    await createContentEntry({
      body: "",
      isPublished: true,
      kind,
      mediaUrl,
      personRole: "",
      summary:
        summary ||
        (kind === "gallery_photo"
          ? "Public gallery photo."
          : "Uploaded public media file."),
      thumbnailUrl: "",
      title,
    });

    return redirectToUploadSection(request, "upload-created", kind);
  } catch (error) {
    if (mediaUrl) {
      await deletePublicUpload(mediaUrl);
    }

    console.error("Admin content upload failed.", error);

    return redirectToUploadSection(request, "upload-error", kind);
  }
}
