import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Edit3,
  ExternalLink,
  FileText,
} from "lucide-react";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminDeleteContentForm from "@/components/AdminDeleteContentForm";
import { listContentEntries } from "@/lib/contentRepository";
import {
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
  type AdminSearchParams,
} from "@/lib/adminPage";
import type { ContentEntry, ContentKind } from "@/types/party";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Content",
};

const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  announcement: "Announcement",
  audio: "Audio",
  blog: "Blog",
  gallery_photo: "Gallery Photo",
  leadership_profile: "Leadership Profile",
  news: "News",
  party_activity: "Activity",
  video_reel: "Video Reel",
};

const PUBLIC_KIND_HREFS: Record<ContentKind, string> = {
  announcement: "/announcements",
  audio: "/media#audio",
  blog: "/blogs",
  gallery_photo: "/gallery",
  leadership_profile: "/leadership",
  news: "/news",
  party_activity: "/",
  video_reel: "/media#video-reels",
};

async function loadContentData() {
  const result: {
    entries: ContentEntry[];
    error: string;
  } = {
    entries: [],
    error: "",
  };

  try {
    return {
      ...result,
      entries: await listContentEntries(),
    };
  } catch (error) {
    return {
      ...result,
      error: getAdminLoadError(error, "Content entries could not be loaded."),
    };
  }
}

function isMediaEntry(entry: ContentEntry) {
  return entry.kind === "audio" || entry.kind === "video_reel";
}

function getMediaAccept(kind: ContentKind) {
  if (kind === "audio") {
    return "audio/*";
  }

  if (kind === "video_reel") {
    return "video/mp4,video/webm,video/quicktime";
  }

  if (kind === "gallery_photo") {
    return "image/png,image/jpeg,image/webp,image/gif";
  }

  return undefined;
}

function getUploadLabel(kind: ContentKind) {
  if (kind === "gallery_photo") {
    return "Replace gallery image";
  }

  return "Replace uploaded file";
}

function getContentCounts(entries: ContentEntry[]) {
  return {
    announcements: entries.filter((entry) => entry.kind === "announcement").length,
    gallery: entries.filter((entry) => entry.kind === "gallery_photo").length,
    media: entries.filter(isMediaEntry).length,
    published: entries.filter((entry) => entry.isPublished).length,
    written: entries.filter(
      (entry) => entry.kind === "blog" || entry.kind === "news",
    ).length,
  };
}

