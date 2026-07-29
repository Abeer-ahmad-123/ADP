import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { createContentEntry } from "@/lib/contentRepository";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import { saveMediaUpload } from "@/lib/uploadStore";

export const runtime = "nodejs";

function redirectToAdmin(request: Request, status: string) {
  const url = new URL("/admin", request.url);
  url.searchParams.set("status", status);

  return redirectAfterPost(url);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
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

  if ((kind !== "audio" && kind !== "video_reel") || title.length < 2) {
    return redirectToAdmin(request, "upload-invalid");
  }

  try {
    const mediaUrl = await saveMediaUpload({
      file: formData.get("file"),
      kind,
    });

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

    return redirectToAdmin(request, "upload-created");
  } catch {
    return redirectToAdmin(request, "upload-error");
  }
}
