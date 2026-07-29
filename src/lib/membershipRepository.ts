import type { QueryResultRow } from "pg";
import { createMembershipNumber } from "@/utils/memberCard";
import { PROVINCES } from "@/data/partyContent";
import type { MemberFormValues, MemberRecord } from "@/types/party";
import { getPool } from "@/lib/postgres";

type MembershipRow = QueryResultRow & {
  membership_number: string;
  affirms_declaration: boolean;
  cnic: string;
  full_name: string;
  parent_or_spouse_name: string;
  residential_address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  confirms_eligibility: boolean;
  joined_on: Date | string;
  created_at: Date | string;
};

export type MembershipValidationResult =
  | { ok: true; values: MemberFormValues }
  | { ok: false; message: string };

const PHONE_PATTERN = /^(?:\+923[0-9]{9}|03[0-9]{9})$/;
const CNIC_PATTERN = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value: unknown) {
  return value === true;
}

function formatCnic(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  const first = digits.slice(0, 5);
  const second = digits.slice(5, 12);
  const third = digits.slice(12, 13);

  return [first, second, third].filter(Boolean).join("-");
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toMemberRecord(row: MembershipRow): MemberRecord {
  return {
    affirmsDeclaration: row.affirms_declaration,
    city: row.city,
    cnic: row.cnic,
    confirmsEligibility: row.confirms_eligibility,
    email: row.email,
    fullName: row.full_name,
    joinedOn: formatDate(row.joined_on),
    membershipNumber: row.membership_number,
    parentOrSpouseName: row.parent_or_spouse_name,
    phone: row.phone,
    province: row.province,
    residentialAddress: row.residential_address,
  };
}

export function validateMembershipPayload(
  payload: unknown,
): MembershipValidationResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Please submit the membership form again." };
  }

  const input = payload as Record<string, unknown>;
  const values: MemberFormValues = {
    affirmsDeclaration: normalizeBoolean(input.affirmsDeclaration),
    city: normalizeText(input.city),
    cnic: formatCnic(normalizeText(input.cnic)),
    confirmsEligibility: normalizeBoolean(input.confirmsEligibility),
    email: normalizeText(input.email).toLowerCase(),
    fullName: normalizeText(input.fullName),
    parentOrSpouseName: normalizeText(input.parentOrSpouseName),
    phone: normalizeText(input.phone).replace(/[^\d+]/g, ""),
    province: normalizeText(input.province),
    residentialAddress: normalizeText(input.residentialAddress),
  };

  if (values.fullName.length < 3 || values.fullName.length > 100) {
    return { ok: false, message: "Please enter a valid full name." };
  }

  if (
    values.parentOrSpouseName.length < 3 ||
    values.parentOrSpouseName.length > 100
  ) {
    return {
      ok: false,
      message: "Please enter the son, daughter, or wife of name.",
    };
  }

  if (!CNIC_PATTERN.test(values.cnic)) {
    return {
      ok: false,
      message: "Please enter CNIC in 12345-1234567-1 format.",
    };
  }

  if (
    values.residentialAddress.length < 8 ||
    values.residentialAddress.length > 220
  ) {
    return { ok: false, message: "Please enter a valid residential address." };
  }

  if (values.city.length < 2 || values.city.length > 80) {
    return { ok: false, message: "Please enter a valid city or tehsil." };
  }

  if (!PROVINCES.includes(values.province)) {
    return { ok: false, message: "Please choose a valid province or region." };
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

  if (!values.affirmsDeclaration) {
    return { ok: false, message: "Please affirm the membership declaration." };
  }

  if (!values.confirmsEligibility) {
    return {
      ok: false,
      message: "Please confirm eligibility for party membership.",
    };
  }

  return { ok: true, values };
}

export async function createStoredMembership(values: MemberFormValues) {
  const pool = getPool();
  const membershipNumber = createMembershipNumber(values);
  const result = await pool.query<MembershipRow>(
    `
      insert into memberships (
        membership_number,
        affirms_declaration,
        cnic,
        full_name,
        parent_or_spouse_name,
        residential_address,
        city,
        province,
        phone,
        email,
        confirms_eligibility
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      returning
        membership_number,
        affirms_declaration,
        cnic,
        full_name,
        parent_or_spouse_name,
        residential_address,
        city,
        province,
        phone,
        email,
        confirms_eligibility,
        joined_on,
        created_at
    `,
    [
      membershipNumber,
      values.affirmsDeclaration,
      values.cnic,
      values.fullName,
      values.parentOrSpouseName,
      values.residentialAddress,
      values.city,
      values.province,
      values.phone,
      values.email,
      values.confirmsEligibility,
    ],
  );

  return toMemberRecord(result.rows[0]);
}

export async function getStoredMembershipByNumber(membershipNumber: string) {
  const pool = getPool();
  const result = await pool.query<MembershipRow>(
    `
      select
        membership_number,
        affirms_declaration,
        cnic,
        full_name,
        parent_or_spouse_name,
        residential_address,
        city,
        province,
        phone,
        email,
        confirms_eligibility,
        joined_on,
        created_at
      from memberships
      where membership_number = $1
      limit 1
    `,
    [membershipNumber],
  );
  const row = result.rows[0];

  return row
    ? {
        ...toMemberRecord(row),
        createdAt: formatDate(row.created_at),
      }
    : null;
}

export async function updateStoredMembership({
  membershipNumber,
  values,
}: {
  membershipNumber: string;
  values: MemberFormValues;
}) {
  const pool = getPool();
  const result = await pool.query<MembershipRow>(
    `
      update memberships
      set
        affirms_declaration = $1,
        cnic = $2,
        full_name = $3,
        parent_or_spouse_name = $4,
        residential_address = $5,
        city = $6,
        province = $7,
        phone = $8,
        email = $9,
        confirms_eligibility = $10
      where membership_number = $11
      returning
        membership_number,
        affirms_declaration,
        cnic,
        full_name,
        parent_or_spouse_name,
        residential_address,
        city,
        province,
        phone,
        email,
        confirms_eligibility,
        joined_on,
        created_at
    `,
    [
      values.affirmsDeclaration,
      values.cnic,
      values.fullName,
      values.parentOrSpouseName,
      values.residentialAddress,
      values.city,
      values.province,
      values.phone,
      values.email,
      values.confirmsEligibility,
      membershipNumber,
    ],
  );
  const row = result.rows[0];

  return row
    ? {
        ...toMemberRecord(row),
        createdAt: formatDate(row.created_at),
      }
    : null;
}

export async function deleteStoredMembership(membershipNumber: string) {
  const pool = getPool();
  const result = await pool.query(
    `
      delete from memberships
      where membership_number = $1
    `,
    [membershipNumber],
  );

  return (result.rowCount || 0) > 0;
}

export async function listStoredMemberships() {
  const pool = getPool();
  const result = await pool.query<MembershipRow>(
    `
      select
        membership_number,
        affirms_declaration,
        cnic,
        full_name,
        parent_or_spouse_name,
        residential_address,
        city,
        province,
        phone,
        email,
        confirms_eligibility,
        joined_on,
        created_at
      from memberships
      order by created_at desc
    `,
  );

  return result.rows.map((row) => ({
    ...toMemberRecord(row),
    createdAt: formatDate(row.created_at),
  }));
}
