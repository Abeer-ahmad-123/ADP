import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  createContentEntries,
  createContentEntry,
} from "@/lib/contentRepository";
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

function readTextList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function readGalleryFiles(formData: FormData) {
  return [...formData.getAll("files"), ...formData.getAll("file")].filter(
    (value): value is File => value instanceof File && value.size > 0,
  );
}

function isBlobUploadHref(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
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
  const uploadedMediaUrls = readTextList(formData, "mediaUrl");

  if (!isUploadContentKind(kind) || title.length < 2) {
    return redirectToUploadSection(request, "upload-invalid", kind);
  }

  if (uploadedMediaUrls.some((url) => !isBlobUploadHref(url))) {
    return redirectToUploadSection(request, "upload-invalid", kind);
  }

  const mediaUrls: string[] = [];

  try {
    if (kind === "gallery_photo") {
      if (uploadedMediaUrls.length > 0) {
        mediaUrls.push(...uploadedMediaUrls);
      } else {
        for (const file of readGalleryFiles(formData)) {
          mediaUrls.push(await saveGalleryImageUpload(file));
        }
      }

      if (mediaUrls.length === 0) {
        return redirectToUploadSection(request, "upload-invalid", kind);
      }

      const groupId =
        mediaUrls.length > 1
          ? `${Date.now()}-${crypto.randomUUID()}`
          : "";

      await createContentEntries(
        mediaUrls.map((mediaUrl, index) => ({
          body: groupId ? `gallery-group:${groupId}:${index}` : "",
          isPublished: true,
          kind,
          mediaUrl,
          personRole: "",
          summary: summary || "Public gallery photo.",
          thumbnailUrl: "",
          title,
        })),
      );

      return redirectToUploadSection(request, "upload-created", kind);
    }

    const mediaUrl =
      uploadedMediaUrls[0] ||
      (await saveMediaUpload({
        file: formData.get("file"),
        kind,
      }));

    mediaUrls.push(mediaUrl);

    await createContentEntry({
      body: "",
      isPublished: true,
      kind,
      mediaUrl,
      personRole: "",
      summary: summary || "Uploaded public media file.",
      thumbnailUrl: "",
      title,
    });

    return redirectToUploadSection(request, "upload-created", kind);
  } catch (error) {
    await Promise.all(mediaUrls.map((mediaUrl) => deletePublicUpload(mediaUrl)));

    console.error("Admin content upload failed.", error);

    return redirectToUploadSection(request, "upload-error", kind);
  }
}
