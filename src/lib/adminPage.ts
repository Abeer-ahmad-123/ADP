import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/adminAuth";

export const ADMIN_STATUS_MESSAGES: Record<string, string> = {
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
  "content-manage-error": "Content entry could not be updated right now.",
  "content-manage-invalid": "Please complete the required fields before saving.",
  "content-manage-missing": "That content entry could not be found.",
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
  "upload-created": "Upload added successfully.",
  "upload-error": "Upload could not be saved.",
  "upload-invalid": "Please choose audio, video reel, or gallery image and add a title.",
};

export const MISSING_DATABASE_MESSAGE =
  "DATABASE_URL is not configured yet. Set it in .env.local and run npm run db:schema.";

export type AdminSearchParams = Promise<{ status?: string }>;

export function getAdminStatusMessage(status?: string) {
  return status ? ADMIN_STATUS_MESSAGES[status] || "" : "";
}

export function getAdminLoadError(error: unknown, fallbackMessage: string) {
  const isMissingDatabase =
    error instanceof Error && error.message.includes("DATABASE_URL");

  return isMissingDatabase ? MISSING_DATABASE_MESSAGE : fallbackMessage;
}

export async function requireAdminSession() {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
