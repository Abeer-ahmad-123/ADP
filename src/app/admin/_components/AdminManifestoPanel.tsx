import Link from "next/link";
import { ScrollText } from "lucide-react";
import type { ManifestoDocument } from "@/lib/manifestoRepository";

export default function AdminManifestoPanel({
  manifesto,
}: {
  manifesto: ManifestoDocument;
}) {
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
            required={!manifesto.pdfHref}
            type="file"
            accept="application/pdf,.pdf"
          />
        </label>
        <button className="primary-button" type="submit">
          Update manifesto
        </button>
      </form>
    </section>
  );
}
