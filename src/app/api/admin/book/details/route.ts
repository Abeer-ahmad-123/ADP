import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { setBookDetails } from "@/lib/bookRepository";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";

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
  const bookId = Number(readText(formData, "bookId"));
  const title = readText(formData, "title");
  const subtitle = readText(formData, "subtitle");
  const author = readText(formData, "author");

  if (
    !Number.isFinite(bookId) ||
    bookId <= 0 ||
    title.length < 2 ||
    subtitle.length < 2 ||
    author.length < 2
  ) {
    return redirectToAdmin(request, "book-details-invalid");
  }

  try {
    await setBookDetails({ author, bookId, subtitle, title });

    return redirectToAdmin(request, "book-details-updated");
  } catch {
    return redirectToAdmin(request, "book-details-error");
  }
}
