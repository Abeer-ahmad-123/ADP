import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { createContentEntry } from "@/lib/contentRepository";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import { saveLeadershipImageUpload } from "@/lib/uploadStore";
import type { ContentKind } from "@/types/party";

export const runtime = "nodejs";

const CONTENT_KINDS: ContentKind[] = [
  "news",
  "blog",
  "announcement",
  "leadership_profile",
];

function redirectToAdmin(request: Request, status: string) {
  const url = new URL("/admin/publish", request.url);
  url.searchParams.set("status", status);

  return redirectAfterPost(url);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function isContentKind(value: string): value is ContentKind {
  return CONTENT_KINDS.includes(value as ContentKind);
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

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return redirectToPathAfterPost(request, "/admin/login");
  }

  const formData = await request.formData();
  const kind = readText(formData, "kind");
  const title = readText(formData, "title");
  const summary = readText(formData, "summary");
  const body = readText(formData, "body");
  const personRole = readText(formData, "personRole");

  if (!isContentKind(kind)) {
    return redirectToAdmin(request, "content-invalid");
  }

  if (!hasRequiredFields({ body, kind, personRole, summary, title })) {
    return redirectToAdmin(request, "content-invalid");
  }

  try {
    const thumbnailUrl =
      kind === "leadership_profile"
        ? await saveLeadershipImageUpload(formData.get("profileImage"))
        : "";

    await createContentEntry({
      body: kind === "blog" ? body : "",
      isPublished: true,
      kind,
      mediaUrl: "",
      personRole: kind === "leadership_profile" ? personRole : "",
      summary,
      thumbnailUrl,
      title,
    });

    return redirectToAdmin(request, "content-created");
  } catch {
    return redirectToAdmin(request, "content-error");
  }
}
