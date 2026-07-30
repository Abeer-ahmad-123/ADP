import AdminConfirmDeleteForm from "@/components/AdminConfirmDeleteForm";
import type { ContentKind } from "@/types/party";

export default function AdminDeleteContentForm({
  id,
  kind,
  title,
}: {
  id: number;
  kind: ContentKind;
  title: string;
}) {
  return (
    <AdminConfirmDeleteForm
      action="/api/admin/content/manage"
      ariaLabel={`Delete ${title}`}
      hiddenFields={[
        { name: "intent", value: "delete" },
        { name: "id", value: id },
        { name: "kind", value: kind },
      ]}
      itemName={title}
      itemType="entry"
      title="Delete entry"
    />
  );
}
