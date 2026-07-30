import { readFile } from "fs/promises";
import path from "path";

const PDF_DIRECTION_CONTROLS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

type PdfJsModule = typeof import("pdfjs-dist");
type PdfTextItem = {
  hasEOL?: boolean;
  str: string;
};

let pdfjsLib: PdfJsModule | undefined;

function cleanExtractedPdfLine(line: string) {
  return line
    .replace(PDF_DIRECTION_CONTROLS, "")
    .trim()
    .replace(/[ \t]{2,}/g, " ");
}

function normalizeKnownRtlArtifact(line: string) {
  if (line === "راپ تسود ماوع") {
    return "";
  }

  if (
    line === "یٹراپ تسود ماوع" ||
    line === "راپ تسود ماوع یٹراپ تسود ماوع"
  ) {
    return "عوام دوست پارٹی";
  }

  return line;
}

export function normalizeExtractedPdfText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\u000c/g, "\n\n")
    .split("\n")
    .map((line) => normalizeKnownRtlArtifact(cleanExtractedPdfLine(line)))
    .filter((line) => !/^page \d+ of \d+$/i.test(line))
    .filter((line) => !/^awam dost party\s*[\u2013\u2014-]\s*manifesto$/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

function resolvePublicUploadPath(href: string) {
  const publicRoot = path.join(process.cwd(), "public");
  const uploadsRoot = path.join(publicRoot, "uploads");
  const filePath = path.normalize(path.join(publicRoot, href.replace(/^\/+/, "")));

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error("PDF href resolves outside public uploads.");
  }

  return filePath;
}

async function readPdfData(href: string) {
  if (href.startsWith("/uploads/")) {
    const buffer = await readFile(resolvePublicUploadPath(href));

    return new Uint8Array(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    );
  }

  if (!isRemotePdfHref(href)) {
    throw new Error("PDF href must point to a PDF file.");
  }

  const response = await fetch(href);

  if (!response.ok) {
    throw new Error("PDF could not be downloaded for text extraction.");
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function getPdfJs() {
  pdfjsLib ??= (await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  )) as PdfJsModule;

  return pdfjsLib;
}

function textItemsToString(items: unknown[]) {
  let text = "";

  for (const item of items) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("str" in item) ||
      typeof item.str !== "string"
    ) {
      continue;
    }

    const textItem = item as PdfTextItem;
    text += textItem.str;
    text += textItem.hasEOL ? "\n" : " ";
  }

  return text;
}

export async function extractPdfTextFromPublicHref(href: string) {
  const [pdfjs, data] = await Promise.all([getPdfJs(), readPdfData(href)]);
  const document = await pdfjs.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  }).promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);

      try {
        const textContent = await page.getTextContent();
        pages.push(textItemsToString(textContent.items));
      } finally {
        page.cleanup();
      }
    }
  } finally {
    await document.destroy();
  }

  return normalizeExtractedPdfText(pages.join("\n\n"));
}

export async function tryExtractPdfTextFromPublicHref(href: string) {
  try {
    return await extractPdfTextFromPublicHref(href);
  } catch {
    return "";
  }
}
