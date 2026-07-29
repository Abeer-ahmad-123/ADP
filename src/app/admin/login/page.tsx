import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
    nocache: true,
  },
  title: "Admin Login",
};

const ERROR_MESSAGES: Record<string, string> = {
  configuration:
    "Admin login is not configured yet. Check DATABASE_URL and ADMIN_SESSION_SECRET.",
  invalid: "Invalid admin username or password.",
  missing: "Enter both admin username and password.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSessionFromCookies();

  if (session) {
    redirect("/admin");
  }

  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : "";

  return (
    <main className="admin-login-route">
      <section className="admin-login-card">
        <p className="eyebrow">Admin access</p>
        <h1>Awam Dost Party dashboard</h1>
        <p>
          Sign in to manage announcements, media, book PDF uploads, and
          membership records.
        </p>

        <form action="/api/admin/login" method="post" className="admin-login-form">
          <label>
            <span>Username</span>
            <input
              required
              autoComplete="username"
              name="username"
              placeholder="admin@awamdost.party"
              type="email"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              required
              autoComplete="current-password"
              name="password"
              placeholder="Enter admin password"
              type="password"
            />
          </label>
          <button className="primary-button" type="submit">
            Login
          </button>
          {errorMessage && <p className="form-status is-error">{errorMessage}</p>}
        </form>
      </section>
    </main>
  );
}
