"use client";

import { upload } from "@vercel/blob/client";
import { FileUp } from "lucide-react";
import { type FormEvent, useState } from "react";

type MediaKind = "audio" | "video_reel";

const MAX_MEDIA_UPLOAD_BYTES = 120 * 1024 * 1024;

function sanitizeFilename(value: string) {
  const fallback = "media-upload";
  const parts = (value || fallback).split(".");
  const extension = parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : "";
  const name =
    parts
      .join(".")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback;

  return `${name}${extension}`;
}

function isFilledMedia(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function isMediaKind(value: FormDataEntryValue | null): value is MediaKind {
  return value === "audio" || value === "video_reel";
}

function getFallbackContentType(kind: MediaKind) {
  return kind === "audio" ? "audio/mpeg" : "video/mp4";
}

export default function AdminMediaUploadForm() {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [statusLabel, setStatusLabel] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (!isMediaKind(kind)) {
      setError("Choose audio or video reel.");
      return;
    }

    if (!isFilledMedia(file)) {
      setError("Choose a media file before uploading.");
      return;
    }

    if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
      setError("Media uploads must be 120 MB or smaller.");
      return;
    }

    setError("");
    setProgress(1);
    setIsUploading(true);
    setStatusLabel("Preparing upload");

    try {
      const blob = await upload(
        `media/${kind}/${Date.now()}-${sanitizeFilename(file.name)}`,
        file,
        {
          access: "public",
          contentType: file.type || getFallbackContentType(kind),
          handleUploadUrl: "/api/admin/content/blob-upload",
          onUploadProgress: (event) => {
            setStatusLabel("Uploading media");
            setProgress(event.percentage);
          },
        },
      );

      const createFormData = new FormData();
      createFormData.set("kind", kind);
      createFormData.set("title", String(formData.get("title") || ""));
      createFormData.set("summary", String(formData.get("summary") || ""));
      createFormData.set("mediaUrl", blob.url);

      setStatusLabel("Saving media");

      const response = await fetch("/api/admin/content/upload", {
        body: createFormData,
        method: "POST",
      });

      window.location.assign(response.url || "/admin/media");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Upload could not be saved.",
      );
      setIsUploading(false);
      setStatusLabel("");
      setProgress(0);
    }
  }

  return (
    <article className="admin-panel">
      <div className="admin-panel-heading">
        <FileUp aria-hidden="true" size={20} />
        <div>
          <p>Upload media</p>
          <h2>Add audio or video reels</h2>
        </div>
      </div>

      <form
        action="/api/admin/content/upload"
        method="post"
        encType="multipart/form-data"
        className="admin-form compact"
        onSubmit={handleSubmit}
      >
        <label>
          <span>Media type</span>
          <select name="kind" required>
            <option value="video_reel">Video Reel</option>
            <option value="audio">Audio</option>
          </select>
        </label>
        <label>
          <span>Title</span>
          <input name="title" required placeholder="Video reel title" />
        </label>
        <label>
          <span>Summary</span>
          <textarea name="summary" placeholder="Short description" rows={3} />
        </label>
        <label>
          <span>File</span>
          <input
            name="file"
            required
            type="file"
            accept="audio/*,video/mp4,video/webm,video/quicktime"
          />
        </label>
        <button className="primary-button" disabled={isUploading} type="submit">
          {isUploading
            ? `${statusLabel || "Uploading"} ${Math.round(progress)}%`
            : "Upload media"}
        </button>
        {error && <p className="form-status is-error">{error}</p>}
      </form>
    </article>
  );
}
