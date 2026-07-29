import AdminConfirmDeleteForm from "@/components/AdminConfirmDeleteForm";

export default function AdminDeleteMembershipForm({
  fullName,
  membershipNumber,
}: {
  fullName: string;
  membershipNumber: string;
}) {
  return (
    <AdminConfirmDeleteForm
      action="/api/admin/memberships/manage"
      ariaLabel={`Delete membership record for ${fullName}`}
      hiddenFields={[
        { name: "intent", value: "delete" },
        { name: "membershipNumber", value: membershipNumber },
      ]}
      itemName={fullName}
      itemType="membership record"
      title="Delete membership"
    />
  );
}
