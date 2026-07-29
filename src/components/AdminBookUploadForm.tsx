"use client";

import { upload } from "@vercel/blob/client";
import { type FormEvent, useState } from "react";

const MAX_BOOK_UPLOAD_BYTES = 40 * 1024 * 1024;

function sanitizeFilename(value: string) {
  const fallback = "book.pdf";
  const parts = (value || fallback).split(".");
  const extension = parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : ".pdf";
  const name =
    parts
      .join(".")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "book";

  return `${name}${extension === ".pdf" ? extension : ".pdf"}`;
}

function isFilledPdf(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export default function AdminBookUploadForm() {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  async function submitBookForm(formData: FormData) {
    const response = await fetch("/api/admin/book/upload", {
      body: formData,
      method: "POST",
    });

    window.location.assign(response.url || "/admin");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!isFilledPdf(file)) {
      setError("Choose a PDF file before uploading.");
      return;
    }

    if (file.size > MAX_BOOK_UPLOAD_BYTES) {
      setError("Book PDFs must be 40 MB or smaller.");
      return;
    }

    setError("");
    setProgress(0);
    setIsUploading(true);

    try {
      const blob = await upload(
        `book/${Date.now()}-${sanitizeFilename(file.name)}`,
        file,
        {
          access: "public",
          contentType: file.type || "application/pdf",
          handleUploadUrl: "/api/admin/book/blob-upload",
          multipart: true,
          onUploadProgress: (event) => {
            setProgress(event.percentage);
          },
        },
      );

      const createFormData = new FormData();
      createFormData.set("title", String(formData.get("title") || ""));
      createFormData.set("subtitle", String(formData.get("subtitle") || ""));
      createFormData.set("author", String(formData.get("author") || ""));
      createFormData.set("pdfHref", blob.url);

      await submitBookForm(createFormData);
    } catch (error) {
      try {
        await submitBookForm(formData);
      } catch {
        setError(
          error instanceof Error
            ? error.message
            : "Book PDF could not be uploaded.",
        );
        setIsUploading(false);
      }
    }
  }

  return (
    <form
      action="/api/admin/book/upload"
      method="post"
      encType="multipart/form-data"
      className="admin-form compact"
      onSubmit={handleSubmit}
    >
      <label>
        <span>Book title</span>
        <input name="title" required placeholder="Book title" />
      </label>
      <label>
        <span>Subtitle</span>
        <textarea name="subtitle" required placeholder="Book subtitle" rows={3} />
      </label>
      <label>
        <span>Author</span>
        <input name="author" required placeholder="Book author" />
      </label>
      <label>
        <span>PDF file</span>
        <input name="file" required type="file" accept="application/pdf,.pdf" />
      </label>
      <button className="primary-button" disabled={isUploading} type="submit">
        {isUploading ? `Uploading ${Math.round(progress)}%` : "Upload book"}
      </button>
      {error && <p className="form-status is-error">{error}</p>}
    </form>
  );
}
