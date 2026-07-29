import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Film,
  Headphones,
  LogOut,
} from "lucide-react";
import { PARTY_NAME } from "@/data/partyContent";
import { getAdminSessionFromCookies } from "@/lib/adminAuth";
import { listContentEntries } from "@/lib/contentRepository";
import type { ContentEntry } from "@/types/party";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
    nocache: true,
  },
  title: "Uploaded Media | Admin",
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
    const isMissingDatabase =
      error instanceof Error && error.message.includes("DATABASE_URL");

    return {
      ...result,
      error: isMissingDatabase
        ? "DATABASE_URL is not configured yet. Set it in .env.local and run database/schema.sql."
        : "Uploaded media could not be loaded.",
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

export default async function AdminMediaPage() {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    redirect("/admin/login");
  }

  const media = await loadMediaData();

  return (
    <main className="admin-route">
      <header className="admin-topbar">
        <div>
          <Link className="admin-back-link" href="/admin">
            <ArrowLeft aria-hidden="true" size={16} />
            Dashboard
          </Link>
          <p className="eyebrow">Protected admin</p>
          <h1>{PARTY_NAME} media</h1>
          <span>
            Review uploaded audio and video reels before or after publishing.
          </span>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="secondary-button dark-button" type="submit">
            <LogOut aria-hidden="true" size={17} />
            Logout
          </button>
        </form>
      </header>

      {media.error && <p className="admin-alert is-error">{media.error}</p>}

      <section className="admin-panel admin-action-panel">
        <div>
          <p className="eyebrow">Need to change an upload?</p>
          <h2>Edit or delete media entries</h2>
          <span>
            Manage titles, summaries, publish status, and replacement media
            files from the content manager.
          </span>
        </div>
        <Link className="secondary-button dark-button" href="/admin/content">
          Open content manager
        </Link>
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
    </main>
  );
}
