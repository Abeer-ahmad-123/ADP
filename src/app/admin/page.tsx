import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Download,
  Edit3,
  FileUp,
  LogOut,
  PlusCircle,
  ScrollText,
} from "lucide-react";
import AdminDeleteBookForm from "@/components/AdminDeleteBookForm";
import AdminDeleteMembershipForm from "@/components/AdminDeleteMembershipForm";
import AdminPublishForm from "@/components/AdminPublishForm";
import { PARTY_NAME, PROVINCES } from "@/data/partyContent";
import { getAdminSessionFromCookies } from "@/lib/adminAuth";
import { listAdminBooks } from "@/lib/bookRepository";
import { listContentEntries } from "@/lib/contentRepository";
import {
  getManifestoDocument,
  type ManifestoDocument,
} from "@/lib/manifestoRepository";
import { listStoredMemberships } from "@/lib/membershipRepository";
import type {
  ContentEntry,
  PublicBookSummary,
} from "@/types/party";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
    nocache: true,
  },
  title: "Admin Dashboard",
};

const STATUS_MESSAGES: Record<string, string> = {
  "book-created": "Book uploaded successfully.",
  "book-deleted": "Book deleted successfully.",
  "book-error": "Book PDF could not be uploaded.",
  "book-details-error": "Book details could not be updated.",
  "book-details-invalid": "Please add a book title, subtitle, and author.",
  "book-details-updated": "Book details updated successfully.",
  "book-invalid": "Please add a book title, subtitle, author, and PDF file.",
  "book-manage-error": "Book could not be updated.",
  "book-manage-invalid": "Please complete the required book fields.",
  "book-manage-missing": "That book could not be found.",
  "book-updated": "Book updated successfully.",
  "content-created": "Content entry created successfully.",
  "content-deleted": "Content entry deleted successfully.",
  "content-error": "Content entry could not be created.",
  "content-invalid": "Please complete the required fields for this content type.",
  "content-updated": "Content entry updated successfully.",
  "manifesto-error": "Manifesto PDF could not be updated.",
  "manifesto-invalid": "Please add a manifesto title, summary, and PDF file.",
  "manifesto-text-empty": "This manifesto PDF did not contain extractable text.",
  "manifesto-text-error": "Manifesto text could not be extracted from this PDF.",
  "manifesto-updated": "Manifesto PDF and text updated successfully.",
  "membership-deleted": "Membership record deleted successfully.",
  "membership-manage-duplicate": "Another membership record already uses this CNIC.",
  "membership-manage-error": "Membership record could not be updated.",
  "membership-manage-invalid": "Please complete the required membership fields.",
  "membership-manage-missing": "That membership record could not be found.",
  "membership-updated": "Membership record updated successfully.",
  "upload-created": "Media upload added successfully.",
  "upload-error": "Media upload could not be saved.",
  "upload-invalid": "Please choose audio or video reel and add a title.",
};

type MembershipAdminRecord = Awaited<ReturnType<typeof listStoredMemberships>>[number];

