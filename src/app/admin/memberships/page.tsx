import type { Metadata } from "next";
import Link from "next/link";
import { Download, Edit3 } from "lucide-react";
import AdminChrome from "@/app/admin/_components/AdminChrome";
import AdminDeleteMembershipForm from "@/components/AdminDeleteMembershipForm";
import { PROVINCES } from "@/data/partyContent";
import { listStoredMemberships } from "@/lib/membershipRepository";
import {
  type AdminSearchParams,
  getAdminLoadError,
  getAdminStatusMessage,
  requireAdminSession,
} from "@/lib/adminPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membership Records",
};

type MembershipAdminRecord = Awaited<ReturnType<typeof listStoredMemberships>>[number];

async function loadMembershipData() {
  const result: {
    error: string;
    memberships: MembershipAdminRecord[];
  } = {
    error: "",
    memberships: [],
  };

  try {
    return {
      ...result,
      memberships: await listStoredMemberships(),
    };
  } catch (error) {
    return {
      ...result,
      error: getAdminLoadError(error, "Membership records could not be loaded."),
    };
  }
}

function formatMemberLocation(member: MembershipAdminRecord) {
  return (
    [member.city, member.province].filter(Boolean).join(", ") || "Not provided"
  );
}

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const data = await loadMembershipData();
  const withEmailCount = data.memberships.filter((member) => member.email).length;

  return (
    <AdminChrome
      description="View, edit, delete, and export public membership registrations."
      error={data.error}
      session={session}
      statusMessage={getAdminStatusMessage(params.status)}
      title="Membership records"
    >
      <section className="admin-stat-grid admin-media-stats">
        <article>
          <span>Total registrations</span>
          <strong>{data.memberships.length}</strong>
          <p>Membership applications stored in Postgres.</p>
        </article>
        <article>
          <span>Email records</span>
          <strong>{withEmailCount}</strong>
          <p>Members who supplied an optional email address.</p>
        </article>
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
              {data.memberships.map((member) => (
                <tr id={`member-${member.membershipNumber}`} key={member.membershipNumber}>
                  <td>
                    <strong>{member.fullName}</strong>
                    <span>{member.parentOrSpouseName}</span>
                    {member.email && <span>{member.email}</span>}
                  </td>
                  <td>{member.cnic}</td>
                  <td>{formatMemberLocation(member)}</td>
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
                              <input name="city" defaultValue={member.city} />
                            </label>
                            <label>
                              <span>Province</span>
                              <select
                                name="province"
                                defaultValue={member.province}
                              >
                                <option value="">No province selected</option>
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
              {data.memberships.length === 0 && (
                <tr>
                  <td colSpan={7}>No membership records available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminChrome>
  );
}
