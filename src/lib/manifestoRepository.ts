import type { QueryResultRow } from "pg";
import { tryExtractPdfTextFromPublicHref } from "@/lib/pdfText";
import { getPool } from "@/lib/postgres";
import { setSetting } from "@/lib/siteSettings";

export const MANIFESTO_SETTING_KEYS = {
  pdfHref: "manifesto_pdf_href",
  summary: "manifesto_summary",
  text: "manifesto_text",
  title: "manifesto_title",
} as const;

export type ManifestoDocument = {
  pdfHref: string;
  summary: string;
  text: string;
  title: string;
  updatedAt: string;
};

type SettingRow = QueryResultRow & {
  key: string;
  value: string;
  updated_at: Date | string;
};

const EMPTY_MANIFESTO: ManifestoDocument = {
  pdfHref: "",
  summary: "",
  text: "",
  title: "",
  updatedAt: "",
};

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function getManifestoDocument(): Promise<ManifestoDocument> {
  try {
    const pool = getPool();
    const result = await pool.query<SettingRow>(
      `
        select key, value, updated_at
        from site_settings
        where key = any($1::text[])
      `,
      [Object.values(MANIFESTO_SETTING_KEYS)],
    );
    const settings = new Map(result.rows.map((row) => [row.key, row]));
    const latestUpdatedAt = result.rows
      .map((row) => row.updated_at)
      .sort((left, right) => {
        const leftTime = new Date(left).getTime();
        const rightTime = new Date(right).getTime();

        return rightTime - leftTime;
      })[0];

    const pdfHref = settings.get(MANIFESTO_SETTING_KEYS.pdfHref)?.value || "";
    const storedText = settings.get(MANIFESTO_SETTING_KEYS.text)?.value || "";

    return {
      pdfHref,
      summary: settings.get(MANIFESTO_SETTING_KEYS.summary)?.value || "",
      text: storedText || (pdfHref ? await tryExtractPdfTextFromPublicHref(pdfHref) : ""),
      title: settings.get(MANIFESTO_SETTING_KEYS.title)?.value || "",
      updatedAt: latestUpdatedAt ? formatDate(latestUpdatedAt) : "",
    };
  } catch {
    return EMPTY_MANIFESTO;
  }
}

export async function setManifestoDocument({
  pdfHref,
  summary,
  text,
  title,
}: {
  pdfHref?: string;
  summary: string;
  text?: string;
  title: string;
}) {
  const updates = [
    setSetting(MANIFESTO_SETTING_KEYS.title, title),
    setSetting(MANIFESTO_SETTING_KEYS.summary, summary),
  ];

  if (typeof pdfHref === "string") {
    updates.push(setSetting(MANIFESTO_SETTING_KEYS.pdfHref, pdfHref));
  }

  if (typeof text === "string") {
    updates.push(setSetting(MANIFESTO_SETTING_KEYS.text, text));
  }

  await Promise.all(updates);
}
