import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";

const MAX_BOOK_UPLOAD_BYTES = 40 * 1024 * 1024;

export const runtime = "nodejs";

function isBookPdfPath(pathname: string) {
  return pathname.startsWith("book/") && pathname.toLowerCase().endsWith(".pdf");
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

        if (!isBookPdfPath(pathname)) {
          throw new Error("Only book PDF uploads are allowed.");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_BOOK_UPLOAD_BYTES,
          tokenPayload: JSON.stringify({
            kind: "bookPdf",
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
          error instanceof Error ? error.message : "Book upload could not start.",
      },
      { status: 400 },
    );
  }
}
