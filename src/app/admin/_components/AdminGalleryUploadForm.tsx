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

export default function AdminGalleryUploadForm() {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!isFilledImage(file)) {
      setError("Choose an image before uploading.");
      return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError("Gallery images must be 8 MB or smaller.");
      return;
    }

    setError("");
    setProgress(0);
    setIsUploading(true);

    try {
      const blob = await upload(
        `content/gallery/${Date.now()}-${sanitizeFilename(file.name)}`,
        file,
        {
          access: "public",
          contentType: file.type || "image/jpeg",
          handleUploadUrl: "/api/admin/content/blob-upload",
          onUploadProgress: (event) => {
            setProgress(event.percentage);
          },
        },
      );

      const createFormData = new FormData();
      createFormData.set("kind", "gallery_photo");
      createFormData.set("title", String(formData.get("title") || ""));
      createFormData.set("summary", String(formData.get("summary") || ""));
      createFormData.set("mediaUrl", blob.url);

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
          <span>Photo title</span>
          <input name="title" required placeholder="District meeting in Lahore" />
        </label>
        <label>
          <span>Caption / summary</span>
          <textarea
            name="summary"
            placeholder="Short caption shown below the photo"
            rows={3}
          />
        </label>
        <label>
          <span>Image file</span>
          <input
            name="file"
            required
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
          />
        </label>
        <button className="primary-button" disabled={isUploading} type="submit">
          {isUploading ? `Uploading ${Math.round(progress)}%` : "Upload photo"}
        </button>
        {error && <p className="form-status is-error">{error}</p>}
      </form>
    </article>
  );
}
