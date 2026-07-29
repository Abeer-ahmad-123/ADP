"use client";

import { Trash2 } from "lucide-react";

export default function AdminDeleteContentForm({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  return (
    <form
      action="/api/admin/content/manage"
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="intent" type="hidden" value="delete" />
      <input name="id" type="hidden" value={id} />
      <button
        aria-label={`Delete ${title}`}
        className="danger-button"
        title="Delete entry"
        type="submit"
      >
        <Trash2 aria-hidden="true" size={16} />
      </button>
    </form>
  );
}
