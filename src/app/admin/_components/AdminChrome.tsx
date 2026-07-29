import Link from "next/link";
import { LogOut } from "lucide-react";
import type { AdminSession } from "@/lib/adminAuth";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/publish", label: "Publish" },
  { href: "/admin/content", label: "Manage Content" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/manifesto", label: "Manifesto" },
  { href: "/admin/memberships", label: "Members" },
  { href: "/admin/feedback", label: "Feedback" },
];

export default function AdminChrome({
  children,
  description,
  error,
  session,
  statusMessage,
  title,
}: {
  children: React.ReactNode;
  description: string;
  error?: string;
  session: AdminSession;
  statusMessage?: string;
  title: string;
}) {
  return (
    <main className="admin-route">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Protected admin</p>
          <h1>{title}</h1>
          <span>{description}</span>
          <span>
            Logged in as {session.displayName} · {session.username}
          </span>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="secondary-button dark-button" type="submit">
            <LogOut aria-hidden="true" size={17} />
            Logout
          </button>
        </form>
      </header>

      <nav aria-label="Admin sections" className="admin-section-nav">
        {ADMIN_NAV_ITEMS.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      {error && <p className="admin-alert is-error">{error}</p>}
      {statusMessage && <p className="admin-alert is-success">{statusMessage}</p>}

      {children}
    </main>
  );
}
