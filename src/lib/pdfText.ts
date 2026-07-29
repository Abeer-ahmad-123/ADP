import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const PDF_TEXT_MAX_BUFFER = 20 * 1024 * 1024;
const PDF_DIRECTION_CONTROLS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

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

function resolvePublicUploadPath(href: string) {
  if (!href.startsWith("/uploads/")) {
    throw new Error("PDF href must point to public uploads.");
  }

  const publicRoot = path.join(process.cwd(), "public");
  const uploadsRoot = path.join(publicRoot, "uploads");
  const filePath = path.normalize(path.join(publicRoot, href.replace(/^\/+/, "")));

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error("PDF href resolves outside public uploads.");
  }

  return filePath;
}

export async function extractPdfTextFromPublicHref(href: string) {
  const filePath = resolvePublicUploadPath(href);
  const { stdout } = await execFileAsync(
    "pdftotext",
    ["-enc", "UTF-8", "-nopgbrk", filePath, "-"],
    {
      encoding: "utf8",
      maxBuffer: PDF_TEXT_MAX_BUFFER,
    },
  );

  return normalizeExtractedPdfText(stdout);
}

export async function tryExtractPdfTextFromPublicHref(href: string) {
  try {
    return await extractPdfTextFromPublicHref(href);
  } catch {
    return "";
  }
}
