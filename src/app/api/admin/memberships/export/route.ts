import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { listStoredMemberships } from "@/lib/membershipRepository";

export const runtime = "nodejs";

const CSV_HEADERS = [
  "membershipNumber",
  "fullName",
  "parentOrSpouseName",
  "cnic",
  "residentialAddress",
  "city",
  "province",
  "phone",
  "email",
  "affirmsDeclaration",
  "confirmsEligibility",
  "joinedOn",
  "createdAt",
];

function hasAdminSession(request: Request) {
  try {
    return Boolean(getAdminSessionFromRequest(request));
  } catch {
    return false;
  }
}

function hasExportToken() {
  const adminToken = process.env.ADMIN_EXPORT_TOKEN;

  return Boolean(
    adminToken && adminToken !== "replace-with-a-long-random-admin-token",
  );
}

function isAuthorized(request: Request) {
  if (hasAdminSession(request)) {
    return true;
  }

  const adminToken = process.env.ADMIN_EXPORT_TOKEN;

  if (!adminToken || adminToken === "replace-with-a-long-random-admin-token") {
    return false;
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${adminToken}`;
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!hasExportToken() && !hasAdminSession(request)) {
    return Response.json(
      { message: "Admin session or export token is required." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const members = await listStoredMemberships();
    const rows = members.map((member) =>
      CSV_HEADERS.map((key) =>
        escapeCsv(String(member[key as keyof typeof member] ?? "")),
      ).join(","),
    );
    const csv = [CSV_HEADERS.join(","), ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Disposition": 'attachment; filename="adp-memberships.csv"',
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    const isMissingDatabase =
      error instanceof Error && error.message.includes("DATABASE_URL");

    return Response.json(
      {
        message: isMissingDatabase
          ? "Membership database is not configured yet."
          : "Membership export could not be prepared right now.",
      },
      { status: isMissingDatabase ? 503 : 500 },
    );
  }
}
