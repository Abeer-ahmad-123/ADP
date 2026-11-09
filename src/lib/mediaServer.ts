import { isVercelBlobUrl } from "@/lib/uncachedAsset";

export async function fetchMedia(
  href: string,
  options: { headers?: HeadersInit; method?: "GET" | "HEAD" } = {},
) {
  const url = new URL(href);
  const headers = new Headers(options.headers);
  headers.set("Cache-Control", "no-cache, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  const isBlob = isVercelBlobUrl(href);

  if (isBlob) {
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

  const requestOptions = {
    cache: "no-store",
    headers,
    method: options.method || "GET",
    redirect: "error",
  } as const;
  const response = await fetch(url, requestOptions);

  if (!isBlob || response.status !== 400) {
    return response;
  }

  // A private-looking hostname can still point at a legacy public store.
  // HEAD has no error body, so probe with a bounded GET to identify this case.
  const probeHeaders = new Headers(headers);
  probeHeaders.set("Range", "bytes=0-0");
  const errorResponse =
    options.method === "HEAD"
      ? await fetch(url, {
          ...requestOptions,
          cache: "no-store",
          headers: probeHeaders,
          method: "GET",
        })
      : response;

  if (errorResponse.status !== 400) {
    await errorResponse.body?.cancel();
    return response;
  }

  const errorMessage = await errorResponse.clone().text();

  if (options.method === "HEAD") {
    await errorResponse.body?.cancel();
  }

  if (errorMessage.trim() !== "cache=0 is only available for private stores") {
    return response;
  }

  await response.body?.cancel();
  url.searchParams.delete("cache");
  // Public stores cannot guarantee origin reads. Use a unique request URL
  // while preserving no-store on the fetch and the proxy's response.
  url.searchParams.set("_uncached", crypto.randomUUID());

  return fetch(url, { ...requestOptions, cache: "no-store" });
}
