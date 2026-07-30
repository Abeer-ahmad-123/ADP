import type { ManifestoPoint } from "@/types/party";
import { normalizeExtractedPdfText } from "@/lib/pdfText";

const DEFAULT_MANIFESTO_THEME = "Political Pragmatism in Pakistan";
const DEFAULT_MANIFESTO_QUOTE =
  "The Interest and Welfare of the People of Pakistan - First, Always, Without Compromise";

export type ManifestoTextBlock =
  | {
      kind: "list";
      items: string[];
    }
  | {
      kind: "paragraph";
      text: string;
    }
  | {
      kind: "subheading";
      text: string;
    };

type ManifestoSection = {
  blocks: ManifestoTextBlock[];
  title: string;
};

export type ManifestoPillar = {
  blocks: ManifestoTextBlock[];
  number: string;
  title: string;
};

export type ParsedManifesto = {
  philosophy: ManifestoSection;
  pillars: ManifestoPillar[];
  pledge: ManifestoSection;
  preamble: ManifestoSection;
  quote: string;
  theme: string;
  urduPartyName: string;
};

function cleanManifestoLine(rawLine: string) {
  return rawLine.replace(/\f/g, "").replace(/\s+/g, " ").trim();
}

export function getManifestoLines(text: string) {
  return normalizeExtractedPdfText(text).split(/\r?\n/).map(cleanManifestoLine);
}

function isUrduText(line: string) {
  return /[\u0600-\u06FF]/.test(line);
}

function isSkippableBodyLine(line: string) {
  return (
    /^awam dost party\s+(?:-|\u2014)\s+manifesto$/i.test(line) ||
    /^page\s+\d+\s+of\s+\d+$/i.test(line) ||
    /^pa\s*r\s*t\s*y\s*m\s*a\s*n\s*i\s*f\s*e\s*s\s*to$/i.test(line) ||
    /^awam dost party$/i.test(line) ||
    isUrduText(line)
  );
}

function findFirstLine(lines: string[], matcher: (line: string) => boolean) {
  return lines.find((line) => line && matcher(line)) || "";
}

function collectSectionLines(
  lines: string[],
  startMatcher: (line: string) => boolean,
  stopMatcher: (line: string) => boolean,
) {
  const startIndex = lines.findIndex((line) => startMatcher(line));

  if (startIndex === -1) {
    return [];
  }

  const sectionLines: string[] = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line && stopMatcher(line)) {
      break;
    }

    if (!line || !isSkippableBodyLine(line)) {
      sectionLines.push(line);
    }
  }

  return sectionLines;
}

