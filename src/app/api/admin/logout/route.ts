import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";
import { redirectToPathAfterPost } from "@/lib/redirects";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const response = redirectToPathAfterPost(request, "/admin/login");

  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: ADMIN_SESSION_COOKIE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: "",
  });

  return response;
}
