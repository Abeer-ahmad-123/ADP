export type BlobAccess = "private";

export function getBlobAccess(): BlobAccess {
  const configuredAccess = process.env.BLOB_STORE_ACCESS?.trim();

  if (configuredAccess && configuredAccess !== "private") {
    throw new Error(
      "BLOB_STORE_ACCESS must be private because public Blob stores cannot guarantee uncached reads.",
    );
  }

  return "private";
}
