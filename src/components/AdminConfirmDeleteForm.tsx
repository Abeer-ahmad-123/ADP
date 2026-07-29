"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

type HiddenField = {
  name: string;
  value: number | string;
};

type AdminConfirmDeleteFormProps = {
  action: string;
  ariaLabel: string;
  hiddenFields: HiddenField[];
  itemName: string;
  itemType: string;
  title: string;
};

export default function AdminConfirmDeleteForm({
  action,
  ariaLabel,
  hiddenFields,
  itemName,
  itemType,
  title,
}: AdminConfirmDeleteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <form
      action={action}
      method="post"
      onSubmit={() => {
        setIsSubmitting(true);
      }}
    >
      {hiddenFields.map((field) => (
        <input
          key={field.name}
          name={field.name}
          type="hidden"
          value={field.value}
        />
      ))}
      <button
        aria-label={ariaLabel}
        className="danger-button"
        title={title}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 aria-hidden="true" size={16} />
      </button>

      {isOpen && (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onClick={() => setIsOpen(false)}
        >
          <div
            aria-describedby={descriptionId}
            aria-labelledby={headingId}
            aria-modal="true"
            className="admin-confirm-dialog"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Close delete dialog"
              className="admin-dialog-close"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </button>

            <span className="admin-dialog-mark" aria-hidden="true">
              <AlertTriangle size={24} />
            </span>
            <p className="admin-dialog-eyebrow">Confirm deletion</p>
            <h2 id={headingId}>Delete {itemType}?</h2>
            <p id={descriptionId}>
              You are about to delete <strong>{itemName}</strong>. This cannot
              be undone.
            </p>

            <div className="admin-dialog-actions">
              <button
                ref={cancelButtonRef}
                className="admin-dialog-secondary"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="admin-dialog-danger"
                disabled={isSubmitting}
                type="submit"
              >
                <Trash2 aria-hidden="true" size={16} />
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