function ContentEntryCard({ entry }: { entry: ContentEntry }) {
  const requiresBody = entry.kind === "blog";
  const requiresRole = entry.kind === "leadership_profile";
  const mediaAccept = getMediaAccept(entry.kind);

  return (
    <article className="admin-content-card" id={`entry-${entry.id}`}>
      <div className="admin-content-card-header">
        <div>
          <span className="admin-kind-pill">
            {CONTENT_KIND_LABELS[entry.kind]}
          </span>
          <span
            className={`admin-status-pill${
              entry.isPublished ? " is-published" : ""
            }`}
          >
            {entry.isPublished ? "Published" : "Draft"}
          </span>
          <h2>{entry.title}</h2>
          <p>{entry.summary}</p>
        </div>
        <Link
          className="admin-file-link"
          href={PUBLIC_KIND_HREFS[entry.kind]}
          target="_blank"
        >
          Public page
          <ExternalLink aria-hidden="true" size={15} />
        </Link>
      </div>

      <dl className="admin-content-meta">
        <div>
          <dt>Published</dt>
          <dd>{entry.publishedAt}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{entry.updatedAt}</dd>
        </div>
        {requiresRole && (
          <div>
            <dt>Role</dt>
            <dd>{entry.personRole}</dd>
          </div>
        )}
        {entry.mediaUrl && (
          <div>
            <dt>Uploaded file</dt>
            <dd>
              <a href={entry.mediaUrl} rel="noreferrer" target="_blank">
                Open file
              </a>
            </dd>
          </div>
        )}
        {entry.thumbnailUrl && (
          <div>
            <dt>Image</dt>
            <dd>
              <a href={entry.thumbnailUrl} rel="noreferrer" target="_blank">
                Open image
              </a>
            </dd>
          </div>
        )}
      </dl>

      {entry.mediaUrl && (
        <div className="admin-content-preview">
          {entry.kind === "audio" ? (
            <audio controls preload="metadata" src={entry.mediaUrl}>
              <a href={entry.mediaUrl}>Open audio file</a>
            </audio>
          ) : entry.kind === "gallery_photo" ? (
            <Image
              alt={entry.title}
              className="admin-content-image-preview"
              height={620}
              sizes="(max-width: 920px) 90vw, 980px"
              src={entry.mediaUrl}
              width={980}
            />
          ) : (
            <video
              controls
              playsInline
              poster={entry.thumbnailUrl || undefined}
              preload="metadata"
              src={entry.mediaUrl}
            >
              <a href={entry.mediaUrl}>Open video file</a>
            </video>
          )}
        </div>
      )}

      <div className="admin-management-actions">
        <details className="admin-edit-details">
          <summary aria-label={`Edit ${entry.title}`} title="Edit entry">
            <Edit3 aria-hidden="true" size={16} />
          </summary>

          <form
            action="/api/admin/content/manage"
            method="post"
            encType="multipart/form-data"
            className="admin-form admin-edit-form"
          >
            <input name="intent" type="hidden" value="update" />
            <input name="id" type="hidden" value={entry.id} />

            <div className="admin-edit-form-grid">
              <label>
                <span>Title</span>
                <input name="title" required defaultValue={entry.title} />
              </label>

              {requiresRole && (
                <label>
                  <span>Leadership role</span>
                  <input
                    name="personRole"
                    required
                    defaultValue={entry.personRole}
                  />
                </label>
              )}

              <label className="wide-field">
                <span>Summary</span>
                <textarea
                  name="summary"
                  required
                  rows={3}
                  defaultValue={entry.summary}
                />
              </label>

              {requiresBody && (
                <label className="wide-field">
                  <span>Blog body</span>
                  <textarea
                    name="body"
                    required
                    rows={7}
                    defaultValue={entry.body}
                  />
                </label>
              )}

              {mediaAccept && (
                <label className="wide-field">
                  <span>{getUploadLabel(entry.kind)}</span>
                  <input name="mediaFile" type="file" accept={mediaAccept} />
                </label>
              )}

              {requiresRole && (
                <label className="wide-field">
                  <span>Replace profile image</span>
                  <input
                    name="profileImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                  />
                </label>
              )}
            </div>

            <label className="admin-check">
              <input
                name="isPublished"
                type="checkbox"
                defaultChecked={entry.isPublished}
              />
              <span>Show this entry on the public website</span>
            </label>

            <button className="primary-button" type="submit">
              Save changes
            </button>
          </form>
        </details>

        <AdminDeleteContentForm id={entry.id} title={entry.title} />
      </div>
    </article>
  );
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const content = await loadContentData();
  const counts = getContentCounts(content.entries);

  return (
    <AdminChrome
      description="Edit or delete saved news, blogs, announcements, leadership profiles, gallery photos, audio, and video reels."
      error={content.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Manage content"
    >
      <section className="admin-stat-grid">
        <article>
          <span>Published</span>
          <strong>{counts.published}</strong>
          <p>Entries currently visible on public pages.</p>
        </article>
        <article>
          <span>News and blogs</span>
          <strong>{counts.written}</strong>
          <p>Written updates available in archive pages.</p>
        </article>
        <article>
          <span>Announcements</span>
          <strong>{counts.announcements}</strong>
          <p>Public notices and popup announcement source.</p>
        </article>
        <article>
          <span>Media</span>
          <strong>{counts.media}</strong>
          <p>Audio messages and video reels stored online.</p>
        </article>
        <article>
          <span>Gallery</span>
          <strong>{counts.gallery}</strong>
          <p>Public photo gallery images stored online.</p>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-table-heading">
          <div className="admin-heading-with-icon">
            <FileText aria-hidden="true" size={20} />
            <div>
              <p>Saved entries</p>
              <h2>Edit or delete public content</h2>
              <span>
                New uploads stay unchanged unless you choose a replacement file.
              </span>
            </div>
          </div>
          <span className="admin-count-pill">
            {content.entries.length} total
          </span>
        </div>

        {content.entries.length > 0 ? (
          <div className="admin-content-list">
            {content.entries.map((entry) => (
              <ContentEntryCard entry={entry} key={entry.id} />
            ))}
          </div>
        ) : (
          <p className="admin-empty-state">No content entries are stored yet.</p>
        )}
      </section>
    </AdminChrome>
  );
}
