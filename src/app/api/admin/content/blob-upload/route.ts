import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";

const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_MEDIA_UPLOAD_BYTES = 120 * 1024 * 1024;
const GALLERY_IMAGE_TYPES = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const AUDIO_TYPES = [
  "application/octet-stream",
  "audio/*",
  "audio/aac",
  "audio/aiff",
  "audio/flac",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/ogg",
  "audio/vnd.wave",
  "audio/wave",
  "audio/wav",
  "audio/webm",
  "audio/x-aiff",
  "audio/x-flac",
  "audio/x-m4a",
  "audio/x-wav",
];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const runtime = "nodejs";

function getUploadRules(pathname: string) {
  if (pathname.startsWith("content/gallery/")) {
    return {
      allowedContentTypes: GALLERY_IMAGE_TYPES,
      kind: "galleryImage",
      maximumSizeInBytes: MAX_IMAGE_UPLOAD_BYTES,
    };
  }

  if (pathname.startsWith("media/audio/")) {
    return {
      allowedContentTypes: AUDIO_TYPES,
      kind: "audio",
      maximumSizeInBytes: MAX_MEDIA_UPLOAD_BYTES,
    };
  }

  if (pathname.startsWith("media/video_reel/")) {
    return {
      allowedContentTypes: VIDEO_TYPES,
      kind: "videoReel",
      maximumSizeInBytes: MAX_MEDIA_UPLOAD_BYTES,
    };
  }

  return null;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = getAdminSessionFromRequest(request);

        if (!session) {
          throw new Error("Not authenticated.");
        }

        const uploadRules = getUploadRules(pathname);

        if (!uploadRules) {
          throw new Error("This upload path is not allowed.");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes: uploadRules.allowedContentTypes,
          maximumSizeInBytes: uploadRules.maximumSizeInBytes,
          tokenPayload: JSON.stringify({
            kind: uploadRules.kind,
            userId: session.sub,
          }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Image upload could not start.",
      },
      { status: 400 },
    );
  }
}
