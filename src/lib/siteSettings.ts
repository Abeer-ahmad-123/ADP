import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/postgres";

export const DEFAULT_HERO_IMAGE_SRC = "/civic-hero.png";

const BOOK_PDF_SETTING_KEY = "book_pdf_href";
const HERO_IMAGE_SETTING_KEY = "hero_image_src";

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

export async function getHeroImageSrc() {
  try {
    return (
      (await getSetting(HERO_IMAGE_SETTING_KEY))?.value || DEFAULT_HERO_IMAGE_SRC
    );
  } catch {
    return DEFAULT_HERO_IMAGE_SRC;
  }
}

export async function setHeroImageSrc(value: string) {
  await setSetting(HERO_IMAGE_SETTING_KEY, value);
}
