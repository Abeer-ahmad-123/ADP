import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { createBook } from "@/lib/bookRepository";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import { saveBookPdfUpload } from "@/lib/uploadStore";

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

  try {
    const formData = await request.formData();
    const title = readText(formData, "title");
    const subtitle = readText(formData, "subtitle");
    const author = readText(formData, "author");

    if (title.length < 2 || subtitle.length < 2 || author.length < 2) {
      return redirectToAdmin(request, "book-invalid");
    }

    const bookPdfHref = await saveBookPdfUpload(formData.get("file"));
    await createBook({
      author,
      pdfHref: bookPdfHref,
      subtitle,
      title,
    });

    return redirectToAdmin(request, "book-created");
  } catch {
    return redirectToAdmin(request, "book-error");
  }
}
