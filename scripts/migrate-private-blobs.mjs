import { randomUUID } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { del, head, put } from "@vercel/blob";
import pg from "pg";

const { Pool } = pg;
const applyChanges = process.argv.includes("--apply");
const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

if (applyChanges && !token) {
  throw new Error(
    "A non-empty BLOB_READ_WRITE_TOKEN for a private Blob store is required.",
  );
}

const locations = [
  { column: "value", label: "site_settings.value", table: "site_settings" },
  { column: "pdf_href", label: "books.pdf_href", table: "books" },
  {
    column: "image_src",
    label: "book_pages.image_src",
    table: "book_pages",
  },
  {
    column: "media_url",
    label: "content_entries.media_url",
    table: "content_entries",
  },
  {
    column: "thumbnail_url",
    label: "content_entries.thumbnail_url",
    table: "content_entries",
  },
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

function isLegacyPublicBlobUrl(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".blob.vercel-storage.com") &&
      !url.hostname.includes(".private.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

function migrationPathname(source) {
  const sourceUrl = new URL(source);
  const basename = path.posix.basename(sourceUrl.pathname) || "asset";
  const safeBasename = basename.replace(/[^a-zA-Z0-9._-]+/g, "-");

  return `private-migration/${randomUUID()}/${safeBasename}`;
}

async function findExistingPrivateUrl(source) {
  const candidate = source.replace(
    ".public.blob.vercel-storage.com",
    ".private.blob.vercel-storage.com",
  );

  if (candidate === source) {
    return null;
  }

  try {
    await head(candidate, { token });
    return candidate;
  } catch {
    return null;
  }
}

async function findReferences() {
  const references = [];

  for (const location of locations) {
    const result = await pool.query(
      `select ${location.column} as url, count(*)::int as count
       from ${location.table}
       where ${location.column} like 'https://%.blob.vercel-storage.com/%'
         and ${location.column} not like 'https://%.private.blob.vercel-storage.com/%'
       group by ${location.column}`,
    );

    for (const row of result.rows) {
      if (isLegacyPublicBlobUrl(row.url)) {
        references.push({ ...location, count: row.count, url: row.url });
      }
    }
  }

  return references;
}

const references = await findReferences();
const uniqueUrls = [...new Set(references.map((reference) => reference.url))];

console.log(
  `Found ${references.reduce((total, item) => total + item.count, 0)} database references across ${uniqueUrls.length} unique public Blob files.`,
);

for (const location of locations) {
  const count = references
    .filter((reference) => reference.label === location.label)
    .reduce((total, reference) => total + reference.count, 0);

  console.log(`- ${location.label}: ${count}`);
}

if (!applyChanges || uniqueUrls.length === 0) {
  if (!applyChanges && uniqueUrls.length > 0) {
    console.log(
      "Dry run only. Re-run with --apply and a private-store BLOB_READ_WRITE_TOKEN to migrate.",
    );
  }

  await pool.end();
  process.exit(0);
}

const migratedUrls = new Map();
const createdPrivateUrls = [];

try {
  for (const [index, source] of uniqueUrls.entries()) {
    const existingPrivateUrl = await findExistingPrivateUrl(source);

    if (existingPrivateUrl) {
      migratedUrls.set(source, existingPrivateUrl);
      console.log(`Verified private Blob ${index + 1}/${uniqueUrls.length}.`);
      continue;
    }

    const sourceUrl = new URL(source);
    sourceUrl.searchParams.set("migration", randomUUID());

    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });

    if (!response.ok || !response.body) {
      throw new Error(
        `Could not read public Blob ${index + 1}/${uniqueUrls.length} (${response.status}).`,
      );
    }

    const blob = await put(migrationPathname(source), response.body, {
      access: "private",
      addRandomSuffix: true,
      cacheControlMaxAge: 60,
      contentType: response.headers.get("content-type") || undefined,
      multipart: true,
      token,
    });

    migratedUrls.set(source, blob.url);
    createdPrivateUrls.push(blob.url);
    console.log(`Migrated ${index + 1}/${uniqueUrls.length}.`);
  }

  const client = await pool.connect();

  try {
    await client.query("begin");

    for (const reference of references) {
      const replacement = migratedUrls.get(reference.url);

      if (!replacement) {
        throw new Error("A migrated Blob URL is missing.");
      }

      await client.query(
        `update ${reference.table}
         set ${reference.column} = $1
         where ${reference.column} = $2`,
        [replacement, reference.url],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  console.log(
    `Migration complete. Updated ${references.reduce((total, item) => total + item.count, 0)} database references.`,
  );
} catch (error) {
  if (createdPrivateUrls.length > 0) {
    await del(createdPrivateUrls, { token }).catch(() => undefined);
  }

  throw error;
} finally {
  await pool.end();
}
