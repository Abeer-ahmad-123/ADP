import AdminConfirmDeleteForm from "@/components/AdminConfirmDeleteForm";

export default function AdminDeleteContentForm({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  return (
    <AdminConfirmDeleteForm
      action="/api/admin/content/manage"
      ariaLabel={`Delete ${title}`}
      hiddenFields={[
        { name: "intent", value: "delete" },
        { name: "id", value: id },
      ]}
      itemName={title}
      itemType="entry"
      title="Delete entry"
    />
  );
}
