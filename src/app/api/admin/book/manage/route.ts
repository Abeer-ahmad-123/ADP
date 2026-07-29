import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  deleteBook,
  getBookById,
  replaceBookPages,
  updateBook,
} from "@/lib/bookRepository";
import {
  deleteGeneratedBookPageImages,
  generateBookPagesFromPdf,
} from "@/lib/bookPageGenerator";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import {
  deletePublicUpload,
  saveBookPdfUpload,
} from "@/lib/uploadStore";

export const runtime = "nodejs";

function redirectToAdmin(request: Request, status: string, bookId?: number) {
  const url = new URL("/admin/books", request.url);
  url.searchParams.set("status", status);

  if (bookId) {
    url.hash = `book-${bookId}`;
  }

  return redirectAfterPost(url);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function readBookId(formData: FormData) {
  const id = Number(readText(formData, "id"));

  return Number.isInteger(id) && id > 0 ? id : 0;
}

function isFilledFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

async function updateBookEntry(request: Request, formData: FormData) {
  const id = readBookId(formData);

  if (!id) {
    return redirectToAdmin(request, "book-manage-invalid");
  }

  const existing = await getBookById(id);

  if (!existing) {
    return redirectToAdmin(request, "book-manage-missing");
  }

  const title = readText(formData, "title");
  const subtitle = readText(formData, "subtitle");
  const author = readText(formData, "author");

  if (title.length < 2 || subtitle.length < 2 || author.length < 2) {
    return redirectToAdmin(request, "book-manage-invalid", id);
  }

  const pdfFile = formData.get("pdfFile");
  let uploadedPdfHref = "";
  let pdfHref = existing.pdfHref;
  let generatedPages: Awaited<ReturnType<typeof generateBookPagesFromPdf>> | null =
    null;

  if (isFilledFile(pdfFile)) {
    uploadedPdfHref = await saveBookPdfUpload(pdfFile);
    pdfHref = uploadedPdfHref;
    generatedPages = await generateBookPagesFromPdf({
      bookId: id,
      pdfHref,
      title,
    });
  }

  const updated = await updateBook({
    author,
    id,
    isPublished: formData.get("isPublished") === "on",
    pdfHref,
    subtitle,
    title,
  });

  if (!updated) {
    await deletePublicUpload(uploadedPdfHref);

    return redirectToAdmin(request, "book-manage-missing");
  }

  if (generatedPages) {
    await replaceBookPages(id, generatedPages);
  }

  if (uploadedPdfHref && uploadedPdfHref !== existing.pdfHref) {
    await deletePublicUpload(existing.pdfHref);
  }

  return redirectToAdmin(request, "book-updated", id);
}

async function deleteBookEntry(request: Request, formData: FormData) {
  const id = readBookId(formData);

  if (!id) {
    return redirectToAdmin(request, "book-manage-invalid");
  }

  const existing = await getBookById(id);

  if (!existing) {
    return redirectToAdmin(request, "book-manage-missing");
  }

  const deleted = await deleteBook(id);

  if (deleted) {
    await deletePublicUpload(existing.pdfHref);
    await deleteGeneratedBookPageImages(id);
  }

  return redirectToAdmin(
    request,
    deleted ? "book-deleted" : "book-manage-missing",
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
      return await updateBookEntry(request, formData);
    }

    if (intent === "delete") {
      return await deleteBookEntry(request, formData);
    }

    return redirectToAdmin(request, "book-manage-invalid");
  } catch {
    return redirectToAdmin(request, "book-manage-error");
  }
}
