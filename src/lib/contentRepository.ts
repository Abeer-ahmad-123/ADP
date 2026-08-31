import type { Pool, PoolClient, QueryResultRow } from "pg";
import { getPool } from "@/lib/postgres";
import type {
  ContentEntry,
  ContentKind,
  GalleryPhoto,
  MediaItem,
} from "@/types/party";

type ContentEntryRow = QueryResultRow & {
  id: number;
  kind: ContentKind;
  title: string;
  summary: string;
  body: string | null;
  person_role: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  published_at: Date | string;
  is_published: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

type CreateContentEntryInput = {
  body: string;
  isPublished: boolean;
  kind: ContentKind;
  mediaUrl: string;
  personRole: string;
  summary: string;
  thumbnailUrl: string;
  title: string;
};

const KIND_LABELS: Record<ContentKind, string> = {
  announcement: "Announcement",
  audio: "Audio",
  blog: "Blog",
  gallery_photo: "Gallery Photo",
  leadership_profile: "Leadership",
  news: "News",
  party_activity: "Activity",
  video_reel: "Video Reel",
};

const CREATE_CONTENT_ENTRY_SQL = `
  insert into content_entries (
    kind,
    title,
    summary,
    body,
    person_role,
    media_url,
    thumbnail_url,
    is_published
  )
  values ($1, $2, $3, $4, $5, $6, $7, $8)
  returning
    id,
    kind,
    title,
    summary,
    body,
    person_role,
    media_url,
    thumbnail_url,
    published_at,
    is_published,
    created_at,
    updated_at
`;

const GALLERY_GROUP_PREFIX = "gallery-group:";

const KIND_HREFS: Record<ContentKind, string> = {
  announcement: "/announcements",
  audio: "/media#audio",
  blog: "/blogs",
  gallery_photo: "/gallery",
  leadership_profile: "/leadership",
  news: "/news",
  party_activity: "/",
  video_reel: "/media#video-reels",
};

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toContentEntry(row: ContentEntryRow): ContentEntry {
  return {
    body: row.body || "",
    createdAt: formatDate(row.created_at),
    id: Number(row.id),
    isPublished: row.is_published,
    kind: row.kind,
    mediaUrl: row.media_url || "",
    personRole: row.person_role || "",
    publishedAt: formatDate(row.published_at),
    summary: row.summary,
    thumbnailUrl: row.thumbnail_url || "",
    title: row.title,
    updatedAt: formatDate(row.updated_at),
  };
}

function getCreateContentEntryParams({
  body,
  isPublished,
  kind,
  mediaUrl,
  personRole,
  summary,
  thumbnailUrl,
  title,
}: CreateContentEntryInput) {
  return [
    kind,
    title,
    summary,
    body || null,
    personRole || null,
    mediaUrl || null,
    thumbnailUrl || null,
    isPublished,
  ];
}

async function insertContentEntry(
  client: Pool | PoolClient,
  entry: CreateContentEntryInput,
) {
  const result = await client.query<ContentEntryRow>(
    CREATE_CONTENT_ENTRY_SQL,
    getCreateContentEntryParams(entry),
  );

  return toContentEntry(result.rows[0]);
}

function getGalleryGroupMetadata(body: string) {
  if (!body.startsWith(GALLERY_GROUP_PREFIX)) {
    return {};
  }

  const [groupId, orderValue] = body.slice(GALLERY_GROUP_PREFIX.length).split(":");
  const groupOrder = Number(orderValue);

  if (!groupId) {
    return {};
  }

  return {
    groupKey: `${GALLERY_GROUP_PREFIX}${groupId}`,
    groupOrder: Number.isFinite(groupOrder) ? groupOrder : 0,
  };
}

export async function listContentEntries(kind?: ContentKind) {
  const pool = getPool();
  const params: unknown[] = [];
  const kindClause = kind ? "where kind = $1" : "";

  if (kind) {
    params.push(kind);
  }

  const result = await pool.query<ContentEntryRow>(
    `
      select
        id,
        kind,
        title,
        summary,
        body,
        person_role,
        media_url,
        thumbnail_url,
        published_at,
        is_published,
        created_at,
        updated_at
      from content_entries
      ${kindClause}
      order by published_at desc, created_at desc
      limit 100
    `,
    params,
  );

  return result.rows.map(toContentEntry);
}

export async function listPublishedContentEntries(kind: ContentKind) {
  const pool = getPool();
  const result = await pool.query<ContentEntryRow>(
    `
      select
        id,
        kind,
        title,
        summary,
        body,
        person_role,
        media_url,
        thumbnail_url,
        published_at,
        is_published,
        created_at,
        updated_at
      from content_entries
      where kind = $1 and is_published = true
      order by published_at desc, created_at desc
      limit 100
    `,
    [kind],
  );

  return result.rows.map(toContentEntry);
}

export async function getContentEntryById(id: number) {
  const pool = getPool();
  const result = await pool.query<ContentEntryRow>(
    `
      select
        id,
        kind,
        title,
        summary,
        body,
        person_role,
        media_url,
        thumbnail_url,
        published_at,
        is_published,
        created_at,
        updated_at
      from content_entries
      where id = $1
      limit 1
    `,
    [id],
  );
  const row = result.rows[0];

  return row ? toContentEntry(row) : null;
}

export async function createContentEntry({
  body,
  isPublished,
  kind,
  mediaUrl,
  personRole,
  summary,
  thumbnailUrl,
  title,
}: CreateContentEntryInput) {
  const pool = getPool();

  return insertContentEntry(pool, {
    body,
    isPublished,
    kind,
    mediaUrl,
    personRole,
    summary,
    thumbnailUrl,
    title,
  });
}

export async function createContentEntries(entries: CreateContentEntryInput[]) {
  const pool = getPool();
  const client = await pool.connect();
  const created: ContentEntry[] = [];

  try {
    await client.query("begin");

    for (const entry of entries) {
      created.push(await insertContentEntry(client, entry));
    }

    await client.query("commit");

    return created;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateContentEntry({
  body,
  id,
  isPublished,
  mediaUrl,
  personRole,
  summary,
  thumbnailUrl,
  title,
}: {
  body: string;
  id: number;
  isPublished: boolean;
  mediaUrl: string;
  personRole: string;
  summary: string;
  thumbnailUrl: string;
  title: string;
}) {
  const pool = getPool();
  const result = await pool.query<ContentEntryRow>(
    `
      update content_entries
      set
        title = $1,
        summary = $2,
        body = $3,
        person_role = $4,
        media_url = $5,
        thumbnail_url = $6,
        is_published = $7,
        updated_at = now()
      where id = $8
      returning
        id,
        kind,
        title,
        summary,
        body,
        person_role,
        media_url,
        thumbnail_url,
        published_at,
        is_published,
        created_at,
        updated_at
    `,
    [
      title,
      summary,
      body || null,
      personRole || null,
      mediaUrl || null,
      thumbnailUrl || null,
      isPublished,
      id,
    ],
  );
  const row = result.rows[0];

  return row ? toContentEntry(row) : null;
}

export async function deleteContentEntry(id: number) {
  const pool = getPool();
  const result = await pool.query(
    `
      delete from content_entries
      where id = $1
    `,
    [id],
  );

  return (result.rowCount || 0) > 0;
}

export async function getPublicContentItems(
  kind: ContentKind,
) {
  try {
    const entries = await listPublishedContentEntries(kind);

    return entries.map((entry) => ({
      href: entry.mediaUrl || KIND_HREFS[entry.kind],
      meta: `${KIND_LABELS[entry.kind]} · ${entry.publishedAt}`,
      summary: entry.summary,
      title: entry.title,
    }));
  } catch {
    return [];
  }
}

export async function getPublicLeadershipProfiles() {
  try {
    const entries = await listPublishedContentEntries("leadership_profile");

    return entries.map((entry) => ({
      imageUrl: entry.thumbnailUrl,
      name: entry.title,
      role: entry.personRole || "Leadership",
      summary: entry.summary,
    }));
  } catch {
    return [];
  }
}

export async function getPublicMediaItems() {
  try {
    const entries = [
      ...(await listPublishedContentEntries("audio")),
      ...(await listPublishedContentEntries("video_reel")),
    ];

    return entries.map((entry) => ({
      kind: entry.kind === "audio" ? "Audio" : "Video Reel",
      mediaUrl: entry.mediaUrl,
      speaker: entry.personRole || undefined,
      summary: entry.summary,
      thumbnailUrl: entry.thumbnailUrl,
      title: entry.title,
    })) satisfies MediaItem[];
  } catch {
    return [];
  }
}

export async function getPublicGalleryPhotos() {
  try {
    const entries = await listPublishedContentEntries("gallery_photo");

    return entries
      .filter((entry) => entry.mediaUrl)
      .map((entry) => ({
        ...getGalleryGroupMetadata(entry.body),
        id: entry.id,
        imageUrl: entry.mediaUrl,
        publishedAt: entry.publishedAt,
        summary: entry.summary,
        title: entry.title,
      })) satisfies GalleryPhoto[];
  } catch {
    return [];
  }
}

export async function getLatestAnnouncement() {
  try {
    const entries = await listPublishedContentEntries("announcement");
    const first = entries[0];

    if (!first) {
      return undefined;
    }

    return {
      href: "/announcements",
      meta: `${KIND_LABELS[first.kind]} · ${first.publishedAt}`,
      summary: first.summary,
      title: first.title,
    };
  } catch {
    return undefined;
  }
}
