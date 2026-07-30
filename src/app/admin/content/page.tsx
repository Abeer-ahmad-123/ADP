import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Edit3,
  ExternalLink,
  FileText,
  PlusCircle,
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

const CONTENT_MANAGER_SECTIONS = [
  {
    createHref: "/admin/publish?kind=news",
    createLabel: "Create news",
    kind: "news",
    managerTitle: "news entries",
    summary: "Public updates and press-style posts.",
  },
  {
    createHref: "/admin/publish?kind=blog",
    createLabel: "Create blog",
    kind: "blog",
    managerTitle: "blog posts",
    summary: "Longer notes, policy explanations, and opinion posts.",
  },
  {
    createHref: "/admin/publish?kind=announcement",
    createLabel: "Create announcement",
    kind: "announcement",
    managerTitle: "announcements",
    summary: "Popup notices and public announcement archive entries.",
  },
  {
    createHref: "/admin/publish?kind=leadership_profile",
    createLabel: "Create profile",
    kind: "leadership_profile",
    managerTitle: "leadership profiles",
    summary: "Public team profiles and leadership page records.",
  },
  {
    createHref: "/admin/gallery",
    createLabel: "Upload photo",
    kind: "gallery_photo",
    managerTitle: "gallery photos",
    summary: "Photo gallery images, captions, and publish status.",
  },
  {
    createHref: "/admin/media",
    createLabel: "Upload audio",
    kind: "audio",
    managerTitle: "audio messages",
    summary: "Audio uploads shown on the public media page.",
  },
  {
    createHref: "/admin/media",
    createLabel: "Upload video",
    kind: "video_reel",
    managerTitle: "video reels",
    summary: "Video uploads shown on the public media page.",
  },
  {
    kind: "party_activity",
    managerTitle: "party activities",
    summary: "Activity entries used by public website sections.",
  },
] satisfies Array<{
  createHref?: string;
  createLabel?: string;
  kind: ContentKind;
  managerTitle: string;
  summary: string;
}>;

const DEFAULT_CONTENT_KIND: ContentKind = "news";

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

function getContentManagerHref(kind: ContentKind) {
  return `/admin/content?kind=${kind}`;
}

function isManagedContentKind(kind: string): kind is ContentKind {
  return CONTENT_MANAGER_SECTIONS.some((section) => section.kind === kind);
}

function getSelectedContentKind(kind?: string) {
  return kind && isManagedContentKind(kind) ? kind : DEFAULT_CONTENT_KIND;
}

function getContentManagerSection(kind: ContentKind) {
  return (
    CONTENT_MANAGER_SECTIONS.find((section) => section.kind === kind) ||
    CONTENT_MANAGER_SECTIONS[0]
  );
}

function getKindCount(entries: ContentEntry[], kind: ContentKind) {
  return entries.filter((entry) => entry.kind === kind).length;
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
            <input name="kind" type="hidden" value={entry.kind} />

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

        <AdminDeleteContentForm
          id={entry.id}
          kind={entry.kind}
          title={entry.title}
        />
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
  const selectedKind = getSelectedContentKind(params.kind);
  const selectedSection = getContentManagerSection(selectedKind);
  const selectedEntries = content.entries.filter(
    (entry) => entry.kind === selectedKind,
  );

  return (
    <AdminChrome
      description="Edit or delete saved news, blogs, announcements, leadership profiles, gallery photos, audio, video reels, and activities."
      error={content.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Manage content"
    >
      <section className="admin-content-type-grid" aria-label="Content types">
        {CONTENT_MANAGER_SECTIONS.map((section) => {
          const isActive = section.kind === selectedKind;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`admin-content-type-card${
                isActive ? " is-active" : ""
              }`}
              href={getContentManagerHref(section.kind)}
              key={section.kind}
            >
              <span>{CONTENT_KIND_LABELS[section.kind]}</span>
              <strong>{getKindCount(content.entries, section.kind)}</strong>
              <p>{section.summary}</p>
            </Link>
          );
        })}
      </section>

      <section className="admin-panel">
        <div className="admin-table-heading">
          <div className="admin-heading-with-icon">
            <FileText aria-hidden="true" size={20} />
            <div>
              <p>{CONTENT_KIND_LABELS[selectedKind]}</p>
              <h2>Edit or delete {selectedSection.managerTitle}</h2>
              <span>
                {selectedSection.summary} New uploads stay unchanged unless you
                choose a replacement file.
              </span>
            </div>
          </div>
          <div className="admin-content-heading-actions">
            <span className="admin-count-pill">
              {selectedEntries.length} total
            </span>
            {selectedSection.createLabel && selectedSection.createHref && (
              <Link
                className="secondary-button dark-button"
                href={selectedSection.createHref}
              >
                <PlusCircle aria-hidden="true" size={17} />
                {selectedSection.createLabel}
              </Link>
            )}
          </div>
        </div>

        {selectedEntries.length > 0 ? (
          <div className="admin-content-list">
            {selectedEntries.map((entry) => (
              <ContentEntryCard entry={entry} key={entry.id} />
            ))}
          </div>
        ) : (
          <p className="admin-empty-state">
            No {selectedSection.managerTitle} are stored yet.
          </p>
        )}
      </section>
    </AdminChrome>
  );
}
