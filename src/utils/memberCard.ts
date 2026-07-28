import { PARTY_NAME, PARTY_SHORT_NAME } from "@/data/partyContent";
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

export function createMembershipSvg(record: MemberRecord) {
  const nameLines = splitSvgLines(record.fullName, 17, 2);
  const memberNumberLines = splitSvgLines(record.membershipNumber, 24, 1);
  const cityLines = splitSvgLines(
    `${record.city}, ${record.province}`,
    18,
    1,
  );
  const wingLines = splitSvgLines(record.wing, 18, 1);

  return `<svg width="638" height="760" viewBox="0 0 638 760" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="card_shadow" x="0" y="0" width="638" height="760" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#071814" flood-opacity="0.14"/>
    </filter>
    <clipPath id="card_clip">
      <rect x="24" y="24" width="590" height="712" rx="28"/>
    </clipPath>
    <linearGradient id="card_base" x1="24" y1="24" x2="614" y2="736" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="0.54" stop-color="#F3FBF5"/>
      <stop offset="1" stop-color="#E7F7E8"/>
    </linearGradient>
    <linearGradient id="card_accent" x1="24" y1="24" x2="614" y2="736" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.7" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.701" stop-color="#0F7A58"/>
      <stop offset="0.88" stop-color="#0F7A58"/>
      <stop offset="0.881" stop-color="#D8A235"/>
      <stop offset="1" stop-color="#D8A235"/>
    </linearGradient>
  </defs>
  <rect x="24" y="24" width="590" height="712" rx="28" fill="url(#card_base)" filter="url(#card_shadow)"/>
  <g clip-path="url(#card_clip)">
    <rect x="24" y="24" width="590" height="712" fill="url(#card_base)"/>
    <path d="M558 24H614V736H506L558 24Z" fill="#0F7A58" opacity="0.92"/>
    <path d="M604 24H614V736H566L604 24Z" fill="#D8A235" opacity="0.9"/>
    <circle cx="516" cy="176" r="104" fill="#FFFFFF" opacity="0.08"/>
    <circle cx="516" cy="176" r="62" fill="#FFFFFF" opacity="0.08"/>
  </g>
  <rect x="24.5" y="24.5" width="589" height="711" rx="27.5" stroke="#071814" stroke-opacity="0.14"/>
  <text x="70" y="92" fill="#071814" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="950">${PARTY_NAME}</text>
  <rect x="502" y="58" width="72" height="72" rx="36" fill="#0F7A58" stroke="#D8A235" stroke-opacity="0.74"/>
  <text x="538" y="94" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="950" text-anchor="middle" dominant-baseline="middle">${PARTY_SHORT_NAME}</text>
  <rect x="70" y="164" width="136" height="136" rx="68" fill="#0F7A58"/>
  <text x="138" y="232" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="45" font-weight="950" text-anchor="middle" dominant-baseline="middle">${PARTY_SHORT_NAME}</text>
  <text x="70" y="360" fill="#5A675F" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="900">MEMBER NAME</text>
  <text x="70" y="408" fill="#071814" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="950">${renderSvgLines(nameLines, { x: 70, lineHeight: 44 })}</text>
  <text x="70" y="520" fill="#5A675F" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900">MEMBERSHIP NO.</text>
  <text x="70" y="556" fill="#071814" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900">${renderSvgLines(memberNumberLines, { x: 70, lineHeight: 28 })}</text>
  <text x="342" y="520" fill="#5A675F" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900">JOINED</text>
  <text x="342" y="556" fill="#071814" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900">${escapeXml(record.joinedOn)}</text>
  <text x="70" y="638" fill="#5A675F" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900">CITY / REGION</text>
  <text x="70" y="674" fill="#071814" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900">${renderSvgLines(cityLines, { x: 70, lineHeight: 28 })}</text>
  <text x="342" y="638" fill="#5A675F" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900">WING</text>
  <text x="342" y="674" fill="#071814" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900">${renderSvgLines(wingLines, { x: 342, lineHeight: 28 })}</text>
  <text x="520" y="358" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="70" font-weight="950" opacity="0.18" text-anchor="middle">${PARTY_SHORT_NAME}</text>
</svg>`;
}

export function downloadMembershipSvg(record: MemberRecord) {
  const blob = new Blob([createMembershipSvg(record)], {
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
