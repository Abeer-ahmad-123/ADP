import type { ReactNode } from "react";
import Image from "next/image";
import {
  Film,
  Images,
  Mic2,
  Play,
  Volume2,
} from "lucide-react";
import AudioMessagePlayer from "@/components/AudioMessagePlayer";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VideoReelPlayer from "@/components/VideoReelPlayer";
import { PARTY_LOGO_ALT, PARTY_LOGO_SRC } from "@/data/partyContent";
import type {
  LeadershipProfile,
  GalleryPhoto,
  MediaItem,
  PublicContentItem,
} from "@/types/party";

type PublicArchivePageProps = {
  eyebrow: string;
  title: string;
  copy: string;
  heroKind:
    | "agenda"
    | "announcements"
    | "blogs"
    | "funding"
    | "gallery"
    | "leadership"
    | "manifesto"
    | "media"
    | "news";
  children: ReactNode;
};

const MEDIA_KIND_ORDER: MediaItem["kind"][] = ["Audio", "Video Reel"];

const MEDIA_KIND_DETAILS: Record<
  MediaItem["kind"],
  {
    id: string;
    title: string;
    copy: string;
  }
> = {
  Audio: {
    copy: "Recorded speeches, manifesto chapters, and public listening material.",
    id: "audio",
    title: "Audio",
  },
  "Video Reel": {
    copy: "Public video reels, explainers, activity clips, and briefings.",
    id: "video-reels",
    title: "Video Reels",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function MediaPreview({ item }: { item: MediaItem }) {
  const waveformBars = [44, 72, 36, 88, 58, 96, 50, 78, 42, 68];

  if (item.kind === "Audio") {
    if (item.mediaUrl) {
      return (
        <AudioMessagePlayer
          durationLabel={item.duration || "Audio message"}
          src={item.mediaUrl}
          title={item.title}
        />
      );
    }

    return (
      <div className="media-preview audio-preview">
        <div className="media-preview-top">
          <span>
            <Mic2 aria-hidden="true" size={17} />
          </span>
          <strong>{item.duration || "Audio message"}</strong>
        </div>
        <div className="audio-wave" aria-hidden="true">
          {waveformBars.map((height, index) => (
            <i key={`${item.title}-${index}`} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (item.mediaUrl) {
    return (
      <VideoReelPlayer
        durationLabel={item.duration || "Video reel"}
        poster={item.thumbnailUrl}
        src={item.mediaUrl}
        title={item.title}
      />
    );
  }

  return (
    <div className="media-preview video-preview">
      <div className="video-placeholder-grid" aria-hidden="true" />
      <span className="video-play-mark">
        <Play aria-hidden="true" fill="currentColor" size={20} />
      </span>
      <div className="video-preview-meta">
        <Film aria-hidden="true" size={15} />
        <strong>{item.duration || "Video reel"}</strong>
      </div>
    </div>
  );
}

export function PublicArchivePage({
  children,
  copy,
  eyebrow,
  heroKind,
  title,
}: PublicArchivePageProps) {
  const heroClassName = `section-band public-page-hero-band public-hero-${heroKind}`;

  return (
    <main className="public-page-route">
      <SiteHeader />
      <section className={heroClassName}>
        <div className="section-inner public-page-hero">
          <div className="public-page-hero-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{copy}</p>
          </div>

          <div className="public-hero-visual" aria-hidden="true">
            <div className="public-hero-flag">
              <Image
                alt={PARTY_LOGO_ALT}
                fill
                priority
                sizes="(max-width: 760px) 72vw, 420px"
                src={PARTY_LOGO_SRC}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="section-band public-archive-band">
        <div className="section-inner">{children}</div>
      </section>
      <SiteFooter />
    </main>
  );
}

export function PublicItemGrid({
  emptyLabel,
  items,
}: {
  emptyLabel: string;
  items: PublicContentItem[];
}) {
  if (items.length === 0) {
    return <EmptyArchiveState label={emptyLabel} />;
  }

  return (
    <div className="archive-grid">
      {items.map((item) => (
        <article className="archive-card" key={item.title}>
          <p>{item.meta}</p>
          <h2>{item.title}</h2>
          <span className="preserve-entered-text">{item.summary}</span>
        </article>
      ))}
    </div>
  );
}

function EmptyArchiveState({ label }: { label: string }) {
  return (
    <div className="archive-empty">
      <p>{label}</p>
    </div>
  );
}

export function LeadershipArchive({
  profiles,
}: {
  profiles: LeadershipProfile[];
}) {
  if (profiles.length === 0) {
    return <EmptyArchiveState label="No leadership profiles have been published yet." />;
  }

  return (
    <div className="leadership-archive-grid">
      {profiles.map((profile) => (
        <article className="leadership-profile-card" key={profile.name}>
          <div className="profile-avatar" aria-hidden="true">
            {profile.imageUrl ? (
              <Image
                alt=""
                fill
                sizes="70px"
                src={profile.imageUrl}
              />
            ) : (
              getInitials(profile.name)
            )}
          </div>
          <p>{profile.role}</p>
          <h2>{profile.name}</h2>
          <span className="preserve-entered-text">{profile.summary}</span>
        </article>
      ))}
    </div>
  );
}

export function GalleryArchive({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) {
    return <EmptyArchiveState label="No gallery photos have been published yet." />;
  }

  return (
    <div className="gallery-archive-grid">
      {photos.map((photo, index) => (
        <article className="gallery-photo-card" key={photo.id}>
          <div className="gallery-photo-frame">
            <Image
              alt={photo.title}
              fill
              priority={index < 2}
              sizes="(max-width: 760px) 92vw, (max-width: 1200px) 45vw, 360px"
              src={photo.imageUrl}
            />
          </div>
          <div className="gallery-photo-copy">
            <p>
              <Images aria-hidden="true" size={15} />
              Gallery · {photo.publishedAt}
            </p>
            <h2>{photo.title}</h2>
            <span className="preserve-entered-text">{photo.summary}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function MediaArchive({ items }: { items: MediaItem[] }) {
  return (
    <div className="media-archive">
      {MEDIA_KIND_ORDER.map((kind) => {
        const detail = MEDIA_KIND_DETAILS[kind];
        const kindItems = items.filter((item) => item.kind === kind);

        return (
          <section className="media-kind-section" id={detail.id} key={kind}>
            <div className="media-kind-heading">
              <p>{kind}</p>
              <h2>{detail.title}</h2>
              <span>{detail.copy}</span>
            </div>
            {kindItems.length === 0 ? (
              <EmptyArchiveState label={`No ${detail.title.toLowerCase()} have been published yet.`} />
            ) : (
              <div className="archive-grid compact">
                {kindItems.map((item) => (
                  <article className="archive-card media-card" key={item.title}>
                    <MediaPreview item={item} />
                    <p>
                      {item.kind}
                      {item.speaker ? ` · ${item.speaker}` : ""}
                    </p>
                    <h2>{item.title}</h2>
                    <span className="preserve-entered-text">{item.summary}</span>
                    {!item.mediaUrl && (
                      <div className="media-placeholder-note">
                        <Volume2 aria-hidden="true" size={14} />
                        Placeholder content
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
