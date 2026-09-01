import type { QueryResultRow } from "pg";
import { PARTY_LOGO_SRC } from "@/data/partyContent";
import { getPool } from "@/lib/postgres";

export const DEFAULT_HERO_FLAG_IMAGE_SRC = "/brand/awam-dost-party-logo.png";
export const DEFAULT_MEMBERSHIP_CARD_IMAGE_SRC = PARTY_LOGO_SRC;

const BOOK_PDF_SETTING_KEY = "book_pdf_href";
const HERO_FLAG_CAPTION_SETTING_KEY = "hero_flag_caption";
const HERO_IMAGE_SETTING_KEY = "hero_image_src";
const MEMBERSHIP_CARD_IMAGE_SETTING_KEY = "membership_card_image_src";

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

export async function getHeroFlagImageSrc() {
  try {
    return (
      (await getSetting(HERO_IMAGE_SETTING_KEY))?.value ||
      DEFAULT_HERO_FLAG_IMAGE_SRC
    );
  } catch {
    return DEFAULT_HERO_FLAG_IMAGE_SRC;
  }
}

export async function setHeroFlagImageSrc(value: string) {
  await setSetting(HERO_IMAGE_SETTING_KEY, value);
}

export async function getHeroFlagCaption() {
  try {
    return (await getSetting(HERO_FLAG_CAPTION_SETTING_KEY))?.value || "";
  } catch {
    return "";
  }
}

export async function setHeroFlagCaption(value: string) {
  await setSetting(HERO_FLAG_CAPTION_SETTING_KEY, value);
}

export async function getMembershipCardImageSrc() {
  try {
    return (
      (await getSetting(MEMBERSHIP_CARD_IMAGE_SETTING_KEY))?.value ||
      DEFAULT_MEMBERSHIP_CARD_IMAGE_SRC
    );
  } catch {
    return DEFAULT_MEMBERSHIP_CARD_IMAGE_SRC;
  }
}

export async function setMembershipCardImageSrc(value: string) {
  await setSetting(MEMBERSHIP_CARD_IMAGE_SETTING_KEY, value);
}
