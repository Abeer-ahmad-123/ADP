import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/postgres";

const BOOK_PDF_SETTING_KEY = "book_pdf_href";

type SettingRow = QueryResultRow & {
  key: string;
  value: string;
  updated_at: Date | string;
};

export async function getSetting(key: string) {
  const pool = getPool();
  const result = await pool.query<SettingRow>(
    `
      select key, value, updated_at
      from site_settings
      where key = $1
      limit 1
    `,
    [key],
  );

  return result.rows[0] || null;
}

export async function setSetting(key: string, value: string) {
  const pool = getPool();
  await pool.query(
    `
      insert into site_settings (key, value)
      values ($1, $2)
      on conflict (key)
      do update set value = excluded.value, updated_at = now()
    `,
    [key, value],
  );
}

export async function getBookPdfHref() {
  try {
    return (await getSetting(BOOK_PDF_SETTING_KEY))?.value || "";
  } catch {
    return "";
  }
}

export async function setBookPdfHref(value: string) {
  await setSetting(BOOK_PDF_SETTING_KEY, value);
}
