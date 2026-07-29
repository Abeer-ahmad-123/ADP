import type { Metadata } from "next";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminManifestoPanel from "@/app/admin/_components/AdminManifestoPanel";
import { getManifestoDocument } from "@/lib/manifestoRepository";
import {
  type AdminSearchParams,
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manifesto",
};

async function loadManifestoData() {
  try {
    return {
      error: "",
      manifesto: await getManifestoDocument(),
    };
  } catch (error) {
    return {
      error: getAdminLoadError(error, "Manifesto data could not be loaded."),
      manifesto: {
        pdfHref: "",
        summary: "",
        text: "",
        title: "",
        updatedAt: "",
      },
    };
  }
}

export default async function AdminManifestoPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const data = await loadManifestoData();

  return (
    <AdminChrome
      description="Replace the public manifesto PDF and refresh extracted readable text."
      error={data.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Manifesto"
    >
      <section className="admin-stat-grid admin-media-stats">
        <article>
          <span>PDF</span>
          <strong>{data.manifesto.pdfHref ? "Ready" : "No"}</strong>
          <p>Latest manifesto PDF stored for admin record.</p>
        </article>
        <article>
          <span>Readable text</span>
          <strong>{data.manifesto.text ? "Ready" : "No"}</strong>
          <p>Public manifesto page renders this extracted text.</p>
        </article>
      </section>

      <AdminManifestoPanel manifesto={data.manifesto} />
    </AdminChrome>
  );
}
