"use client";

import { upload } from "@vercel/blob/client";
import { Images } from "lucide-react";
import { type FormEvent, useState } from "react";

const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

function sanitizeFilename(value: string) {
  const fallback = "gallery-image.jpg";
  const parts = (value || fallback).split(".");
  const extension = parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : ".jpg";
  const name =
    parts
      .join(".")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "gallery-image";

  return `${name}${extension}`;
}

function isFilledImage(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export default function AdminGalleryUploadForm({
  useDirectBlobUpload,
}: {
  useDirectBlobUpload: boolean;
}) {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isUploading) {
      event.preventDefault();
      return;
    }

    if (!useDirectBlobUpload) {
      return;
    }

    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const files = formData.getAll("files").filter(isFilledImage);

    if (files.length === 0) {
      setError("Choose one or more images before uploading.");
      return;
    }

    if (files.some((file) => file.size > MAX_IMAGE_UPLOAD_BYTES)) {
      setError("Gallery images must be 8 MB or smaller.");
      return;
    }

    setError("");
    setProgress(0);
    setIsUploading(true);
    setStatusLabel(files.length > 1 ? `Uploading 1 of ${files.length}` : "Uploading");

    try {
      const uploadedMediaUrls: string[] = [];
      const batchStamp = Date.now();

      for (const [index, file] of files.entries()) {
        const blob = await upload(
          `content/gallery/${batchStamp}-${index + 1}-${sanitizeFilename(file.name)}`,
          file,
          {
            access: "public",
            contentType: file.type || "image/jpeg",
            handleUploadUrl: "/api/admin/content/blob-upload",
            onUploadProgress: (event) => {
              setProgress(((index + event.percentage / 100) / files.length) * 100);
            },
          },
        );

        uploadedMediaUrls.push(blob.url);
        setProgress(((index + 1) / files.length) * 100);

        if (index + 1 < files.length) {
          setStatusLabel(`Uploading ${index + 2} of ${files.length}`);
        }
      }

      const createFormData = new FormData();
      createFormData.set("kind", "gallery_photo");
      createFormData.set("title", String(formData.get("title") || ""));
      createFormData.set("summary", String(formData.get("summary") || ""));
      uploadedMediaUrls.forEach((mediaUrl) => {
        createFormData.append("mediaUrl", mediaUrl);
      });

      setStatusLabel("Saving");
      const response = await fetch("/api/admin/content/upload", {
        body: createFormData,
        method: "POST",
      });

      window.location.assign(response.url || "/admin/gallery");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Upload could not be saved.",
      );
      setIsUploading(false);
      setStatusLabel("");
    }
  }

  return (
    <article className="admin-panel">
      <div className="admin-panel-heading">
        <Images aria-hidden="true" size={20} />
        <div>
          <p>Photo gallery</p>
          <h2>Upload public gallery images</h2>
        </div>
      </div>

      <form
        action="/api/admin/content/upload"
        method="post"
        encType="multipart/form-data"
        className="admin-form compact"
        onSubmit={handleSubmit}
      >
        <input name="kind" type="hidden" value="gallery_photo" />
        <label>
          <span>Shared photo title</span>
          <input name="title" required placeholder="District meeting in Lahore" />
        </label>
        <label>
          <span>Shared caption / summary</span>
          <textarea
            name="summary"
            placeholder="Short caption shown below the photo"
            rows={3}
          />
        </label>
        <label>
          <span>Image files</span>
          <input
            name="files"
            required
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            onChange={(event) => {
              setSelectedCount(event.currentTarget.files?.length || 0);
            }}
          />
        </label>
        <button className="primary-button" disabled={isUploading} type="submit">
          {isUploading
            ? `${statusLabel || "Uploading"} ${Math.round(progress)}%`
            : selectedCount > 1
              ? `Upload ${selectedCount} photos`
              : "Upload photo"}
        </button>
        {error && <p className="form-status is-error">{error}</p>}
      </form>
    </article>
  );
}
