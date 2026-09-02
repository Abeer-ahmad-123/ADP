import {
  PARTY_LOGO_SRC,
  PARTY_NAME,
  PARTY_SHORT_NAME,
} from "@/data/partyContent";
import type { MemberFormValues, MemberRecord } from "@/types/party";

const FALLBACK_CITY_CODE = "PK";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getCityCode(city: string) {
  const normalized = city.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  return normalized || FALLBACK_CITY_CODE;
}

function formatLocation(city: string, province: string) {
  return (
    [city.trim(), province.trim()].filter(Boolean).join(", ") || "Not provided"
  );
}

function splitSvgLines(value: string, maxChars: number, maxLines: number) {
  const words = value.trim().replaceAll("-", "- ").split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxChars || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine.replaceAll("- ", "-"));
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine.replaceAll("- ", "-"));
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const visibleLines = lines.slice(0, maxLines);
  const lastLine = visibleLines[maxLines - 1];
  visibleLines[maxLines - 1] =
    lastLine.length > 3 ? `${lastLine.slice(0, -3)}...` : lastLine;

  return visibleLines;
}

function renderSvgLines(
  lines: string[],
  {
    lineHeight,
    x,
  }: {
    lineHeight: number;
    x: number;
  },
) {
  return lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(
          line,
        )}</tspan>`,
    )
    .join("");
}

function createRandomSerial(length: number) {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    cryptoApi.getRandomValues(bytes);

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
      .slice(0, length);
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .padEnd(length, "0")
    .slice(-length);
}

export function createMembershipNumber(values: MemberFormValues) {
  const serial = createRandomSerial(10);
  const cityCode = getCityCode(values.city);

  return cityCode === FALLBACK_CITY_CODE
    ? `${PARTY_SHORT_NAME}-PK-${serial}`
    : `${PARTY_SHORT_NAME}-PK-${cityCode}-${serial}`;
}

export function createPreviewMembershipNumber(city: string) {
  const cityCode = getCityCode(city);

  return cityCode === FALLBACK_CITY_CODE
    ? `${PARTY_SHORT_NAME}-PK-READY`
    : `${PARTY_SHORT_NAME}-PK-${cityCode}-PREVIEW`;
}

export function createMemberRecord(values: MemberFormValues): MemberRecord {
  return {
    ...values,
    membershipNumber: createMembershipNumber(values),
    joinedOn: new Intl.DateTimeFormat("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date()),
  };
}

function getDefaultLogoHref() {
  return typeof window === "undefined"
    ? PARTY_LOGO_SRC
    : new URL(PARTY_LOGO_SRC, window.location.origin).href;
}

function getAbsoluteImageHref(src: string) {
  return typeof window === "undefined"
    ? src
    : new URL(src, window.location.origin).href;
}

async function getImageDataUri(src: string, loadErrorMessage: string) {
  const response = await fetch(getAbsoluteImageHref(src));

  if (!response.ok) {
    throw new Error(loadErrorMessage);
  }

  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Party logo could not be encoded."));
    });
    reader.addEventListener("error", () => {
      reject(new Error("Party logo could not be encoded."));
    });
    reader.readAsDataURL(blob);
  });
}

export async function getPartyLogoDataUri() {
  return getImageDataUri(PARTY_LOGO_SRC, "Party logo could not be loaded.");
}

export async function getMembershipCardImageDataUri(src: string) {
  return getImageDataUri(
    src || PARTY_LOGO_SRC,
    "Membership card image could not be loaded.",
  );
}

export function createMembershipSvg(
  record: MemberRecord,
  logoHref = getDefaultLogoHref(),
  cardImageHref = logoHref,
) {
  const nameLines = splitSvgLines(record.fullName, 28, 2);
  const memberNumberLines = splitSvgLines(record.membershipNumber, 34, 1);
  const cityLines = splitSvgLines(
    formatLocation(record.city, record.province),
    28,
    1,
  );

  return `<svg width="856" height="540" viewBox="0 0 856 540" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="card_shadow" x="0" y="0" width="856" height="540" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#071814" flood-opacity="0.24"/>
    </filter>
    <clipPath id="card_clip">
      <rect x="24" y="24" width="808" height="492" rx="28"/>
    </clipPath>
    <clipPath id="card_logo_clip">
      <rect x="664" y="54" width="128" height="96" rx="18"/>
    </clipPath>
    <clipPath id="card_number_logo_clip">
      <rect x="64" y="160" width="100" height="74" rx="16"/>
    </clipPath>
    <linearGradient id="card_base" x1="24" y1="24" x2="832" y2="516" gradientUnits="userSpaceOnUse">
      <stop stop-color="#03170F"/>
      <stop offset="0.48" stop-color="#063724"/>
      <stop offset="1" stop-color="#02150E"/>
    </linearGradient>
    <linearGradient id="card_fabric_fold" x1="24" y1="24" x2="832" y2="516" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF" stop-opacity="0.14"/>
      <stop offset="0.18" stop-color="#FFFFFF" stop-opacity="0.05"/>
      <stop offset="0.34" stop-color="#000000" stop-opacity="0.16"/>
      <stop offset="0.52" stop-color="#FFFFFF" stop-opacity="0.07"/>
      <stop offset="0.72" stop-color="#000000" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.05"/>
    </linearGradient>
    <radialGradient id="card_fabric_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 86) rotate(28) scale(360 220)">
      <stop stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="card_gold_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(682 114) rotate(91) scale(196 180)">
      <stop stop-color="#D8A235" stop-opacity="0.13"/>
      <stop offset="1" stop-color="#D8A235" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="24" y="24" width="808" height="492" rx="28" fill="url(#card_base)" filter="url(#card_shadow)"/>
  <g clip-path="url(#card_clip)">
    <rect x="24" y="24" width="808" height="492" fill="url(#card_base)"/>
    <rect x="24" y="24" width="808" height="492" fill="url(#card_fabric_fold)"/>
    <rect x="24" y="24" width="808" height="492" fill="url(#card_fabric_glow)"/>
    <rect x="24" y="24" width="808" height="492" fill="url(#card_gold_glow)"/>
    <path d="M24 96C136 52 238 92 344 66C454 38 594 62 832 30V516H24V96Z" fill="#FFFFFF" opacity="0.045"/>
    <path d="M24 420C160 374 274 416 412 382C562 346 674 362 832 304V516H24V420Z" fill="#000000" opacity="0.13"/>
  </g>
  <rect x="24.5" y="24.5" width="807" height="491" rx="27.5" stroke="#D8A235" stroke-opacity="0.34"/>
  <image href="${escapeXml(cardImageHref)}" x="664" y="54" width="128" height="96" preserveAspectRatio="xMidYMid slice" clip-path="url(#card_logo_clip)"/>
  <rect x="664.5" y="54.5" width="127" height="95" rx="17.5" stroke="#D8A235" stroke-opacity="0.64"/>
  <text x="64" y="76" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="950">${escapeXml(PARTY_NAME)}</text>
  <text x="64" y="108" fill="#D8A235" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="900">DIGITAL MEMBERSHIP CARD</text>
  <image href="${escapeXml(logoHref)}" x="64" y="160" width="100" height="74" preserveAspectRatio="xMidYMid meet" clip-path="url(#card_number_logo_clip)"/>
  <rect x="64.5" y="160.5" width="99" height="73" rx="15.5" stroke="#D8A235" stroke-opacity="0.44"/>
  <text x="64" y="274" fill="#D8A235" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900">MEMBERSHIP NO.</text>
  <text x="64" y="314" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="950">${renderSvgLines(memberNumberLines, { x: 64, lineHeight: 32 })}</text>
  <text x="64" y="416" fill="#D8A235" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900">MEMBER NAME</text>
  <text x="64" y="452" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="950">${renderSvgLines(nameLines, { x: 64, lineHeight: 27 })}</text>
  <text x="392" y="416" fill="#D8A235" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900">JOINED</text>
  <text x="392" y="452" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900">${escapeXml(record.joinedOn)}</text>
  <text x="570" y="416" fill="#D8A235" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900">CITY / TEHSIL</text>
  <text x="570" y="452" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900">${renderSvgLines(cityLines, { x: 570, lineHeight: 24 })}</text>
  <text x="428" y="500" fill="#FFFFFF" fill-opacity="0.72" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="900" text-anchor="middle">SAB SE PEHLE AWAM</text>
</svg>`;
}

export async function downloadMembershipSvg(
  record: MemberRecord,
  membershipCardImageSrc = PARTY_LOGO_SRC,
) {
  const [logoHref, cardImageHref] = await Promise.all([
    getPartyLogoDataUri().catch(() => getDefaultLogoHref()),
    getMembershipCardImageDataUri(membershipCardImageSrc).catch(() =>
      getDefaultLogoHref(),
    ),
  ]);
  const blob = new Blob([createMembershipSvg(record, logoHref, cardImageHref)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${record.membershipNumber}-membership-card.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
