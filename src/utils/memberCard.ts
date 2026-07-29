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

export function createMembershipNumber(values: MemberFormValues) {
  const serial = `${Date.now().toString(36)}${Math.floor(
    Math.random() * 9999,
  )
    .toString()
    .padStart(4, "0")}`
    .toUpperCase()
    .slice(-8);

  return `${PARTY_SHORT_NAME}-PK-${getCityCode(values.city)}-${serial}`;
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

export async function getPartyLogoDataUri() {
  const response = await fetch(PARTY_LOGO_SRC);

  if (!response.ok) {
    throw new Error("Party logo could not be loaded.");
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

export function createMembershipSvg(
  record: MemberRecord,
  logoHref = getDefaultLogoHref(),
) {
  const nameLines = splitSvgLines(record.fullName, 19, 2);
  const memberNumberLines = splitSvgLines(record.membershipNumber, 19, 2);
  const cityLines = splitSvgLines(
    `${record.city}, ${record.province}`,
    34,
    1,
  );

  return `<svg width="638" height="760" viewBox="0 0 638 760" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="card_shadow" x="0" y="0" width="638" height="760" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#071814" flood-opacity="0.26"/>
    </filter>
    <clipPath id="card_clip">
      <rect x="24" y="24" width="590" height="712" rx="28"/>
    </clipPath>
    <clipPath id="card_logo_clip">
      <rect x="219" y="62" width="200" height="146" rx="28"/>
    </clipPath>
    <linearGradient id="card_base" x1="24" y1="24" x2="614" y2="736" gradientUnits="userSpaceOnUse">
      <stop stop-color="#03170F"/>
      <stop offset="0.48" stop-color="#063724"/>
      <stop offset="1" stop-color="#02150E"/>
    </linearGradient>
    <linearGradient id="card_fabric_fold" x1="24" y1="24" x2="614" y2="736" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF" stop-opacity="0.14"/>
      <stop offset="0.18" stop-color="#FFFFFF" stop-opacity="0.05"/>
      <stop offset="0.34" stop-color="#000000" stop-opacity="0.16"/>
      <stop offset="0.52" stop-color="#FFFFFF" stop-opacity="0.07"/>
      <stop offset="0.72" stop-color="#000000" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.05"/>
    </linearGradient>
    <radialGradient id="card_fabric_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(162 104) rotate(55) scale(288 216)">
      <stop stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="card_gold_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(442 112) rotate(91) scale(180 164)">
      <stop stop-color="#D8A235" stop-opacity="0.13"/>
      <stop offset="1" stop-color="#D8A235" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="24" y="24" width="590" height="712" rx="28" fill="url(#card_base)" filter="url(#card_shadow)"/>
  <g clip-path="url(#card_clip)">
    <rect x="24" y="24" width="590" height="712" fill="url(#card_base)"/>
    <rect x="24" y="24" width="590" height="712" fill="url(#card_fabric_fold)"/>
    <rect x="24" y="24" width="590" height="712" fill="url(#card_fabric_glow)"/>
    <rect x="24" y="24" width="590" height="712" fill="url(#card_gold_glow)"/>
    <path d="M24 98C120 56 196 104 272 78C356 50 448 64 614 28V736H24V98Z" fill="#FFFFFF" opacity="0.045"/>
    <path d="M24 606C122 570 204 606 292 582C402 552 492 556 614 504V736H24V606Z" fill="#000000" opacity="0.12"/>
  </g>
  <rect x="24.5" y="24.5" width="589" height="711" rx="27.5" stroke="#D8A235" stroke-opacity="0.34"/>
  <image href="${escapeXml(logoHref)}" x="219" y="62" width="200" height="146" preserveAspectRatio="xMidYMid slice" clip-path="url(#card_logo_clip)"/>
  <rect x="219.5" y="62.5" width="199" height="145" rx="27.5" stroke="#D8A235" stroke-opacity="0.64"/>
  <text x="319" y="252" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="950" text-anchor="middle">${escapeXml(PARTY_NAME)}</text>
  <text x="319" y="282" fill="#D8A235" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="900" letter-spacing="1.8" text-anchor="middle">DIGITAL MEMBERSHIP CARD</text>
  <text x="70" y="362" fill="#D8A235" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="900">MEMBER NAME</text>
  <text x="70" y="410" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="950">${renderSvgLines(nameLines, { x: 70, lineHeight: 44 })}</text>
  <text x="70" y="520" fill="#D8A235" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900">MEMBERSHIP NO.</text>
  <text x="70" y="556" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900">${renderSvgLines(memberNumberLines, { x: 70, lineHeight: 28 })}</text>
  <text x="342" y="520" fill="#D8A235" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900">JOINED</text>
  <text x="342" y="556" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900">${escapeXml(record.joinedOn)}</text>
  <text x="70" y="638" fill="#D8A235" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900">CITY / TEHSIL</text>
  <text x="70" y="674" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900">${renderSvgLines(cityLines, { x: 70, lineHeight: 28 })}</text>
  <text x="319" y="720" fill="#FFFFFF" fill-opacity="0.72" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="900" letter-spacing="1.4" text-anchor="middle">SAB SE PEHLE AWAM</text>
</svg>`;
}

export async function downloadMembershipSvg(record: MemberRecord) {
  const logoHref = await getPartyLogoDataUri().catch(() => getDefaultLogoHref());
  const blob = new Blob([createMembershipSvg(record, logoHref)], {
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
