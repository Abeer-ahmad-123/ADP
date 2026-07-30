import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  createBook,
  deleteBook,
  replaceBookPages,
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

function redirectToAdmin(request: Request, status: string) {
  const url = new URL("/admin/books", request.url);
  url.searchParams.set("status", status);

  return redirectAfterPost(url);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function isBlobPdfHref(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".blob.vercel-storage.com") &&
      url.pathname.toLowerCase().endsWith(".pdf")
    );
  } catch {
    return false;
  }
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
    const uploadedBlobHref = readText(formData, "pdfHref");

    if (title.length < 2 || subtitle.length < 2 || author.length < 2) {
      return redirectToAdmin(request, "book-invalid");
    }

    if (uploadedBlobHref && !isBlobPdfHref(uploadedBlobHref)) {
      return redirectToAdmin(request, "book-invalid");
    }

    let bookPdfHref = "";
    let createdBook: Awaited<ReturnType<typeof createBook>> = null;

    try {
      bookPdfHref = uploadedBlobHref || (await saveBookPdfUpload(formData.get("file")));
      createdBook = await createBook({
        author,
        pdfHref: bookPdfHref,
        subtitle,
        title,
      });

      if (!createdBook) {
        throw new Error("Book could not be created.");
      }

      const pages = await generateBookPagesFromPdf({
        bookId: createdBook.id,
        pdfHref: bookPdfHref,
        title,
      });

      await replaceBookPages(createdBook.id, pages);
    } catch (error) {
      if (createdBook) {
        await deleteBook(createdBook.id);
        await deleteGeneratedBookPageImages(createdBook.id);
      }

      if (bookPdfHref) {
        await deletePublicUpload(bookPdfHref);
      }

      throw error;
    }

    return redirectToAdmin(request, "book-created");
  } catch {
    return redirectToAdmin(request, "book-error");
  }
}
