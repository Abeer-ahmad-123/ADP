import type { QueryResultRow } from "pg";
import { AGENDA_ITEMS, MANIFESTO_POINTS } from "@/data/partyContent";
import {
  createElectionPlatformHighlights,
  createManifestoHomeHighlights,
} from "@/lib/manifestoParser";
import { tryExtractPdfTextFromPublicHref } from "@/lib/pdfText";
import { getPool } from "@/lib/postgres";
import { setSetting } from "@/lib/siteSettings";
import type { ElectionPlatformItem, ManifestoPoint } from "@/types/party";

export const MANIFESTO_SETTING_KEYS = {
  electionPlatform: "manifesto_election_platform",
  homePoints: "manifesto_home_points",
  pdfHref: "manifesto_pdf_href",
  summary: "manifesto_summary",
  text: "manifesto_text",
  title: "manifesto_title",
} as const;

export type ManifestoDocument = {
  electionPlatform: ElectionPlatformItem[];
  homePoints: ManifestoPoint[];
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

const DEFAULT_ELECTION_PLATFORM = AGENDA_ITEMS.map((item) => ({
  area: item.area,
  copy: item.copy,
  title: item.title,
}));

const EMPTY_MANIFESTO: ManifestoDocument = {
  electionPlatform: DEFAULT_ELECTION_PLATFORM,
  homePoints: MANIFESTO_POINTS,
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

function parseStoredElectionPlatform(value: string) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return null;
        }

        const platformItem = item as Partial<ElectionPlatformItem>;
        const area = String(platformItem.area || "").trim();
        const title = String(platformItem.title || "").trim();
        const copy = String(platformItem.copy || "").trim();

        return area && title && copy ? { area, copy, title } : null;
      })
      .filter((item): item is ElectionPlatformItem => Boolean(item))
      .slice(0, 4);
  } catch {
    return [];
  }
}

function parseStoredHomePoints(value: string) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return null;
        }

        const point = item as Partial<ManifestoPoint>;
        const title = String(point.title || "").trim();
        const copy = String(point.copy || "").trim();

        return title && copy ? { copy, title } : null;
      })
      .filter((point): point is ManifestoPoint => Boolean(point))
      .slice(0, 4);
  } catch {
    return [];
  }
}

function serializeHomePoints(points: ManifestoPoint[]) {
  return JSON.stringify(
    points
      .map((point) => ({
        copy: point.copy.trim(),
        title: point.title.trim(),
      }))
      .filter((point) => point.title && point.copy)
      .slice(0, 4),
  );
}

function serializeElectionPlatform(items: ElectionPlatformItem[]) {
  return JSON.stringify(
    items
      .map((item) => ({
        area: item.area.trim(),
        copy: item.copy.trim(),
        title: item.title.trim(),
      }))
      .filter((item) => item.area && item.title && item.copy)
      .slice(0, 4),
  );
}

function getGeneratedHomePoints(text: string) {
  return text ? createManifestoHomeHighlights(text) : [];
}

function getGeneratedElectionPlatform(text: string) {
  return text ? createElectionPlatformHighlights(text) : [];
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
    const resolvedText =
      storedText || (pdfHref ? await tryExtractPdfTextFromPublicHref(pdfHref) : "");
    const storedHomePoints = parseStoredHomePoints(
      settings.get(MANIFESTO_SETTING_KEYS.homePoints)?.value || "",
    );
    const storedElectionPlatform = parseStoredElectionPlatform(
      settings.get(MANIFESTO_SETTING_KEYS.electionPlatform)?.value || "",
    );
    const generatedHomePoints =
      storedHomePoints.length > 0 ? [] : getGeneratedHomePoints(resolvedText);
    const generatedElectionPlatform =
      storedElectionPlatform.length > 0
        ? []
        : getGeneratedElectionPlatform(resolvedText);
    const homePoints =
      storedHomePoints.length > 0
        ? storedHomePoints
        : generatedHomePoints.length > 0
        ? generatedHomePoints
        : MANIFESTO_POINTS;
    const electionPlatform =
      storedElectionPlatform.length > 0
        ? storedElectionPlatform
        : generatedElectionPlatform.length > 0
        ? generatedElectionPlatform
        : DEFAULT_ELECTION_PLATFORM;

    if (storedHomePoints.length === 0 && generatedHomePoints.length > 0) {
      await setSetting(
        MANIFESTO_SETTING_KEYS.homePoints,
        serializeHomePoints(generatedHomePoints),
      );
    }

    if (
      storedElectionPlatform.length === 0 &&
      generatedElectionPlatform.length > 0
    ) {
      await setSetting(
        MANIFESTO_SETTING_KEYS.electionPlatform,
        serializeElectionPlatform(generatedElectionPlatform),
      );
    }

    return {
      electionPlatform,
      homePoints,
      pdfHref,
      summary: settings.get(MANIFESTO_SETTING_KEYS.summary)?.value || "",
      text: resolvedText,
      title: settings.get(MANIFESTO_SETTING_KEYS.title)?.value || "",
      updatedAt: latestUpdatedAt ? formatDate(latestUpdatedAt) : "",
    };
  } catch {
    return EMPTY_MANIFESTO;
  }
}