function isStandaloneSubheading(line: string) {
  return (
    /^[A-Z][A-Za-z0-9 &'(),.-]{2,92}:\s*$/.test(line) &&
    !/^\d+\.\d+\s+/.test(line)
  );
}

export function parseTextBlocks(lines: string[]): ManifestoTextBlock[] {
  const blocks: ManifestoTextBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let currentBullet = "";

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      kind: "paragraph",
      text: paragraphLines.join(" "),
    });
    paragraphLines = [];
  };

  const flushBullet = () => {
    if (!currentBullet) {
      return;
    }

    listItems.push(currentBullet);
    currentBullet = "";
  };

  const flushList = () => {
    flushBullet();

    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      items: listItems,
      kind: "list",
    });
    listItems = [];
  };

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (isSkippableBodyLine(line)) {
      continue;
    }

    const isNumberedParagraph = /^\d+\.\d+\s+/.test(line);

    if (isStandaloneSubheading(line)) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "subheading", text: line });
      continue;
    }

    if (currentBullet && isNumberedParagraph) {
      flushList();
    }

    if (/^[\u2022*-]\s+/.test(line)) {
      flushParagraph();
      flushBullet();
      currentBullet = line.replace(/^[\u2022*-]\s+/, "");
      continue;
    }

    if (currentBullet) {
      currentBullet = `${currentBullet} ${line}`;
      continue;
    }

    if (isNumberedParagraph && paragraphLines.length > 0) {
      flushParagraph();
    }

    if (/^(we commit|we recognise)\b/i.test(line) && paragraphLines.length > 0) {
      flushParagraph();
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function parsePillars(lines: string[]) {
  const pillars: ManifestoPillar[] = [];
  let current: {
    lines: string[];
    number: string;
    title: string;
  } | null = null;

  const flushCurrent = () => {
    if (!current) {
      return;
    }

    pillars.push({
      blocks: parseTextBlocks(current.lines),
      number: current.number,
      title: current.title,
    });
    current = null;
  };

  for (const line of lines) {
    const pillarMatch = line.match(/^pillar\s+(\d+)\s+(.+)$/i);

    if (pillarMatch) {
      flushCurrent();
      current = {
        lines: [],
        number: pillarMatch[1],
        title: pillarMatch[2].trim(),
      };
      continue;
    }

    if (/^our pledge$/i.test(line)) {
      flushCurrent();
      break;
    }

    if (current && (!line || !isSkippableBodyLine(line))) {
      current.lines.push(line);
    }
  }

  flushCurrent();

  return pillars;
}

export function parseManifestoText(text: string): ParsedManifesto {
  const lines = getManifestoLines(text);
  const theme =
    findFirstLine(lines, (line) => /^political pragmatism in pakistan$/i.test(line)) ||
    DEFAULT_MANIFESTO_THEME;
  const quote =
    findFirstLine(lines, (line) => /interest and welfare of the people/i.test(line))
      .replace(/^"|"$/g, "") || DEFAULT_MANIFESTO_QUOTE;
  const urduPartyName =
    findFirstLine(lines, (line) => isUrduText(line) && /\u0639\u0648\u0627\u0645/.test(line)) || "";
  const preambleLines = collectSectionLines(
    lines,
    (line) => /^preamble$/i.test(line),
    (line) => /^our philosophy:/i.test(line),
  );
  const philosophyLines = collectSectionLines(
    lines,
    (line) => /^our philosophy:/i.test(line),
    (line) => /^the 20 pillars of reform$/i.test(line),
  );
  const pledgeLines = collectSectionLines(
    lines,
    (line) => /^our pledge$/i.test(line),
    () => false,
  );

  return {
    philosophy: {
      blocks: parseTextBlocks(philosophyLines),
      title: "Our Philosophy: Political Pragmatism",
    },
    pillars: parsePillars(lines),
    pledge: {
      blocks: parseTextBlocks(pledgeLines),
      title: "Our Pledge",
    },
    preamble: {
      blocks: parseTextBlocks(preambleLines),
      title: "Preamble",
    },
    quote,
    theme,
    urduPartyName,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function blockToText(block: ManifestoTextBlock) {
  if (block.kind === "paragraph") {
    return block.text;
  }

  if (block.kind === "list") {
    return block.items[0] || "";
  }

  return "";
}

function summarizeHighlightCopy(value: string, title: string) {
  const titlePattern = new RegExp(`^${escapeRegExp(title)}[:\\s-]*`, "i");
  const cleaned = value
    .replace(/^\d+(?:\.\d+)*\s+/, "")
    .replace(titlePattern, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentenceMatch = cleaned.match(/^(.{64,210}?[.!?])(?:\s|$)/);
  const candidate = sentenceMatch?.[1] || cleaned;

  if (candidate.length <= 190) {
    return candidate;
  }

  return `${candidate.slice(0, 187).replace(/\s+\S*$/, "")}...`;
}

function getPillarHighlightCopy(pillar: ManifestoPillar) {
  const source =
    pillar.blocks.map(blockToText).find((text) => text.trim().length > 0) ||
    pillar.title;

  return summarizeHighlightCopy(source, pillar.title);
}

export function createManifestoHomeHighlights(text: string, count = 4): ManifestoPoint[] {
  const parsed = parseManifestoText(text);

  return parsed.pillars
    .filter((pillar) => pillar.title.trim())
    .slice(0, count)
    .map((pillar) => ({
      copy: getPillarHighlightCopy(pillar),
      title: pillar.title,
    }))
    .filter((point) => point.copy);
}
