import type { Metadata } from "next";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import { listPublicFeedback } from "@/lib/feedbackRepository";
import {
  type AdminSearchParams,
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feedback Inbox",
};

type PublicFeedbackAdminRecord = Awaited<ReturnType<typeof listPublicFeedback>>[number];

async function loadFeedbackData() {
  const result: {
    error: string;
    feedback: PublicFeedbackAdminRecord[];
  } = {
    error: "",
    feedback: [],
  };

  try {
    return {
      ...result,
      feedback: await listPublicFeedback(),
    };
  } catch (error) {
    return {
      ...result,
      error: getAdminLoadError(error, "Feedback messages could not be loaded."),
    };
  }
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const data = await loadFeedbackData();
  const complaintCount = data.feedback.filter((item) => item.kind === "complaint").length;
  const suggestionCount = data.feedback.filter((item) => item.kind === "suggestion").length;

  return (
    <AdminChrome
      description="Review public complaints and suggestions submitted from the website."
      error={data.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Feedback inbox"
    >
      <section className="admin-stat-grid admin-media-stats">
        <article>
          <span>Complaints</span>
          <strong>{complaintCount}</strong>
          <p>Public complaint messages requiring review.</p>
        </article>
        <article>
          <span>Suggestions</span>
          <strong>{suggestionCount}</strong>
          <p>Citizen ideas and local improvement requests.</p>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-table-heading">
          <div>
            <p>Public feedback</p>
            <h2>Complaints and suggestions</h2>
            <span>Messages submitted from the website form above the public footer.</span>
          </div>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Sender</th>
                <th>City</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {data.feedback.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span
                      className={`admin-status-pill ${
                        item.kind === "complaint" ? "is-complaint" : "is-published"
                      }`}
                    >
                      {item.kind}
                    </span>
                  </td>
                  <td>
                    <strong>{item.fullName}</strong>
                    {item.email && <span>{item.email}</span>}
                  </td>
                  <td>{item.city}</td>
                  <td>{item.phone}</td>
                  <td className="admin-message-cell">{item.message}</td>
                  <td>{item.createdAt}</td>
                </tr>
              ))}
              {data.feedback.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    No complaints or suggestions have been submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminChrome>
  );
}
