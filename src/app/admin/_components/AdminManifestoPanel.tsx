"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { ManifestoDocument } from "@/lib/manifestoRepository";

const MAX_MANIFESTO_UPLOAD_BYTES = 40 * 1024 * 1024;

function sanitizeFilename(value: string) {
  const fallback = "manifesto.pdf";
  const parts = (value || fallback).split(".");
  const extension = parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : ".pdf";
  const name =
    parts
      .join(".")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "manifesto";

  return `${name}${extension === ".pdf" ? extension : ".pdf"}`;
}

function isFilledPdf(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export default function AdminManifestoPanel({
  manifesto,
}: {
  manifesto: ManifestoDocument;
}) {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [statusLabel, setStatusLabel] = useState("");
  const hasExistingPdf = Boolean(manifesto.pdfHref);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    const hasNewFile = isFilledPdf(file);

    if (!hasExistingPdf && !hasNewFile) {
      setError("Choose a PDF file before updating the manifesto.");
      return;
    }

    if (hasNewFile && file.size > MAX_MANIFESTO_UPLOAD_BYTES) {
      setError("Manifesto PDFs must be 40 MB or smaller.");
      return;
    }

    setError("");
    setProgress(hasNewFile ? 1 : 0);
    setIsUploading(true);
    setStatusLabel(hasNewFile ? "Preparing upload" : "Saving manifesto");

    try {
      const updateFormData = new FormData();
      updateFormData.set("title", String(formData.get("title") || ""));
      updateFormData.set("summary", String(formData.get("summary") || ""));

      if (hasNewFile) {
        const blob = await upload(
          `manifesto/${Date.now()}-${sanitizeFilename(file.name)}`,
          file,
          {
            access: "public",
            contentType: file.type || "application/pdf",
            handleUploadUrl: "/api/admin/manifesto/blob-upload",
            onUploadProgress: (event) => {
              setStatusLabel("Uploading PDF");
              setProgress(event.percentage);
            },
          },
        );

        updateFormData.set("pdfHref", blob.url);
      }

      setStatusLabel("Extracting text");

      const response = await fetch("/api/admin/manifesto", {
        body: updateFormData,
        method: "POST",
      });

      window.location.assign(response.url || "/admin/manifesto");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Manifesto PDF could not be updated.",
      );
      setIsUploading(false);
      setStatusLabel("");
      setProgress(0);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading" id="manifesto">
        <ScrollText aria-hidden="true" size={20} />
        <div>
          <p>Manifesto PDF</p>
          <h2>Update public manifesto</h2>
        </div>
      </div>

      <div className="admin-current-document">
        <div>
          <span>Current manifesto</span>
          <strong>{manifesto.title || "No manifesto uploaded yet"}</strong>
          <p>
            {manifesto.summary ||
              "Upload a manifesto PDF to show readable text on the public manifesto page."}
          </p>
          <small>
            {manifesto.text
              ? "Readable manifesto text is available."
              : "Readable manifesto text has not been extracted yet."}
          </small>
          {manifesto.updatedAt && <small>Last updated {manifesto.updatedAt}</small>}
        </div>
        {manifesto.pdfHref && (
          <Link href={manifesto.pdfHref} target="_blank">
            Open PDF
          </Link>
        )}
      </div>

      <form
        action="/api/admin/manifesto"
        method="post"
        encType="multipart/form-data"
        className="admin-form compact"
        onSubmit={handleSubmit}
      >
        <label>
          <span>Manifesto title</span>
          <input
            name="title"
            required
            defaultValue={manifesto.title}
            placeholder="Awam Dost Party Manifesto"
          />
        </label>
        <label>
          <span>Summary</span>
          <textarea
            name="summary"
            required
            defaultValue={manifesto.summary}
            placeholder="A pragmatic manifesto for Pakistan, built around public service and measurable commitments."
            rows={3}
          />
        </label>
        <label>
          <span>{manifesto.pdfHref ? "Replace manifesto PDF" : "Manifesto PDF"}</span>
          <input
            name="file"
            required={!hasExistingPdf}
            type="file"
            accept="application/pdf,.pdf"
          />
        </label>
        <button className="primary-button" disabled={isUploading} type="submit">
          {isUploading
            ? `${statusLabel || "Updating"} ${Math.round(progress)}%`
            : "Update manifesto"}
        </button>
        {error && <p className="form-status is-error">{error}</p>}
      </form>
    </section>
  );
}
