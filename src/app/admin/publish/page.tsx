import type { Metadata } from "next";
import Link from "next/link";
import { FileText, PlusCircle } from "lucide-react";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminPublishForm from "@/components/AdminPublishForm";
import { listContentEntries } from "@/lib/contentRepository";
import {
  type AdminSearchParams,
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publish Content",
};

async function loadPublishData() {
  const result = {
    announcements: 0,
    blogs: 0,
    error: "",
    leadership: 0,
    news: 0,
  };

  try {
    const entries = await listContentEntries();

    return {
      ...result,
      announcements: entries.filter((entry) => entry.kind === "announcement").length,
      blogs: entries.filter((entry) => entry.kind === "blog").length,
      leadership: entries.filter((entry) => entry.kind === "leadership_profile").length,
      news: entries.filter((entry) => entry.kind === "news").length,
    };
  } catch (error) {
    return {
      ...result,
      error: getAdminLoadError(error, "Publish content data could not be loaded."),
    };
  }
}

export default async function AdminPublishPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const data = await loadPublishData();

  return (
    <AdminChrome
      description="Add public news, blogs, announcements, and leadership profiles."
      error={data.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Publish content"
    >
      <section className="admin-stat-grid">
        <article>
          <span>News</span>
          <strong>{data.news}</strong>
          <p>Public updates shown in the news archive.</p>
        </article>
        <article>
          <span>Blogs</span>
          <strong>{data.blogs}</strong>
          <p>Longer public posts and policy explainers.</p>
        </article>
        <article>
          <span>Announcements</span>
          <strong>{data.announcements}</strong>
          <p>Official notices and popup source content.</p>
        </article>
        <article>
          <span>Leadership</span>
          <strong>{data.leadership}</strong>
          <p>Profiles and public roles shown on the leadership page.</p>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <PlusCircle aria-hidden="true" size={20} />
          <div>
            <p>Publish content</p>
            <h2>Add a public entry</h2>
          </div>
        </div>

        <AdminPublishForm />
      </section>

      <section className="admin-panel admin-action-panel">
        <div>
          <p className="eyebrow">Need changes?</p>
          <h2>Edit or delete saved entries</h2>
          <span>
            Existing news, blogs, announcements, and profiles are managed from
            the content manager.
          </span>
        </div>
        <Link className="secondary-button dark-button" href="/admin/content">
          <FileText aria-hidden="true" size={17} />
          Manage content
        </Link>
      </section>
    </AdminChrome>
  );
}
