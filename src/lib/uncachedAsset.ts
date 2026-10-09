const VERCEL_BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";
const UNCACHED_BLOB_ROUTE = "/api/uncached-blob";

export function isVercelBlobUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(VERCEL_BLOB_HOST_SUFFIX)
    );
  } catch {
    return false;
  }
}

export function isPrivateVercelBlobUrl(value: string) {
  if (!isVercelBlobUrl(value)) {
    return false;
  }

  return new URL(value).hostname.includes(
    ".private.blob.vercel-storage.com",
  );
}

export function getUncachedAssetHref(href: string | undefined) {
  if (!href || !isVercelBlobUrl(href)) {
    return href || "";
  }

  return `${UNCACHED_BLOB_ROUTE}?url=${encodeURIComponent(href)}`;
}
