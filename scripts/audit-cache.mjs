import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const sourceRoots = ["src", "public", "next.config.ts"];
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const failures = [];

async function collectSourceFiles(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const entries = await readdir(absolutePath, { withFileTypes: true }).catch(
    () => null,
  );

  if (!entries) {
    return sourceExtensions.has(path.extname(relativePath)) ? [relativePath] : [];
  }

  const files = [];

  for (const entry of entries) {
    const childPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(childPath)));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(childPath);
    }
  }

  return files;
}

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function reportMatches(relativePath, source, label, pattern) {
  for (const match of source.matchAll(pattern)) {
    failures.push(
      `${relativePath}:${lineNumber(source, match.index ?? 0)} ${label}`,
    );
  }
}

const files = (await Promise.all(sourceRoots.map(collectSourceFiles))).flat();
const sources = new Map();

for (const relativePath of files) {
  const source = await readFile(path.join(projectRoot, relativePath), "utf8");
  sources.set(relativePath, source);

  reportMatches(relativePath, source, "uses Next/React data caching", /\b(?:unstable_cache|cacheLife|cacheTag|revalidateTag|revalidatePath|updateTag|refresh)\s*\(/g);
  reportMatches(relativePath, source, "contains a use-cache directive", /["']use cache(?::[^"']+)?["']/g);
  reportMatches(relativePath, source, "enables force-cache", /["']force-cache["']/g);
  reportMatches(relativePath, source, "sets a positive revalidation interval", /\brevalidate\s*(?:=|:)\s*[1-9][0-9]*/g);
  reportMatches(relativePath, source, "uses browser storage/cache state", /\b(?:localStorage|sessionStorage|indexedDB|caches|CacheStorage)\b/g);
  reportMatches(relativePath, source, "uses a service worker or Workbox", /\b(?:serviceWorker|Workbox|workbox)\b/g);
  reportMatches(relativePath, source, "uses explicit router prefetching", /\b(?:router\.)?prefetch\s*\(/g);
  reportMatches(relativePath, source, "allows public Blob storage", /\baccess\s*:\s*["']public["']/g);
  reportMatches(relativePath, source, "overwrites a stable Blob URL", /\ballowOverwrite\s*:\s*true\b/g);

  for (const match of source.matchAll(/\bpreload\s*=\s*["']([^"']+)["']/g)) {
    if (match[1] !== "none") {
      failures.push(
        `${relativePath}:${lineNumber(source, match.index ?? 0)} preloads browser media`,
      );
    }
  }

  for (const match of source.matchAll(/\bfetch\s*\(/g)) {
    const callWindow = source.slice(match.index, (match.index ?? 0) + 900);

    if (!/\bcache\s*:\s*["']no-store["']/.test(callWindow)) {
      failures.push(
        `${relativePath}:${lineNumber(source, match.index ?? 0)} fetch does not explicitly use cache: no-store`,
      );
    }
  }

  if (
    /from\s+["']next\/link["']/.test(source) &&
    relativePath !== "src/components/NoCacheLink.tsx"
  ) {
    failures.push(`${relativePath} imports next/link without the no-prefetch wrapper`);
  }
}

function requireText(relativePath, expected, label) {
  const source = sources.get(relativePath) || "";

  if (!source.includes(expected)) {
    failures.push(`${relativePath} ${label}`);
  }
}

requireText("next.config.ts", "source: \"/:path*\"", "does not cover every response with headers");
requireText("next.config.ts", "Vercel-CDN-Cache-Control", "does not disable the Vercel CDN cache");
requireText("next.config.ts", "value: \"no-store\"", "does not emit no-store CDN headers");
requireText("next.config.ts", "unoptimized: true", "does not disable the Next image cache");
requireText("src/app/layout.tsx", "dynamic = \"force-dynamic\"", "is not forced dynamic");
requireText("src/app/layout.tsx", "fetchCache = \"force-no-store\"", "does not force no-store fetching");
requireText("src/app/layout.tsx", "revalidate = 0", "does not disable revalidation caching");
requireText("src/app/layout.tsx", "<NoCacheGuard />", "does not guard against browser history cache restores");
requireText("src/app/api/uncached-blob/route.ts", "searchParams.set(\"cache\", \"0\")", "does not bypass the private Blob CDN");
requireText("src/app/api/uncached-blob/route.ts", "Public Vercel Blob URLs are disabled", "does not reject public Blob URLs");
requireText("src/lib/uncachedBlobServer.ts", "searchParams.set(\"cache\", \"0\")", "does not bypass the private Blob CDN");
requireText("src/lib/blobConfig.ts", "configuredAccess !== \"private\"", "does not fail closed to private Blob storage");
requireText("src/components/NoCacheLink.tsx", "prefetch={false}", "does not disable Link prefetching");

const allowedUploadCacheFiles = new Set([
  "src/app/api/admin/book/blob-upload/route.ts",
  "src/app/api/admin/content/blob-upload/route.ts",
  "src/app/api/admin/manifesto/blob-upload/route.ts",
  "src/lib/bookPageGenerator.ts",
  "src/lib/uploadStore.ts",
]);

for (const [relativePath, source] of sources) {
  for (const match of source.matchAll(/\bcacheControlMaxAge\s*:\s*(\d+)/g)) {
    if (!allowedUploadCacheFiles.has(relativePath) || match[1] !== "60") {
      failures.push(
        `${relativePath}:${lineNumber(source, match.index ?? 0)} has an unexpected Blob upload cache setting`,
      );
    }
  }
}

if (process.argv.includes("--database")) {
  if (!process.env.DATABASE_URL) {
    failures.push("DATABASE_URL is required for --database");
  } else {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    });

    try {
      const result = await pool.query(`
        select 'site_settings.value' as source, count(*)::int as count
        from site_settings
        where value like 'https://%.blob.vercel-storage.com/%'
          and value not like 'https://%.private.blob.vercel-storage.com/%'
        union all
        select 'books.pdf_href', count(*)::int
        from books
        where pdf_href like 'https://%.blob.vercel-storage.com/%'
          and pdf_href not like 'https://%.private.blob.vercel-storage.com/%'
        union all
        select 'book_pages.image_src', count(*)::int
        from book_pages
        where image_src like 'https://%.blob.vercel-storage.com/%'
          and image_src not like 'https://%.private.blob.vercel-storage.com/%'
        union all
        select 'content_entries.media_url', count(*)::int
        from content_entries
        where media_url like 'https://%.blob.vercel-storage.com/%'
          and media_url not like 'https://%.private.blob.vercel-storage.com/%'
        union all
        select 'content_entries.thumbnail_url', count(*)::int
        from content_entries
        where thumbnail_url like 'https://%.blob.vercel-storage.com/%'
          and thumbnail_url not like 'https://%.private.blob.vercel-storage.com/%'
      `);
      const staleRecords = result.rows.filter((row) => row.count > 0);

      if (staleRecords.length > 0) {
        failures.push(
          `database contains non-private Vercel Blob URLs: ${staleRecords
            .map((row) => `${row.source}=${row.count}`)
            .join(", ")}`,
        );
      }
    } finally {
      await pool.end();
    }
  }
}

if (failures.length > 0) {
  console.error("Cache audit failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `Cache audit clean (${files.length} source files${
      process.argv.includes("--database") ? " + database records" : ""
    }).`,
  );
  console.log(
    "All application reads bypass Next.js, browser, CDN, and private Vercel Blob caches.",
  );
}
