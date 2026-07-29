import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_MEDIA_UPLOAD_BYTES = 120 * 1024 * 1024;
const MAX_BOOK_UPLOAD_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

function sanitizeFilename(value: string) {
  const fallback = "upload";
  const parsed = path.parse(value || fallback);
  const name =
    parsed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback;
  const ext = parsed.ext.toLowerCase().replace(/[^.a-z0-9]/g, "");

  return `${name}${ext}`;
}

function assertUploadFile(file: FormDataEntryValue | null): asserts file is File {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose a file to upload.");
  }
}

function assertFileRules({
  allowedExtensions,
  allowedMimePrefixes,
  file,
  maxBytes,
}: {
  allowedExtensions: string[];
  allowedMimePrefixes: string[];
  file: File;
  maxBytes: number;
}) {
  const filename = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((extension) =>
    filename.endsWith(extension),
  );
  const hasAllowedMime = allowedMimePrefixes.some((prefix) =>
    file.type.startsWith(prefix),
  );

  if (!hasAllowedExtension && !hasAllowedMime) {
    throw new Error("This file type is not allowed.");
  }

  if (file.size > maxBytes) {
    throw new Error("This file is too large.");
  }
}

export async function saveMediaUpload({
  file,
  kind,
}: {
  file: FormDataEntryValue | null;
  kind: "audio" | "video_reel";
}) {
  assertUploadFile(file);

  assertFileRules({
    allowedExtensions:
      kind === "audio"
        ? [".mp3", ".m4a", ".wav", ".webm", ".ogg"]
        : [".mp4", ".webm", ".mov"],
    allowedMimePrefixes:
      kind === "audio" ? ["audio/"] : ["video/"],
    file,
    maxBytes: MAX_MEDIA_UPLOAD_BYTES,
  });

  return savePublicUpload(file, `media/${kind}`);
}

export async function saveBookPdfUpload(file: FormDataEntryValue | null) {
  assertUploadFile(file);

  assertFileRules({
    allowedExtensions: [".pdf"],
    allowedMimePrefixes: ["application/pdf"],
    file,
    maxBytes: MAX_BOOK_UPLOAD_BYTES,
  });

  return savePublicUpload(file, "book");
}

export async function saveManifestoPdfUpload(file: FormDataEntryValue | null) {
  assertUploadFile(file);

  assertFileRules({
    allowedExtensions: [".pdf"],
    allowedMimePrefixes: ["application/pdf"],
    file,
    maxBytes: MAX_BOOK_UPLOAD_BYTES,
  });

  return savePublicUpload(file, "manifesto");
}

export async function saveLeadershipImageUpload(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    return "";
  }

  assertFileRules({
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    allowedMimePrefixes: ["image/"],
    file,
    maxBytes: MAX_IMAGE_UPLOAD_BYTES,
  });

  return savePublicUpload(file, "content/leadership");
}

export async function deletePublicUpload(href: string) {
  if (!href.startsWith("/uploads/")) {
    return;
  }

  const publicDirectory = path.join(process.cwd(), "public");
  const uploadsDirectory = path.join(publicDirectory, "uploads");
  const relativePath = href.replace(/^\/+/, "");
  const targetPath = path.normalize(path.join(publicDirectory, relativePath));

  if (!targetPath.startsWith(`${uploadsDirectory}${path.sep}`)) {
    return;
  }

  try {
    await unlink(targetPath);
  } catch {
    // Missing local files should not block content edits.
  }
}

async function savePublicUpload(file: File, directory: string) {
  const filename = `${Date.now()}-${sanitizeFilename(file.name)}`;
  const relativePath = `/uploads/${directory}/${filename}`;
  const targetDirectory = path.join(process.cwd(), "public", "uploads", directory);
  const targetPath = path.join(targetDirectory, filename);

  await mkdir(targetDirectory, { recursive: true });
  await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

  return relativePath;
}
