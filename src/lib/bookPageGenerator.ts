import { mkdir, mkdtemp, rename, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { del, list, put } from "@vercel/blob";
import {
  pdfToPng,
  VerbosityLevel,
} from "pdf-to-png-converter";
import type { BookSpread } from "@/types/party";

const PAGE_RENDER_SCALE = 2;

const PDF_RENDER_OPTIONS = {
  disableFontFace: true,
  returnPageContent: true,
  useSystemFonts: false,
  verbosityLevel: VerbosityLevel.ERRORS,
  viewportScale: PAGE_RENDER_SCALE,
} as const;

function resolvePublicUploadFile(href: string) {
  if (!href.startsWith("/uploads/")) {
    throw new Error("Uploaded PDF href must point to public uploads.");
  }

  const publicRoot = path.join(process.cwd(), "public");
  const uploadsRoot = path.join(publicRoot, "uploads");
  const filePath = path.normalize(path.join(publicRoot, href.replace(/^\/+/, "")));

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error("Uploaded PDF href resolves outside public uploads.");
  }

  return filePath;
}

function isRemotePdfHref(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.pathname.toLowerCase().endsWith(".pdf")
    );
  } catch {
    return false;
  }
}

async function preparePdfForRendering(href: string) {
  if (href.startsWith("/uploads/")) {
    return {
      cleanup: async () => {},
      pdfPath: resolvePublicUploadFile(href),
    };
  }

  if (!isRemotePdfHref(href)) {
    throw new Error("Uploaded PDF href must point to a PDF file.");
  }

  const response = await fetch(href);

  if (!response.ok) {
    throw new Error("Uploaded PDF could not be downloaded for page rendering.");
  }

  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "awam-dost-book-"),
  );
  const pdfPath = path.join(temporaryDirectory, "source.pdf");

  await writeFile(pdfPath, Buffer.from(await response.arrayBuffer()));

  return {
    cleanup: async () => {
      await rm(temporaryDirectory, { force: true, recursive: true });
    },
    pdfPath,
  };
}

function getBookPagesPaths(bookId: number) {
  const publicRoot = path.join(process.cwd(), "public");
  const relativeDirectory = `/uploads/book-pages/${bookId}`;
  const finalDirectory = path.join(publicRoot, relativeDirectory.replace(/^\/+/, ""));
  const pagesRoot = path.dirname(finalDirectory);

  return {
    finalDirectory,
    pagesRoot,
    relativeDirectory,
  };
}

function canUseVercelBlobPages() {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  );
}

function getBookPagesBlobPrefix(bookId: number) {
  return `book-pages/${bookId}/`;
}

function getBookPageBlobPathname(bookId: number, paddedPageNumber: string) {
  return `${getBookPagesBlobPrefix(bookId)}page-${paddedPageNumber}.png`;
}

async function deleteGeneratedBlobPageImages(bookId: number) {
  if (!canUseVercelBlobPages()) {
    return;
  }

  const urls: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      cursor,
      limit: 1000,
      prefix: getBookPagesBlobPrefix(bookId),
    });

    urls.push(...result.blobs.map((blob) => blob.url));
    cursor = result.cursor;
  } while (cursor);

  if (urls.length > 0) {
    await del(urls);
  }
}

async function deleteStaleBlobPageImages(
  bookId: number,
  currentPathnames: Set<string>,
) {
  if (!canUseVercelBlobPages()) {
    return;
  }

  const staleUrls: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      cursor,
      limit: 1000,
      prefix: getBookPagesBlobPrefix(bookId),
    });

    staleUrls.push(
      ...result.blobs
        .filter((blob) => !currentPathnames.has(blob.pathname))
        .map((blob) => blob.url),
    );
    cursor = result.cursor;
  } while (cursor);

  if (staleUrls.length > 0) {
    await del(staleUrls);
  }
}

async function uploadGeneratedBookPageImage({
  bookId,
  imageBuffer,
  paddedPageNumber,
}: {
  bookId: number;
  imageBuffer: Buffer;
  paddedPageNumber: string;
}) {
  const pathname = getBookPageBlobPathname(bookId, paddedPageNumber);
  const blob = await put(pathname, imageBuffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/png",
  });

  return {
    imageSrc: blob.url,
    pathname,
  };
}

