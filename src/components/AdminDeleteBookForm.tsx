import AdminConfirmDeleteForm from "@/components/AdminConfirmDeleteForm";

export default function AdminDeleteBookForm({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  return (
    <AdminConfirmDeleteForm
      action="/api/admin/book/manage"
      ariaLabel={`Delete ${title}`}
      hiddenFields={[
        { name: "intent", value: "delete" },
        { name: "id", value: id },
      ]}
      itemName={title}
      itemType="book"
      title="Delete book"
    />
  );
}
