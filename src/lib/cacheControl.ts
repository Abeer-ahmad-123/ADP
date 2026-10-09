export const NO_STORE_CACHE_CONTROL =
  "private, no-store, no-cache, max-age=0, must-revalidate";

export const NO_STORE_RESPONSE_HEADERS = {
  "Cache-Control": NO_STORE_CACHE_CONTROL,
  "CDN-Cache-Control": "no-store",
  Expires: "0",
  Pragma: "no-cache",
  "Surrogate-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
} as const;
