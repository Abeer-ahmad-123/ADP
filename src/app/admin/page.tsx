import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Headphones,
  Images,
  Megaphone,
  MessageSquareText,
  PlusCircle,
  ScrollText,
  Users,
} from "lucide-react";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminHeroImageForm from "@/app/admin/_components/AdminHeroImageForm";
import { PARTY_NAME } from "@/data/partyContent";
import { listAdminBooks } from "@/lib/bookRepository";
import { listContentEntries } from "@/lib/contentRepository";
import { listPublicFeedback } from "@/lib/feedbackRepository";
import { getManifestoDocument } from "@/lib/manifestoRepository";
import { listStoredMemberships } from "@/lib/membershipRepository";
import { getHeroImageSrc } from "@/lib/siteSettings";
import {
  type AdminSearchParams,
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function loadOverviewData() {
  const result = {
    books: 0,
    contentEntries: 0,
    error: "",
    feedback: 0,
    gallery: 0,
    manifestoReady: false,
    media: 0,
    memberships: 0,
  };

  try {
    const [memberships, contentEntries, books, manifesto, feedback] = await Promise.all([
      listStoredMemberships(),
      listContentEntries(),
      listAdminBooks(),
      getManifestoDocument(),
      listPublicFeedback(),
    ]);

    return {
      ...result,
      books: books.length,
      contentEntries: contentEntries.length,
      feedback: feedback.length,
      gallery: contentEntries.filter((entry) => entry.kind === "gallery_photo").length,
      manifestoReady: Boolean(manifesto.text),
      media: contentEntries.filter(
        (entry) => entry.kind === "audio" || entry.kind === "video_reel",
      ).length,
      memberships: memberships.length,
    };
  } catch (error) {
    return {
      ...result,
      error: getAdminLoadError(error, "Admin dashboard data could not be loaded."),
    };
  }
}

const ADMIN_SECTION_CARDS = [
  {
    href: "/admin/publish",
    icon: PlusCircle,
    kicker: "Create",
    summary: "Add news, blogs, announcements, and leadership profiles.",
    title: "Publish content",
  },
  {
    href: "/admin/content?kind=news",
    icon: FileText,
    kicker: "Manage",
    summary: "Edit, hide, replace files, or delete saved public content.",
    title: "Manage content",
  },
  {
    href: "/admin/media",
    icon: Headphones,
    kicker: "Media",
    summary: "Upload and review audio messages and video reels.",
    title: "Audio and video reels",
  },
  {
    href: "/admin/gallery",
    icon: Images,
    kicker: "Gallery",
    summary: "Upload and review public party photos.",
    title: "Photo gallery",
  },
  {
    href: "/admin/books",
    icon: BookOpen,
    kicker: "Books",
    summary: "Upload books, view PDFs, edit details, and publish or hide books.",
    title: "Book library",
  },
  {
    href: "/admin/manifesto",
    icon: ScrollText,
    kicker: "Manifesto",
    summary: "Replace the manifesto PDF and update extracted public text.",
    title: "Manifesto PDF",
  },
  {
    href: "/admin/memberships",
    icon: Users,
    kicker: "Records",
    summary: "View, edit, delete, and export membership registrations.",
    title: "Membership records",
  },
  {
    href: "/admin/feedback",
    icon: MessageSquareText,
    kicker: "Public desk",
    summary: "Review complaints and suggestions submitted from the website.",
    title: "Feedback inbox",
  },
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const dashboard = await loadOverviewData();
  const heroImageSrc = await getHeroImageSrc();

  return (
    <AdminChrome
      description={`Choose one ${PARTY_NAME} admin section to work in.`}
      error={dashboard.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Admin dashboard"
    >
      <section className="admin-stat-grid">
        <article>
          <span>Registrations</span>
          <strong>{dashboard.memberships}</strong>
          <p>Membership applications stored in Postgres.</p>
        </article>
        <article>
          <span>Content entries</span>
          <strong>{dashboard.contentEntries}</strong>
          <p>News, blogs, announcements, leadership, gallery, and media.</p>
        </article>
        <article>
          <span>Books</span>
          <strong>{dashboard.books}</strong>
          <p>Public PDFs available in the book library.</p>
        </article>
        <article>
          <span>Media items</span>
          <strong>{dashboard.media}</strong>
          <p>Audio files and video reels available for public pages.</p>
        </article>
        <article>
          <span>Gallery photos</span>
          <strong>{dashboard.gallery}</strong>
          <p>Published and draft photos for the public gallery page.</p>
        </article>
        <article>
          <span>Feedback</span>
          <strong>{dashboard.feedback}</strong>
          <p>Public complaints and suggestions submitted from the website.</p>
        </article>
        <article>
          <span>Manifesto</span>
          <strong>{dashboard.manifestoReady ? "Ready" : "No"}</strong>
          <p>Readable manifesto text extracted from the latest PDF.</p>
        </article>
        <article>
          <span>Admin SEO</span>
          <strong>Noindex</strong>
          <p>Admin pages are blocked in robots metadata and response headers.</p>
        </article>
      </section>

      <AdminHeroImageForm heroImageSrc={heroImageSrc} />

      <section className="admin-section-grid">
        {ADMIN_SECTION_CARDS.map((item) => {
          const Icon = item.icon;

          return (
            <Link className="admin-section-card" href={item.href} key={item.href}>
              <Icon aria-hidden="true" size={22} />
              <span>{item.kicker}</span>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
            </Link>
          );
        })}
      </section>

    </AdminChrome>
  );
}
