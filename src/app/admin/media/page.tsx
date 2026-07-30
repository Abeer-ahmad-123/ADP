import type { Metadata } from "next";
import Link from "next/link";
import {
  Edit3,
  ExternalLink,
  Film,
  Headphones,
} from "lucide-react";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminMediaUploadForm from "@/app/admin/_components/AdminMediaUploadForm";
import { listContentEntries } from "@/lib/contentRepository";
import {
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
  type AdminSearchParams,
} from "@/lib/adminPage";
import type { ContentEntry } from "@/types/party";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media",
};

async function loadMediaData() {
  const result: {
    audio: ContentEntry[];
    error: string;
    videoReels: ContentEntry[];
  } = {
    audio: [],
    error: "",
    videoReels: [],
  };

  try {
    const [audio, videoReels] = await Promise.all([
      listContentEntries("audio"),
      listContentEntries("video_reel"),
    ]);

    return {
      ...result,
      audio,
      videoReels,
    };
  } catch (error) {
    return {
      ...result,
      error: getAdminLoadError(error, "Uploaded media could not be loaded."),
    };
  }
}

function MediaPreview({ entry }: { entry: ContentEntry }) {
  if (!entry.mediaUrl) {
    return <p className="admin-muted">No uploaded file is attached.</p>;
  }

  if (entry.kind === "audio") {
    return (
      <audio controls preload="metadata" src={entry.mediaUrl}>
        <a href={entry.mediaUrl}>Open audio file</a>
      </audio>
    );
  }

  return (
    <video
      controls
      playsInline
      poster={entry.thumbnailUrl || undefined}
      preload="metadata"
      src={entry.mediaUrl}
    >
      <a href={entry.mediaUrl}>Open video file</a>
    </video>
  );
}

function AdminMediaSection({
  entries,
  kind,
  summary,
  title,
}: {
  entries: ContentEntry[];
  kind: "audio" | "video";
  summary: string;
  title: string;
}) {
  const Icon = kind === "audio" ? Headphones : Film;
  const contentKind = kind === "audio" ? "audio" : "video_reel";
  const managerHref = `/admin/content?kind=${contentKind}`;

  return (
    <section className="admin-panel">
      <div className="admin-table-heading">
        <div className="admin-heading-with-icon">
          <Icon aria-hidden="true" size={20} />
          <div>
            <p>{kind === "audio" ? "Audio messages" : "Video reels"}</p>
            <h2>{title}</h2>
            <span>{summary}</span>
          </div>
        </div>
        <span className="admin-count-pill">{entries.length} uploaded</span>
      </div>

      {entries.length > 0 ? (
        <div className="admin-media-list">
          {entries.map((entry) => (
            <article className="admin-media-card" key={entry.id}>
              <div className="admin-media-player">
                <MediaPreview entry={entry} />
              </div>
              <div className="admin-media-details">
                <div>
                  <span
                    className={`admin-status-pill${
                      entry.isPublished ? " is-published" : ""
                    }`}
                  >
                    {entry.isPublished ? "Published" : "Draft"}
                  </span>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                </div>
                <dl className="admin-media-meta">
                  <div>
                    <dt>Published</dt>
                    <dd>{entry.publishedAt}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{entry.updatedAt}</dd>
                  </div>
                </dl>
                {entry.mediaUrl && (
                  <a
                    className="admin-file-link"
                    href={entry.mediaUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open uploaded file
                    <ExternalLink aria-hidden="true" size={15} />
                  </a>
                )}
                <Link
                  className="admin-file-link"
                  href={`${managerHref}#entry-${entry.id}`}
                >
                  Manage entry
                  <Edit3 aria-hidden="true" size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="admin-empty-state">
          No {kind === "audio" ? "audio messages" : "video reels"} have been
          uploaded yet.
        </p>
      )}
    </section>
  );
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const media = await loadMediaData();

  return (
    <AdminChrome
      description="Upload and review audio messages and video reels."
      error={media.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Media"
    >
      <AdminMediaUploadForm />

      <section className="admin-panel admin-action-panel">
        <div>
          <p className="eyebrow">Need to change an upload?</p>
          <h2>Edit or delete media entries</h2>
          <span>
            Manage titles, summaries, publish status, and replacement media
            files from the content manager.
          </span>
        </div>
        <div className="admin-panel-actions">
          <Link
            className="secondary-button dark-button"
            href="/admin/content?kind=audio"
          >
            <Headphones aria-hidden="true" size={17} />
            Manage audio
          </Link>
          <Link
            className="secondary-button dark-button"
            href="/admin/content?kind=video_reel"
          >
            <Film aria-hidden="true" size={17} />
            Manage videos
          </Link>
        </div>
      </section>

      <section className="admin-stat-grid admin-media-stats">
        <article>
          <span>Audio messages</span>
          <strong>{media.audio.length}</strong>
          <p>Uploaded audio items stored for the public media page.</p>
        </article>
        <article>
          <span>Video reels</span>
          <strong>{media.videoReels.length}</strong>
          <p>Uploaded reels available for public visitors without login.</p>
        </article>
      </section>

      <AdminMediaSection
        entries={media.videoReels}
        kind="video"
        summary="Playable uploaded reels, ordered newest first."
        title="Uploaded video reels"
      />

      <AdminMediaSection
        entries={media.audio}
        kind="audio"
        summary="Playable uploaded audio messages, ordered newest first."
        title="Uploaded audio messages"
      />
    </AdminChrome>
  );
}
