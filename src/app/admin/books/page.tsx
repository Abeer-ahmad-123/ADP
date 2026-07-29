import type { Metadata } from "next";
import Link from "next/link";
import { Edit3, FileUp } from "lucide-react";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminBookUploadForm from "@/components/AdminBookUploadForm";
import AdminDeleteBookForm from "@/components/AdminDeleteBookForm";
import { listAdminBooks } from "@/lib/bookRepository";
import {
  type AdminSearchParams,
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";
import type { PublicBookSummary } from "@/types/party";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book Library",
};

async function loadBookData() {
  const result: {
    books: PublicBookSummary[];
    error: string;
  } = {
    books: [],
    error: "",
  };

  try {
    return {
      ...result,
      books: await listAdminBooks(),
    };
  } catch (error) {
    return {
      ...result,
      error: getAdminLoadError(error, "Book library data could not be loaded."),
    };
  }
}

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const data = await loadBookData();
  const publishedCount = data.books.filter((book) => book.isPublished).length;

  return (
    <AdminChrome
      description="Upload public books, view PDFs, edit details, and control visibility."
      error={data.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Book library"
    >
      <section className="admin-stat-grid admin-media-stats">
        <article>
          <span>Total books</span>
          <strong>{data.books.length}</strong>
          <p>All uploaded book records in the database.</p>
        </article>
        <article>
          <span>Published</span>
          <strong>{publishedCount}</strong>
          <p>Books visible to public visitors on the website.</p>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <FileUp aria-hidden="true" size={20} />
          <div>
            <p>Book library</p>
            <h2>Upload a public book</h2>
          </div>
        </div>
        <AdminBookUploadForm />
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
              {data.books.map((book) => (
                <tr id={`book-${book.id}`} key={book.id}>
                  <td>
                    <strong>{book.title}</strong>
                    <span>{book.subtitle}</span>
                  </td>
                  <td>{book.author || "—"}</td>
                  <td>{book.pageCount || (book.pdfHref ? "PDF" : 0)}</td>
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
                              <input name="title" required defaultValue={book.title} />
                            </label>
                            <label>
                              <span>Author</span>
                              <input name="author" required defaultValue={book.author} />
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
              {data.books.length === 0 && (
                <tr>
                  <td colSpan={7}>No books have been uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminChrome>
  );
}
