"use client";

import { FormEvent, useState } from "react";
import {
  MessageSquareText,
  Send,
  ShieldCheck,
} from "lucide-react";
import type {
  PublicFeedbackKind,
  PublicFeedbackRecord,
  PublicFeedbackValues,
} from "@/types/party";

const INITIAL_FORM_VALUES: PublicFeedbackValues = {
  city: "",
  email: "",
  fullName: "",
  kind: "suggestion",
  message: "",
  phone: "",
};

const PHONE_INPUT_PATTERN = "(?:\\+923[0-9]{9}|03[0-9]{9})";

function sanitizePhoneNumber(value: string) {
  const onlyPhoneChars = value.replace(/[^\d+]/g, "");
  const hasLeadingPlus = onlyPhoneChars.startsWith("+");
  const digits = onlyPhoneChars.replaceAll("+", "");

  return hasLeadingPlus ? `+${digits}` : digits;
}

export default function FeedbackForm() {
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof PublicFeedbackValues>(
    field: K,
    value: PublicFeedbackValues[K],
  ) {
    setFormMessage("");
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");
    setIsSubmitting(true);

    const payload: PublicFeedbackValues = {
      city: formValues.city.trim(),
      email: formValues.email.trim(),
      fullName: formValues.fullName.trim(),
      kind: formValues.kind,
      message: formValues.message.trim(),
      phone: formValues.phone.trim(),
    };

    try {
      const response = await fetch("/api/feedback", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as {
        feedback?: PublicFeedbackRecord;
        message?: string;
      };

      if (!response.ok || !result.feedback) {
        setFormMessage(result.message || "Message could not be saved right now.");
        return;
      }

      setFormValues(INITIAL_FORM_VALUES);
      setFormMessage(
        "Thank you. Your message has been saved for the party team.",
      );
    } catch {
      setFormMessage("Message could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="feedback-section-band">
      <div className="section-inner feedback-panel">
        <div className="feedback-copy">
          <p className="eyebrow">Public help desk</p>
          <h2>Complaints and suggestions</h2>
          <p>
            Share a district issue, civic concern, or practical idea with Awam
            Dost Party. Every message is kept in the official admin record.
          </p>
          <span>
            <ShieldCheck aria-hidden="true" size={17} />
            Reviewed by authorized party admins
          </span>
          <div className="feedback-route-list" aria-label="Feedback categories">
            <small>Complaint</small>
            <small>Suggestion</small>
            <small>District issue</small>
          </div>
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-form-heading">
            <MessageSquareText aria-hidden="true" size={20} />
            <div>
              <p>Complaint / suggestion</p>
              <h3>Write to the party</h3>
            </div>
          </div>

          <div className="feedback-form-grid">
            <label>
              <span>Message type</span>
              <select
                required
                value={formValues.kind}
                onChange={(event) =>
                  updateField("kind", event.target.value as PublicFeedbackKind)
                }
              >
                <option value="suggestion">Suggestion</option>
                <option value="complaint">Complaint</option>
              </select>
            </label>
            <label>
              <span>Full name</span>
              <input
                required
                value={formValues.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Your full name"
              />
            </label>
            <label>
              <span>City / Tehsil</span>
              <input
                required
                value={formValues.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="Lahore"
              />
            </label>
            <label>
              <span>Mobile number</span>
              <input
                required
                inputMode="tel"
                pattern={PHONE_INPUT_PATTERN}
                value={formValues.phone}
                onChange={(event) =>
                  updateField("phone", sanitizePhoneNumber(event.target.value))
                }
                placeholder="03439500000"
              />
            </label>
            <label className="wide-field">
              <span>Email (optional)</span>
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@example.com"
              />
            </label>
            <label className="wide-field">
              <span>Message</span>
              <textarea
                required
                minLength={12}
                maxLength={1200}
                value={formValues.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Write your complaint or suggestion..."
                rows={5}
              />
            </label>
          </div>

          <button className="primary-button" disabled={isSubmitting} type="submit">
            <Send aria-hidden="true" size={17} />
            {isSubmitting ? "Saving message..." : "Submit message"}
          </button>

          {formMessage && (
            <p
              className={`form-status ${
                formMessage.startsWith("Thank you") ? "is-success" : "is-error"
              }`}
            >
              {formMessage}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
