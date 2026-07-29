"use client";

import { Trash2 } from "lucide-react";

export default function AdminDeleteMembershipForm({
  fullName,
  membershipNumber,
}: {
  fullName: string;
  membershipNumber: string;
}) {
  return (
    <form
      action="/api/admin/memberships/manage"
      method="post"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete membership record for "${fullName}"? This cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="intent" type="hidden" value="delete" />
      <input name="membershipNumber" type="hidden" value={membershipNumber} />
      <button
        aria-label={`Delete membership record for ${fullName}`}
        className="danger-button"
        title="Delete membership"
        type="submit"
      >
        <Trash2 aria-hidden="true" size={16} />
      </button>
    </form>
  );
}
