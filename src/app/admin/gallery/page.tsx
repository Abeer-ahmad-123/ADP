import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminGalleryUploadForm from "@/app/admin/_components/AdminGalleryUploadForm";
import { listContentEntries } from "@/lib/contentRepository";
import {
  type AdminSearchParams,
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";
import type { ContentEntry } from "@/types/party";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photo Gallery",
};

async function loadGalleryData() {
  const result: {
    error: string;
    photos: ContentEntry[];
  } = {
    error: "",
    photos: [],
  };

  try {
    return {
      ...result,
      photos: await listContentEntries("gallery_photo"),
    };
  } catch (error) {
    return {
      ...result,
      error: getAdminLoadError(error, "Gallery photos could not be loaded."),
    };
  }
}

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const data = await loadGalleryData();
  const publishedCount = data.photos.filter((photo) => photo.isPublished).length;

  return (
    <AdminChrome
      description="Upload and review public gallery photos."
      error={data.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Photo gallery"
    >
      <section className="admin-stat-grid admin-media-stats">
        <article>
          <span>Total photos</span>
          <strong>{data.photos.length}</strong>
          <p>All gallery photo entries stored for the website.</p>
        </article>
        <article>
          <span>Published</span>
          <strong>{publishedCount}</strong>
          <p>Photos visible on the public gallery page.</p>
        </article>
      </section>

      <AdminGalleryUploadForm />

      <section className="admin-panel admin-action-panel">
        <div>
          <p className="eyebrow">Need changes?</p>
          <h2>Edit or delete gallery photos</h2>
          <span>
            Use the content manager to update titles, captions, publish status,
            replacement images, or delete gallery entries.
          </span>
        </div>
        <Link className="secondary-button dark-button" href="/admin/content">
          <FileText aria-hidden="true" size={17} />
          Manage gallery entries
        </Link>
      </section>

      <section className="admin-panel">
        <div className="admin-table-heading">
          <div>
            <p>Photo gallery</p>
            <h2>Uploaded photos</h2>
            <span>Newest gallery images appear first.</span>
          </div>
          <Link className="admin-file-link" href="/gallery" target="_blank">
            Public gallery
            <ExternalLink aria-hidden="true" size={15} />
          </Link>
        </div>

        {data.photos.length > 0 ? (
          <div className="admin-gallery-list">
            {data.photos.map((photo) => (
              <article className="admin-gallery-card" key={photo.id}>
                <div className="admin-gallery-preview">
                  {photo.mediaUrl ? (
                    <Image
                      alt={photo.title}
                      height={360}
                      sizes="(max-width: 760px) 90vw, 360px"
                      src={photo.mediaUrl}
                      width={480}
                    />
                  ) : (
                    <span>No image file</span>
                  )}
                </div>
                <div>
                  <span
                    className={`admin-status-pill${
                      photo.isPublished ? " is-published" : ""
                    }`}
                  >
                    {photo.isPublished ? "Published" : "Draft"}
                  </span>
                  <h3>{photo.title}</h3>
                  <p>{photo.summary}</p>
                  <Link
                    className="admin-file-link"
                    href={`/admin/content#entry-${photo.id}`}
                  >
                    Manage photo
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty-state">No gallery photos have been uploaded yet.</p>
        )}
      </section>
    </AdminChrome>
  );
}