async function loadDashboardData() {
  const result: {
    books: PublicBookSummary[];
    contentEntries: ContentEntry[];
    error: string;
    manifesto: ManifestoDocument;
    memberships: MembershipAdminRecord[];
  } = {
    books: [],
    contentEntries: [],
    error: "",
    manifesto: {
      pdfHref: "",
      summary: "",
      text: "",
      title: "",
      updatedAt: "",
    },
    memberships: [],
  };

  try {
    const [memberships, contentEntries, books, manifesto] = await Promise.all([
      listStoredMemberships(),
      listContentEntries(),
      listAdminBooks(),
      getManifestoDocument(),
    ]);

    return {
      ...result,
      books,
      contentEntries,
      manifesto,
      memberships,
    };
  } catch (error) {
    const isMissingDatabase =
      error instanceof Error && error.message.includes("DATABASE_URL");

    return {
      ...result,
      error: isMissingDatabase
        ? "DATABASE_URL is not configured yet. Set it in .env.local and run database/schema.sql."
        : "Admin dashboard data could not be loaded.",
    };
  }
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const statusMessage = params.status ? STATUS_MESSAGES[params.status] : "";
  const dashboard = await loadDashboardData();
  const mediaCount = dashboard.contentEntries.filter(
    (entry) => entry.kind === "audio" || entry.kind === "video_reel",
  ).length;

  return (
    <main className="admin-route">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Protected admin</p>
          <h1>{PARTY_NAME}</h1>
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

      {dashboard.error && <p className="admin-alert is-error">{dashboard.error}</p>}
      {statusMessage && <p className="admin-alert is-success">{statusMessage}</p>}

      <section className="admin-stat-grid">
        <article>
          <span>Registrations</span>
          <strong>{dashboard.memberships.length}</strong>
          <p>Membership applications stored in Postgres.</p>
        </article>
        <article>
          <span>Content entries</span>
          <strong>{dashboard.contentEntries.length}</strong>
          <p>News, blogs, announcements, leadership, and media.</p>
        </article>
        <article>
          <span>Books</span>
          <strong>{dashboard.books.length}</strong>
          <p>Public PDFs available in the book library.</p>
        </article>
        <article>
          <span>Media items</span>
          <strong>{mediaCount}</strong>
          <p>Audio files and video reels available for public pages.</p>
        </article>
      </section>

      <section className="admin-grid">
        <div className="admin-stack">
          <article className="admin-panel">
            <div className="admin-panel-heading">
              <PlusCircle aria-hidden="true" size={20} />
              <div>
                <p>Publish content</p>
                <h2>Add news, blogs, announcements, or profiles</h2>
              </div>
            </div>

            <AdminPublishForm />

            <div className="admin-panel-actions">
              <Link className="secondary-button dark-button" href="/admin/content">
                Edit or delete saved content
              </Link>
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-heading">
              <FileUp aria-hidden="true" size={20} />
              <div>
                <p>Book library</p>
                <h2>Upload a public book</h2>
              </div>
            </div>
            <form
              action="/api/admin/book/upload"
              method="post"
              encType="multipart/form-data"
              className="admin-form compact"
            >
              <label>
                <span>Book title</span>
                <input
                  name="title"
                  required
                  placeholder="Book title"
                />
              </label>
              <label>
                <span>Subtitle</span>
                <textarea
                  name="subtitle"
                  required
                  placeholder="Book subtitle"
                  rows={3}
                />
              </label>
              <label>
                <span>Author</span>
                <input
                  name="author"
                  required
                  placeholder="Book author"
                />
              </label>
              <label>
                <span>PDF file</span>
                <input name="file" required type="file" accept="application/pdf,.pdf" />
              </label>
              <button className="primary-button" type="submit">
                Upload book
              </button>
            </form>
          </article>
        </div>

        <div className="admin-stack">
          <article className="admin-panel">
            <div className="admin-panel-heading">
              <FileUp aria-hidden="true" size={20} />
              <div>
                <p>Upload media</p>
                <h2>Add audio or video reels</h2>
              </div>
            </div>

            <form
              action="/api/admin/content/upload"
              method="post"
              encType="multipart/form-data"
              className="admin-form compact"
            >
              <label>
                <span>Media type</span>
                <select name="kind" required>
                  <option value="video_reel">Video Reel</option>
                  <option value="audio">Audio</option>
                </select>
              </label>
              <label>
                <span>Title</span>
                <input name="title" required placeholder="Video reel title" />
              </label>
              <label>
                <span>Summary</span>
                <textarea name="summary" placeholder="Short description" rows={3} />
              </label>
              <label>
                <span>File</span>
                <input
                  name="file"
                  required
                  type="file"
                  accept="audio/*,video/mp4,video/webm,video/quicktime"
                />
              </label>
              <button className="primary-button" type="submit">
                Upload media
              </button>
            </form>

            <div className="admin-panel-actions">
              <Link className="secondary-button dark-button" href="/admin/media">
                View uploaded media
              </Link>
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-heading" id="manifesto">
              <ScrollText aria-hidden="true" size={20} />
              <div>
                <p>Manifesto PDF</p>
                <h2>Update public manifesto</h2>
              </div>
            </div>

            <div className="admin-current-document">
              <div>
                <span>Current manifesto</span>
                <strong>{dashboard.manifesto.title || "No manifesto uploaded yet"}</strong>
                <p>
                  {dashboard.manifesto.summary ||
                    "Upload a manifesto PDF to show readable text on the public manifesto page."}
                </p>
                <small>
                  {dashboard.manifesto.text
                    ? "Readable manifesto text is available."
                    : "Readable manifesto text has not been extracted yet."}
                </small>
                {dashboard.manifesto.updatedAt && (
                  <small>Last updated {dashboard.manifesto.updatedAt}</small>
                )}
              </div>
              {dashboard.manifesto.pdfHref && (
                <Link href={dashboard.manifesto.pdfHref} target="_blank">
                  Open PDF
                </Link>
              )}
            </div>

            <form
              action="/api/admin/manifesto"
              method="post"
              encType="multipart/form-data"
              className="admin-form compact"
            >
              <label>
                <span>Manifesto title</span>
                <input
                  name="title"
                  required
                  defaultValue={dashboard.manifesto.title}
                  placeholder="Awam Dost Party Manifesto"
                />
              </label>
              <label>
                <span>Summary</span>
                <textarea
                  name="summary"
                  required
                  defaultValue={dashboard.manifesto.summary}
                  placeholder="A pragmatic manifesto for Pakistan, built around public service and measurable commitments."
                  rows={3}
                />
              </label>
              <label>
                <span>
                  {dashboard.manifesto.pdfHref
                    ? "Replace manifesto PDF"
                    : "Manifesto PDF"}
                </span>
                <input
                  name="file"
                  required={!dashboard.manifesto.pdfHref}
                  type="file"
                  accept="application/pdf,.pdf"
                />
              </label>
              <button className="primary-button" type="submit">
                Update manifesto
              </button>
            </form>
          </article>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-table-heading">
          <div>
            <p>Book library</p>
            <h2>Uploaded books</h2>
          </div>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Author</th>
                <th>Pages</th>
                <th>Status</th>
                <th>PDF</th>
                <th>Public page</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.books.map((book) => (
                <tr id={`book-${book.id}`} key={book.id}>
                  <td>
                    <strong>{book.title}</strong>
                    <span>{book.subtitle}</span>
                  </td>
                  <td>{book.author || "—"}</td>
                  <td>{book.pageCount}</td>
                  <td>
                    <span
                      className={
                        book.isPublished
                          ? "admin-status-pill is-published"
                          : "admin-status-pill"
                      }
                    >
                      {book.isPublished ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    {book.pdfHref ? (
                      <Link href={book.pdfHref} target="_blank" rel="noreferrer">
                        View PDF
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Link href={`/book?book=${book.slug}`}>View book</Link>
                  </td>
                  <td className="admin-manage-cell">
                    <div className="admin-management-actions">
                      <details className="admin-edit-details">
                        <summary aria-label={`Edit ${book.title}`} title="Edit book">
                          <Edit3 aria-hidden="true" size={16} />
                        </summary>
                        <form
                          action="/api/admin/book/manage"
                          method="post"
                          encType="multipart/form-data"
                          className="admin-form admin-edit-form"
                        >
                          <input name="intent" type="hidden" value="update" />
                          <input name="id" type="hidden" value={book.id} />
                          <div className="admin-edit-form-grid">
                            <label>
                              <span>Book title</span>
                              <input
                                name="title"
                                required
                                defaultValue={book.title}
                              />
                            </label>
                            <label>
                              <span>Author</span>
                              <input
                                name="author"
                                required
                                defaultValue={book.author}
                              />
                            </label>
                            <label className="wide-field">
                              <span>Subtitle</span>
                              <textarea
                                name="subtitle"
                                required
                                defaultValue={book.subtitle}
                                rows={3}
                              />
                            </label>
                            <label className="wide-field">
                              <span>Replace PDF</span>
                              <input
                                name="pdfFile"
                                type="file"
                                accept="application/pdf,.pdf"
                              />
                            </label>
                          </div>
                          <label className="admin-check">
                            <input
                              name="isPublished"
                              type="checkbox"
                              defaultChecked={book.isPublished}
                            />
                            <span>Show this book on the public website</span>
                          </label>
                          <button className="primary-button" type="submit">
                            Save book
                          </button>
                        </form>
                      </details>
                      <AdminDeleteBookForm id={book.id} title={book.title} />
                    </div>
                  </td>
                </tr>
              ))}
              {dashboard.books.length === 0 && (
                <tr>
                  <td colSpan={7}>No books have been uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-table-heading">
          <div>
            <p>Membership records</p>
            <h2>Registration form data</h2>
          </div>
          <Link className="primary-button" href="/api/admin/memberships/export">
            <Download aria-hidden="true" size={17} />
            Download CSV
          </Link>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>CNIC</th>
                <th>City</th>
                <th>Phone</th>
                <th>Membership No.</th>
                <th>Joined</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.memberships.map((member) => (
                <tr id={`member-${member.membershipNumber}`} key={member.membershipNumber}>
                  <td>
                    <strong>{member.fullName}</strong>
                    <span>{member.parentOrSpouseName}</span>
                    {member.email && <span>{member.email}</span>}
                  </td>
                  <td>{member.cnic}</td>
                  <td>
                    {member.city}, {member.province}
                  </td>
                  <td>{member.phone}</td>
                  <td>{member.membershipNumber}</td>
                  <td>{member.joinedOn}</td>
                  <td className="admin-manage-cell">
                    <div className="admin-management-actions">
                      <details className="admin-edit-details">
                        <summary
                          aria-label={`Edit membership record for ${member.fullName}`}
                          title="Edit membership"
                        >
                          <Edit3 aria-hidden="true" size={16} />
                        </summary>
                        <form
                          action="/api/admin/memberships/manage"
                          method="post"
                          className="admin-form admin-edit-form"
                        >
                          <input name="intent" type="hidden" value="update" />
                          <input
                            name="membershipNumber"
                            type="hidden"
                            value={member.membershipNumber}
                          />
                          <div className="admin-edit-form-grid">
                            <label>
                              <span>Full name</span>
                              <input
                                name="fullName"
                                required
                                defaultValue={member.fullName}
                              />
                            </label>
                            <label>
                              <span>Son / daughter / wife of</span>
                              <input
                                name="parentOrSpouseName"
                                required
                                defaultValue={member.parentOrSpouseName}
                              />
                            </label>
                            <label>
                              <span>CNIC number</span>
                              <input
                                name="cnic"
                                required
                                defaultValue={member.cnic}
                                placeholder="12345-1234567-1"
                              />
                            </label>
                            <label>
                              <span>Mobile number</span>
                              <input
                                name="phone"
                                required
                                defaultValue={member.phone}
                                inputMode="tel"
                                pattern="(?:\\+923[0-9]{9}|03[0-9]{9})"
                              />
                            </label>
                            <label>
                              <span>City / tehsil</span>
                              <input
                                name="city"
                                required
                                defaultValue={member.city}
                              />
                            </label>
                            <label>
                              <span>Province</span>
                              <select
                                name="province"
                                required
                                defaultValue={member.province}
                              >
                                {PROVINCES.map((province) => (
                                  <option key={province} value={province}>
                                    {province}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="wide-field">
                              <span>Residential address</span>
                              <textarea
                                name="residentialAddress"
                                required
                                defaultValue={member.residentialAddress}
                                rows={3}
                              />
                            </label>
                            <label className="wide-field">
                              <span>Email</span>
                              <input
                                name="email"
                                defaultValue={member.email}
                                type="email"
                              />
                            </label>
                          </div>
                          <label className="admin-check">
                            <input
                              name="affirmsDeclaration"
                              type="checkbox"
                              defaultChecked={member.affirmsDeclaration}
                            />
                            <span>Affidavit declaration confirmed</span>
                          </label>
                          <label className="admin-check">
                            <input
                              name="confirmsEligibility"
                              type="checkbox"
                              defaultChecked={member.confirmsEligibility}
                            />
                            <span>Eligibility confirmed</span>
                          </label>
                          <button className="primary-button" type="submit">
                            Save membership
                          </button>
                        </form>
                      </details>
                      <AdminDeleteMembershipForm
                        fullName={member.fullName}
                        membershipNumber={member.membershipNumber}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {dashboard.memberships.length === 0 && (
                <tr>
                  <td colSpan={7}>No membership records available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
