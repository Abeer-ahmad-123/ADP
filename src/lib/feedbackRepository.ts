import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/postgres";
import type {
  PublicFeedbackKind,
  PublicFeedbackRecord,
  PublicFeedbackValues,
} from "@/types/party";

type PublicFeedbackRow = QueryResultRow & {
  id: number;
  kind: PublicFeedbackKind;
  full_name: string;
  city: string;
  phone: string;
  email: string;
  message: string;
  created_at: Date | string;
};

export type FeedbackValidationResult =
  | { ok: true; values: PublicFeedbackValues }
  | { ok: false; message: string };

const FEEDBACK_KINDS: PublicFeedbackKind[] = ["complaint", "suggestion"];
const PHONE_PATTERN = /^(?:\+923[0-9]{9}|03[0-9]{9})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizePhoneNumber(value: string) {
  const onlyPhoneChars = value.replace(/[^\d+]/g, "");
  const hasLeadingPlus = onlyPhoneChars.startsWith("+");
  const digits = onlyPhoneChars.replaceAll("+", "");

  return hasLeadingPlus ? `+${digits}` : digits;
}

function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toPublicFeedbackRecord(row: PublicFeedbackRow): PublicFeedbackRecord {
  return {
    city: row.city,
    createdAt: formatDateTime(row.created_at),
    email: row.email,
    fullName: row.full_name,
    id: Number(row.id),
    kind: row.kind,
    message: row.message,
    phone: row.phone,
  };
}

export function validateFeedbackPayload(
  payload: unknown,
): FeedbackValidationResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Please submit the form again." };
  }

  const input = payload as Record<string, unknown>;
  const kind = normalizeText(input.kind) as PublicFeedbackKind;
  const values: PublicFeedbackValues = {
    city: normalizeText(input.city),
    email: normalizeText(input.email).toLowerCase(),
    fullName: normalizeText(input.fullName),
    kind,
    message: normalizeText(input.message),
    phone: sanitizePhoneNumber(normalizeText(input.phone)),
  };

  if (!FEEDBACK_KINDS.includes(values.kind)) {
    return { ok: false, message: "Please choose complaint or suggestion." };
  }

  if (values.fullName.length < 3 || values.fullName.length > 100) {
    return { ok: false, message: "Please enter a valid full name." };
  }

  if (values.city.length < 2 || values.city.length > 80) {
    return { ok: false, message: "Please enter a valid city or tehsil." };
  }

  if (!PHONE_PATTERN.test(values.phone)) {
    return {
      ok: false,
      message: "Use a Pakistani mobile number starting with +92 or 0.",
    };
  }

  if (
    values.email &&
    (!EMAIL_PATTERN.test(values.email) || values.email.length > 120)
  ) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  if (values.message.length < 12 || values.message.length > 1200) {
    return {
      ok: false,
      message: "Please enter a message between 12 and 1200 characters.",
    };
  }

  return { ok: true, values };
}

export async function createPublicFeedback(values: PublicFeedbackValues) {
  const pool = getPool();
  const result = await pool.query<PublicFeedbackRow>(
    `
      insert into public_feedback (
        kind,
        full_name,
        city,
        phone,
        email,
        message
      )
      values ($1, $2, $3, $4, $5, $6)
      returning
        id,
        kind,
        full_name,
        city,
        phone,
        email,
        message,
        created_at
    `,
    [
      values.kind,
      values.fullName,
      values.city,
      values.phone,
      values.email,
      values.message,
    ],
  );

  return toPublicFeedbackRecord(result.rows[0]);
}

export async function listPublicFeedback() {
  const pool = getPool();
  const result = await pool.query<PublicFeedbackRow>(
    `
      select
        id,
        kind,
        full_name,
        city,
        phone,
        email,
        message,
        created_at
      from public_feedback
      order by created_at desc
    `,
  );

  return result.rows.map(toPublicFeedbackRecord);
}
