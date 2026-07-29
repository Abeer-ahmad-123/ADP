import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  deleteContentEntry,
  getContentEntryById,
  updateContentEntry,
} from "@/lib/contentRepository";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import {
  deletePublicUpload,
  saveLeadershipImageUpload,
  saveMediaUpload,
} from "@/lib/uploadStore";
import type { ContentKind } from "@/types/party";

export const runtime = "nodejs";

function redirectToContentManager(
  request: Request,
  status: string,
  entryId?: number,
) {
  const url = new URL("/admin/content", request.url);
  url.searchParams.set("status", status);

  if (entryId) {
    url.hash = `entry-${entryId}`;
  }

  return redirectAfterPost(url);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function readEntryId(formData: FormData) {
  const id = Number(readText(formData, "id"));

  return Number.isInteger(id) && id > 0 ? id : 0;
}

function isMediaKind(kind: ContentKind): kind is "audio" | "video_reel" {
  return kind === "audio" || kind === "video_reel";
}

function isFilledFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function hasRequiredFields({
  body,
  kind,
  personRole,
  summary,
  title,
}: {
  body: string;
  kind: ContentKind;
  personRole: string;
  summary: string;
  title: string;
}) {
  if (title.length < 2 || summary.length < 2) {
    return false;
  }

  if (kind === "blog" && body.length < 8) {
    return false;
  }

  if (kind === "leadership_profile" && personRole.length < 2) {
    return false;
  }

  return true;
}

async function updateEntry(request: Request, formData: FormData) {
  const id = readEntryId(formData);

  if (!id) {
    return redirectToContentManager(request, "content-manage-invalid");
  }

  const existing = await getContentEntryById(id);

  if (!existing) {
    return redirectToContentManager(request, "content-manage-missing");
  }

  const title = readText(formData, "title");
  const summary = readText(formData, "summary");
  const body = readText(formData, "body");
  const personRole = readText(formData, "personRole");

  if (
    !hasRequiredFields({
      body,
      kind: existing.kind,
      personRole,
      summary,
      title,
    })
  ) {
    return redirectToContentManager(request, "content-manage-invalid", id);
  }

  let mediaUrl = existing.mediaUrl;
  let thumbnailUrl = existing.thumbnailUrl;

  if (isMediaKind(existing.kind)) {
    const mediaFile = formData.get("mediaFile");

    if (isFilledFile(mediaFile)) {
      mediaUrl = await saveMediaUpload({
        file: mediaFile,
        kind: existing.kind,
      });
    }
  }

  if (existing.kind === "leadership_profile") {
    const nextThumbnailUrl = await saveLeadershipImageUpload(
      formData.get("profileImage"),
    );

    if (nextThumbnailUrl) {
      thumbnailUrl = nextThumbnailUrl;
    }
  }

  const updated = await updateContentEntry({
    body: existing.kind === "blog" ? body : existing.body,
    id,
    isPublished: formData.get("isPublished") === "on",
    mediaUrl,
    personRole:
      existing.kind === "leadership_profile"
        ? personRole
        : existing.personRole,
    summary,
    thumbnailUrl,
    title,
  });

  if (updated) {
    if (mediaUrl && mediaUrl !== existing.mediaUrl) {
      await deletePublicUpload(existing.mediaUrl);
    }

    if (thumbnailUrl && thumbnailUrl !== existing.thumbnailUrl) {
      await deletePublicUpload(existing.thumbnailUrl);
    }
  }

  return redirectToContentManager(
    request,
    updated ? "content-updated" : "content-manage-missing",
    id,
  );
}

async function deleteEntry(request: Request, formData: FormData) {
  const id = readEntryId(formData);

  if (!id) {
    return redirectToContentManager(request, "content-manage-invalid");
  }

  const existing = await getContentEntryById(id);

  if (!existing) {
    return redirectToContentManager(request, "content-manage-missing");
  }

  const deleted = await deleteContentEntry(id);

  if (deleted) {
    await Promise.all([
      deletePublicUpload(existing.mediaUrl),
      deletePublicUpload(existing.thumbnailUrl),
    ]);
  }

  return redirectToContentManager(
    request,
    deleted ? "content-deleted" : "content-manage-missing",
  );
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return redirectToPathAfterPost(request, "/admin/login");
  }

  try {
    const formData = await request.formData();
    const intent = readText(formData, "intent");

    if (intent === "update") {
      return await updateEntry(request, formData);
    }

    if (intent === "delete") {
      return await deleteEntry(request, formData);
    }

    return redirectToContentManager(request, "content-manage-invalid");
  } catch {
    return redirectToContentManager(request, "content-manage-error");
  }
}
