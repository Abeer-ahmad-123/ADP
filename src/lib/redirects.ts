import { NextResponse } from "next/server";

export function redirectAfterPost(url: URL) {
  return NextResponse.redirect(url, 303);
}

export function redirectToPathAfterPost(request: Request, path: string) {
  return redirectAfterPost(new URL(path, request.url));
}