async function getPdfPagesMetadata(pdfPath: string) {
  const pages = await pdfToPng(pdfPath, {
    ...PDF_RENDER_OPTIONS,
    returnMetadataOnly: true,
    returnPageContent: false,
  });

  if (pages.length <= 0) {
    throw new Error("Uploaded PDF has no readable pages.");
  }

  return pages;
}

async function renderPdfPage(pdfPath: string, pageNumber: number) {
  const pages = await pdfToPng(pdfPath, {
    ...PDF_RENDER_OPTIONS,
    pagesToProcess: [pageNumber],
  });
  const renderedPage = pages[0];

  if (!renderedPage?.content) {
    throw new Error(`Uploaded PDF page ${pageNumber} could not be rendered.`);
  }

  return renderedPage.content;
}

async function replaceGeneratedDirectory({
  finalDirectory,
  temporaryDirectory,
}: {
  finalDirectory: string;
  temporaryDirectory: string;
}) {
  const backupDirectory = `${finalDirectory}.backup-${Date.now()}`;
  let hasBackup = false;

  try {
    await rename(finalDirectory, backupDirectory);
    hasBackup = true;
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  try {
    await rename(temporaryDirectory, finalDirectory);
    await rm(backupDirectory, { force: true, recursive: true });
  } catch (error) {
    if (hasBackup) {
      await rm(finalDirectory, { force: true, recursive: true });
      await rename(backupDirectory, finalDirectory);
    }

    throw error;
  }
}

export async function deleteGeneratedBookPageImages(bookId: number) {
  const { finalDirectory } = getBookPagesPaths(bookId);

  await Promise.all([
    rm(finalDirectory, { force: true, recursive: true }),
    deleteGeneratedBlobPageImages(bookId),
  ]);
}

export async function generateBookPagesFromPdf({
  bookId,
  pdfHref,
  title,
}: {
  bookId: number;
  pdfHref: string;
  title: string;
}): Promise<BookSpread[]> {
  const preparedPdf = await preparePdfForRendering(pdfHref);
  const { finalDirectory, pagesRoot, relativeDirectory } =
    getBookPagesPaths(bookId);
  const useBlobPages = canUseVercelBlobPages();
  const temporaryDirectory = useBlobPages
    ? await mkdtemp(path.join(tmpdir(), `awam-dost-book-pages-${bookId}-`))
    : path.join(pagesRoot, `.tmp-${bookId}-${Date.now()}`);

  await rm(temporaryDirectory, { force: true, recursive: true });
  await mkdir(temporaryDirectory, { recursive: true });

  try {
    const metadataPages = await getPdfPagesMetadata(preparedPdf.pdfPath);
    const pages: BookSpread[] = [];
    const currentBlobPathnames = new Set<string>();

    for (const pageMetadata of metadataPages) {
      const pageNumber = pageMetadata.pageNumber;
      const paddedPageNumber = String(pageNumber).padStart(3, "0");
      const generatedImagePath = path.join(
        temporaryDirectory,
        `page-${paddedPageNumber}.png`,
      );
      const imageBuffer = await renderPdfPage(preparedPdf.pdfPath, pageNumber);
      const blobPage = useBlobPages
        ? await uploadGeneratedBookPageImage({
            bookId,
            imageBuffer,
            paddedPageNumber,
          })
        : null;

      if (!useBlobPages) {
        await writeFile(generatedImagePath, imageBuffer);
      }

      if (blobPage) {
        currentBlobPathnames.add(blobPage.pathname);
      }

      pages.push({
        body: "",
        imageAlt: `${title}, page ${pageNumber}`,
        imageSrc:
          blobPage?.imageSrc || `${relativeDirectory}/page-${paddedPageNumber}.png`,
        kicker: "",
        pageNumber,
        title: "",
      });
    }

    if (useBlobPages) {
      await deleteStaleBlobPageImages(bookId, currentBlobPathnames);
    } else {
      await replaceGeneratedDirectory({
        finalDirectory,
        temporaryDirectory,
      });
    }

    return pages;
  } catch (error) {
    await rm(temporaryDirectory, { force: true, recursive: true });

    throw error;
  } finally {
    if (useBlobPages) {
      await rm(temporaryDirectory, { force: true, recursive: true });
    }

    await preparedPdf.cleanup();
  }
}
