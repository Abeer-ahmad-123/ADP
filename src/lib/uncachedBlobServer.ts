import { isVercelBlobUrl } from "@/lib/uncachedAsset";

export function fetchUncachedBlob(href: string) {
  const url = new URL(href);
  const headers = new Headers({
    "Cache-Control": "no-cache, no-store, max-age=0",
    Pragma: "no-cache",
  });

  if (isVercelBlobUrl(href)) {
    if (!url.hostname.includes(".private.blob.vercel-storage.com")) {
      throw new Error(
        "Public Vercel Blob URLs are rejected because they cannot guarantee uncached reads.",
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN is required to read private Blobs.");
    }

    headers.set("Authorization", `Bearer ${token}`);
    url.searchParams.set("cache", "0");
  }

  return fetch(url, {
    cache: "no-store",
    headers,
    redirect: "error",
  });
}
