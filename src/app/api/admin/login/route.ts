import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionMaxAge,
} from "@/lib/adminAuth";
import { verifyAdminCredentials } from "@/lib/adminRepository";
import { redirectAfterPost } from "@/lib/redirects";

export const runtime = "nodejs";

function loginRedirect(request: Request, error?: string) {
  const url = new URL("/admin/login", request.url);

  if (error) {
    url.searchParams.set("error", error);
  }

  return redirectAfterPost(url);
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return loginRedirect(request, "invalid");
  }

  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return loginRedirect(request, "missing");
  }

  try {
    const user = await verifyAdminCredentials(username, password);

    if (!user) {
      return loginRedirect(request, "invalid");
    }

    const response = redirectAfterPost(new URL("/admin", request.url));
    response.cookies.set({
      httpOnly: true,
      maxAge: getAdminSessionMaxAge(),
      name: ADMIN_SESSION_COOKIE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: createAdminSessionToken(user),
    });

    return response;
  } catch (error) {
    const isMissingDatabase =
      error instanceof Error && error.message.includes("DATABASE_URL");
    const isMissingSessionSecret =
      error instanceof Error && error.message.includes("ADMIN_SESSION_SECRET");

    return loginRedirect(
      request,
      isMissingDatabase || isMissingSessionSecret ? "configuration" : "invalid",
    );
  }
}
