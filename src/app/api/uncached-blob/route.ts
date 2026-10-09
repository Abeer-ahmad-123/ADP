import { NO_STORE_RESPONSE_HEADERS } from "@/lib/cacheControl";
import { isVercelBlobUrl } from "@/lib/uncachedAsset";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const runtime = "nodejs";

const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "content-disposition",
  "content-length",
  "content-range",
  "content-type",
] as const;

function createErrorResponse(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      headers: NO_STORE_RESPONSE_HEADERS,
      status,
    },
  );
}

async function readBlob(request: Request, method: "GET" | "HEAD") {
  const source = new URL(request.url).searchParams.get("url") || "";

  if (!isVercelBlobUrl(source)) {
    return createErrorResponse("A valid Vercel Blob URL is required.", 400);
  }

  const upstreamUrl = new URL(source);
  const isPrivateBlob = upstreamUrl.hostname.includes(
    ".private.blob.vercel-storage.com",
  );

  if (!isPrivateBlob) {
    return createErrorResponse(
      "Public Vercel Blob URLs are disabled because they cannot guarantee uncached reads.",
      409,
    );
  }
  const upstreamHeaders = new Headers({
    "Cache-Control": "no-cache, no-store, max-age=0",
    Pragma: "no-cache",
  });
  const range = request.headers.get("range");

  if (range) {
    upstreamHeaders.set("Range", range);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!token) {
    return createErrorResponse("Vercel Blob access is not configured.", 503);
  }

  upstreamHeaders.set("Authorization", `Bearer ${token}`);
  // Vercel guarantees that cache=0 bypasses its CDN for private stores.
  upstreamUrl.searchParams.set("cache", "0");

  let upstream: Response;

  try {
    upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: upstreamHeaders,
      method,
      redirect: "error",
    });
  } catch {
    return createErrorResponse("The Blob could not be fetched.", 502);
  }

  const responseHeaders = new Headers(NO_STORE_RESPONSE_HEADERS);

  for (const header of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(header);

    if (value) {
      responseHeaders.set(header, value);
    }
  }

  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  return new Response(method === "HEAD" ? null : upstream.body, {
    headers: responseHeaders,
    status: upstream.status,
    statusText: upstream.statusText,
  });
}

export function GET(request: Request) {
  return readBlob(request, "GET");
}

export function HEAD(request: Request) {
  return readBlob(request, "HEAD");
}
