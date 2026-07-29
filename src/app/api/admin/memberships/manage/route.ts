import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  deleteStoredMembership,
  getStoredMembershipByNumber,
  updateStoredMembership,
  validateMembershipPayload,
} from "@/lib/membershipRepository";
import {
  redirectAfterPost,
  redirectToPathAfterPost,
} from "@/lib/redirects";

export const runtime = "nodejs";

function redirectToAdmin(
  request: Request,
  status: string,
  membershipNumber?: string,
) {
  const url = new URL("/admin/memberships", request.url);
  url.searchParams.set("status", status);

  if (membershipNumber) {
    url.hash = `member-${encodeURIComponent(membershipNumber)}`;
  }

  return redirectAfterPost(url);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function readMembershipNumber(formData: FormData) {
  return readText(formData, "membershipNumber");
}

function readMembershipValues(formData: FormData) {
  return {
    affirmsDeclaration: formData.get("affirmsDeclaration") === "on",
    city: readText(formData, "city"),
    cnic: readText(formData, "cnic"),
    confirmsEligibility: formData.get("confirmsEligibility") === "on",
    email: readText(formData, "email"),
    fullName: readText(formData, "fullName"),
    parentOrSpouseName: readText(formData, "parentOrSpouseName"),
    phone: readText(formData, "phone"),
    province: readText(formData, "province"),
    residentialAddress: readText(formData, "residentialAddress"),
  };
}

async function updateMembership(request: Request, formData: FormData) {
  const membershipNumber = readMembershipNumber(formData);

  if (!membershipNumber) {
    return redirectToAdmin(request, "membership-manage-invalid");
  }

  const existing = await getStoredMembershipByNumber(membershipNumber);

  if (!existing) {
    return redirectToAdmin(request, "membership-manage-missing");
  }

  const validation = validateMembershipPayload(readMembershipValues(formData));

  if (!validation.ok) {
    return redirectToAdmin(
      request,
      "membership-manage-invalid",
      membershipNumber,
    );
  }

  const updated = await updateStoredMembership({
    membershipNumber,
    values: validation.values,
  });

  return redirectToAdmin(
    request,
    updated ? "membership-updated" : "membership-manage-missing",
    membershipNumber,
  );
}

async function deleteMembership(request: Request, formData: FormData) {
  const membershipNumber = readMembershipNumber(formData);

  if (!membershipNumber) {
    return redirectToAdmin(request, "membership-manage-invalid");
  }

  const deleted = await deleteStoredMembership(membershipNumber);

  return redirectToAdmin(
    request,
    deleted ? "membership-deleted" : "membership-manage-missing",
  );
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return redirectToPathAfterPost(request, "/admin/login");
  }

  try {
    const formData = await request.formData();
    const intent = readText(formData, "intent");

    if (intent === "update") {
      return await updateMembership(request, formData);
    }

    if (intent === "delete") {
      return await deleteMembership(request, formData);
    }

    return redirectToAdmin(request, "membership-manage-invalid");
  } catch (error) {
    const isDuplicateRecord =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505";

    return redirectToAdmin(
      request,
      isDuplicateRecord
        ? "membership-manage-duplicate"
        : "membership-manage-error",
    );
  }
}
