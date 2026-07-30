import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  getManifestoDocument,
  setManifestoDocument,
} from "@/lib/manifestoRepository";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";
import { extractPdfTextFromPublicHref } from "@/lib/pdfText";
import {
  deletePublicUpload,
  saveManifestoPdfUpload,
} from "@/lib/uploadStore";

export const runtime = "nodejs";

function redirectToAdmin(request: Request, status: string) {
  const url = new URL("/admin/manifesto", request.url);
  url.searchParams.set("status", status);
  url.hash = "manifesto";

  return redirectAfterPost(url);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function isFilledFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
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
    const summary = readText(formData, "summary");
    const uploadedBlobHref = readText(formData, "pdfHref");

    if (title.length < 2 || summary.length < 8) {
      return redirectToAdmin(request, "manifesto-invalid");
    }

    if (uploadedBlobHref && !isBlobPdfHref(uploadedBlobHref)) {
      return redirectToAdmin(request, "manifesto-invalid");
    }

    const currentManifesto = await getManifestoDocument();
    const file = formData.get("file");
    const hasUploadedBlob = Boolean(uploadedBlobHref);
    const hasNewFile = hasUploadedBlob || isFilledFile(file);
    const nextPdfHref = hasUploadedBlob
      ? uploadedBlobHref
      : isFilledFile(file)
      ? await saveManifestoPdfUpload(file)
      : currentManifesto.pdfHref;

    if (!nextPdfHref) {
      return redirectToAdmin(request, "manifesto-invalid");
    }

    let nextText = currentManifesto.text;

    if (hasNewFile || !nextText) {
      try {
        nextText = await extractPdfTextFromPublicHref(nextPdfHref);
      } catch (error) {
        if (hasNewFile) {
          await deletePublicUpload(nextPdfHref);
        }

        console.error("Manifesto text extraction failed.", error);

        return redirectToAdmin(request, "manifesto-text-error");
      }
    }

    if (!nextText) {
      if (hasNewFile) {
        await deletePublicUpload(nextPdfHref);
      }

      return redirectToAdmin(request, "manifesto-text-empty");
    }

    await setManifestoDocument({
      pdfHref: nextPdfHref,
      summary,
      text: nextText,
      title,
    });

    if (nextPdfHref !== currentManifesto.pdfHref) {
      await deletePublicUpload(currentManifesto.pdfHref);
    }

    return redirectToAdmin(request, "manifesto-updated");
  } catch (error) {
    console.error("Admin manifesto update failed.", error);

    return redirectToAdmin(request, "manifesto-error");
  }
}
