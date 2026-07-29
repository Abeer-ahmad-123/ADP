import { execFile } from "child_process";
import { mkdir, rename, rm } from "fs/promises";
import path from "path";
import { promisify } from "util";
import type { BookSpread } from "@/types/party";

const execFileAsync = promisify(execFile);
const PDF_TOOL_MAX_BUFFER = 8 * 1024 * 1024;
const PAGE_RENDER_DPI = "144";

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

async function getPdfPageCount(pdfPath: string) {
  const { stdout } = await execFileAsync("pdfinfo", [pdfPath], {
    encoding: "utf8",
    maxBuffer: PDF_TOOL_MAX_BUFFER,
  });
  const match = stdout.match(/^Pages:\s+(\d+)\s*$/m);
  const pageCount = match ? Number(match[1]) : 0;

  if (!Number.isInteger(pageCount) || pageCount <= 0) {
    throw new Error("Uploaded PDF has no readable pages.");
  }

  return pageCount;
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

  await rm(finalDirectory, { force: true, recursive: true });
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
  const pdfPath = resolvePublicUploadFile(pdfHref);
  const pageCount = await getPdfPageCount(pdfPath);
  const { finalDirectory, pagesRoot, relativeDirectory } =
    getBookPagesPaths(bookId);
  const temporaryDirectory = path.join(
    pagesRoot,
    `.tmp-${bookId}-${Date.now()}`,
  );

  await rm(temporaryDirectory, { force: true, recursive: true });
  await mkdir(temporaryDirectory, { recursive: true });

  try {
    const pages: BookSpread[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const paddedPageNumber = String(pageNumber).padStart(3, "0");
      const outputBase = path.join(temporaryDirectory, `page-${paddedPageNumber}`);

      await execFileAsync(
        "pdftoppm",
        [
          "-png",
          "-r",
          PAGE_RENDER_DPI,
          "-f",
          String(pageNumber),
          "-l",
          String(pageNumber),
          "-singlefile",
          pdfPath,
          outputBase,
        ],
        {
          maxBuffer: PDF_TOOL_MAX_BUFFER,
        },
      );

      pages.push({
        body: "",
        imageAlt: `${title}, page ${pageNumber}`,
        imageSrc: `${relativeDirectory}/page-${paddedPageNumber}.png`,
        kicker: "",
        pageNumber,
        title: "",
      });
    }

    await replaceGeneratedDirectory({
      finalDirectory,
      temporaryDirectory,
    });

    return pages;
  } catch (error) {
    await rm(temporaryDirectory, { force: true, recursive: true });

    throw error;
  }
}