export async function getManifestoElectionPlatform(): Promise<
  ElectionPlatformItem[]
> {
  try {
    const pool = getPool();
    const result = await pool.query<SettingRow>(
      `
        select key, value, updated_at
        from site_settings
        where key = any($1::text[])
      `,
      [[MANIFESTO_SETTING_KEYS.electionPlatform, MANIFESTO_SETTING_KEYS.text]],
    );
    const settings = new Map(result.rows.map((row) => [row.key, row]));
    const storedElectionPlatform = parseStoredElectionPlatform(
      settings.get(MANIFESTO_SETTING_KEYS.electionPlatform)?.value || "",
    );

    if (storedElectionPlatform.length > 0) {
      return storedElectionPlatform;
    }

    const generatedElectionPlatform = getGeneratedElectionPlatform(
      settings.get(MANIFESTO_SETTING_KEYS.text)?.value || "",
    );

    if (generatedElectionPlatform.length > 0) {
      await setSetting(
        MANIFESTO_SETTING_KEYS.electionPlatform,
        serializeElectionPlatform(generatedElectionPlatform),
      );

      return generatedElectionPlatform;
    }
  } catch {
    return DEFAULT_ELECTION_PLATFORM;
  }

  return DEFAULT_ELECTION_PLATFORM;
}

export async function getManifestoHomePoints(): Promise<ManifestoPoint[]> {
  try {
    const pool = getPool();
    const result = await pool.query<SettingRow>(
      `
        select key, value, updated_at
        from site_settings
        where key = any($1::text[])
      `,
      [[MANIFESTO_SETTING_KEYS.homePoints, MANIFESTO_SETTING_KEYS.text]],
    );
    const settings = new Map(result.rows.map((row) => [row.key, row]));
    const storedHomePoints = parseStoredHomePoints(
      settings.get(MANIFESTO_SETTING_KEYS.homePoints)?.value || "",
    );

    if (storedHomePoints.length > 0) {
      return storedHomePoints;
    }

    const generatedHomePoints = getGeneratedHomePoints(
      settings.get(MANIFESTO_SETTING_KEYS.text)?.value || "",
    );

    if (generatedHomePoints.length > 0) {
      await setSetting(
        MANIFESTO_SETTING_KEYS.homePoints,
        serializeHomePoints(generatedHomePoints),
      );

      return generatedHomePoints;
    }
  } catch {
    return MANIFESTO_POINTS;
  }

  return MANIFESTO_POINTS;
}

export async function setManifestoDocument({
  electionPlatform,
  homePoints,
  pdfHref,
  summary,
  text,
  title,
}: {
  electionPlatform?: ElectionPlatformItem[];
  homePoints?: ManifestoPoint[];
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

    const nextHomePoints =
      homePoints && homePoints.length > 0
        ? homePoints
        : getGeneratedHomePoints(text);
    const nextElectionPlatform =
      electionPlatform && electionPlatform.length > 0
        ? electionPlatform
        : getGeneratedElectionPlatform(text);

    updates.push(
      setSetting(
        MANIFESTO_SETTING_KEYS.homePoints,
        serializeHomePoints(nextHomePoints),
      ),
    );
    updates.push(
      setSetting(
        MANIFESTO_SETTING_KEYS.electionPlatform,
        serializeElectionPlatform(nextElectionPlatform),
      ),
    );
  }

  await Promise.all(updates);
}
