import type { ReactNode } from "react";
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PARTY_NAME } from "@/data/partyContent";
import { getManifestoDocument } from "@/lib/manifestoRepository";
import { normalizeExtractedPdfText } from "@/lib/pdfText";
import { createPageMetadata, createWebPageJsonLd, getSeoRoute } from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = getSeoRoute("/manifesto");
const DEFAULT_MANIFESTO_THEME = "Political Pragmatism in Pakistan";
const DEFAULT_MANIFESTO_QUOTE =
  "The Interest and Welfare of the People of Pakistan — First, Always, Without Compromise";

type ManifestoTextBlock =
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

type ManifestoPillar = {
  blocks: ManifestoTextBlock[];
  number: string;
  title: string;
};

type ParsedManifesto = {
  philosophy: ManifestoSection;
  pillars: ManifestoPillar[];
  pledge: ManifestoSection;
  preamble: ManifestoSection;
  quote: string;
  theme: string;
  urduPartyName: string;
};

const EMPHASIS_PHRASES = [
  "every law, policy, and institution of the state must revolve around the interest, benefit, and welfare of the people of Pakistan",
  "Pragmatism:",
  "the state of Pakistan exists for its people",
];

function cleanManifestoLine(rawLine: string) {
  return rawLine.replace(/\f/g, "").replace(/\s+/g, " ").trim();
}

function getManifestoLines(text: string) {
  return normalizeExtractedPdfText(text).split(/\r?\n/).map(cleanManifestoLine);
}

function isUrduText(line: string) {
  return /[\u0600-\u06FF]/.test(line);
}

function isSkippableBodyLine(line: string) {
  return (
    /^awam dost party\s+—\s+manifesto$/i.test(line) ||
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

function parseTextBlocks(lines: string[]): ManifestoTextBlock[] {
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

    if (/^[•*-]\s+/.test(line)) {
      flushParagraph();
      flushBullet();
      currentBullet = line.replace(/^[•*-]\s+/, "");
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

function parseManifestoText(text: string): ParsedManifesto {
  const lines = getManifestoLines(text);
  const theme =
    findFirstLine(lines, (line) => /^political pragmatism in pakistan$/i.test(line)) ||
    DEFAULT_MANIFESTO_THEME;
  const quote =
    findFirstLine(lines, (line) => /interest and welfare of the people/i.test(line))
      .replace(/^"|"$/g, "") || DEFAULT_MANIFESTO_QUOTE;
  const urduPartyName =
    findFirstLine(lines, (line) => isUrduText(line) && /عوام/.test(line)) || "";
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

function renderTextWithEmphasis(text: string): ReactNode {
  const numberedLead = text.match(/^(\d+\.\d+\s+[^:]+:)(.*)$/);

  if (numberedLead) {
    return (
      <>
        <strong>{numberedLead[1]}</strong>
        {numberedLead[2]}
      </>
    );
  }

  const phrase = EMPHASIS_PHRASES.find((item) => text.includes(item));

  if (!phrase) {
    return text;
  }

  const [before, after] = text.split(phrase);

  return (
    <>
      {before}
      <strong>{phrase}</strong>
      {after}
    </>
  );
}

function ManifestoBlocks({ blocks }: { blocks: ManifestoTextBlock[] }) {
  return (
    <div className="manifesto-section-body">
      {blocks.map((block, index) => {
        if (block.kind === "subheading") {
          return (
            <p className="manifesto-subheading" key={`${block.text}-${index}`}>
              {block.text}
            </p>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>
                  {renderTextWithEmphasis(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block.text}-${index}`}>
            {renderTextWithEmphasis(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function ManifestoDocumentView({
  text,
  title,
}: {
  text: string;
  title: string;
}) {
  const parsed = parseManifestoText(text);

  return (
    <article className="manifesto-public-document">
      <header className="manifesto-public-header">
        <p>Party Manifesto</p>
        <h1>{PARTY_NAME}</h1>
        {parsed.urduPartyName && (
          <strong lang="ur" dir="rtl">
            {parsed.urduPartyName}
          </strong>
        )}
        <span>{parsed.theme || title}</span>
        <blockquote>&quot;{parsed.quote}&quot;</blockquote>
      </header>

      <div className="manifesto-public-content">
        {parsed.preamble.blocks.length > 0 && (
          <section className="manifesto-intro-card is-preamble">
            <h2>{parsed.preamble.title}</h2>
            <ManifestoBlocks blocks={parsed.preamble.blocks} />
          </section>
        )}

        {parsed.philosophy.blocks.length > 0 && (
          <section className="manifesto-intro-card is-philosophy">
            <h2>{parsed.philosophy.title}</h2>
            <ManifestoBlocks blocks={parsed.philosophy.blocks} />
          </section>
        )}

        {parsed.pillars.length > 0 ? (
          <>
            <div className="manifesto-pillar-heading">
              <h2>The 20 Pillars of Reform</h2>
            </div>
            <div className="manifesto-pillar-list">
              {parsed.pillars.map((pillar) => (
                <section className="manifesto-pillar-card" key={pillar.number}>
                  <header>
                    <span>Pillar {pillar.number}</span>
                    <h3>{pillar.title}</h3>
                  </header>
                  <ManifestoBlocks blocks={pillar.blocks} />
                </section>
              ))}
            </div>
          </>
        ) : (
          <section className="manifesto-intro-card is-preamble">
            <h2>{title}</h2>
            <ManifestoBlocks blocks={parseTextBlocks(getManifestoLines(text))} />
          </section>
        )}

        {parsed.pledge.blocks.length > 0 && (
          <section className="manifesto-pledge-card">
            <h2>{parsed.pledge.title}</h2>
            <ManifestoBlocks blocks={parsed.pledge.blocks} />
          </section>
        )}
      </div>
    </article>
  );
}

function ManifestoEmptyState({
  hasPdf,
}: {
  hasPdf: boolean;
}) {
  return (
    <div className="manifesto-empty-state">
      <FileText aria-hidden="true" size={28} />
      <p>
        {hasPdf
          ? "Manifesto text could not be extracted from this PDF."
          : "No manifesto PDF has been uploaded yet."}
      </p>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const manifesto = await getManifestoDocument();
  const description =
    manifesto.text && manifesto.summary.toLowerCase().includes("pdf form")
      ? "Read the official Awam Dost Party manifesto as public text extracted from the uploaded party document."
      : manifesto.summary || route.description;

  return createPageMetadata({
    ...route,
    description,
    title: manifesto.title || route.title,
  });
}

export default async function ManifestoPage() {
  const manifesto = await getManifestoDocument();
  const title = manifesto.title || "Awam Dost Party Manifesto";
  const storedSummary =
    manifesto.summary ||
    "The public manifesto text will appear here after a readable PDF is uploaded by the party administration.";
  const summary =
    manifesto.text && storedSummary.toLowerCase().includes("pdf form")
      ? "Read the official Awam Dost Party manifesto as public text extracted from the uploaded party document."
      : storedSummary;

  return (
    <main className="public-page-route manifesto-page-route">
      <JsonLd
        data={[
          createWebPageJsonLd({
            ...route,
            description: summary,
            title,
          }),
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            author: PARTY_NAME,
            description: summary,
            encodingFormat: "text/html",
            inLanguage: "en-PK",
            name: title,
            publisher: PARTY_NAME,
          },
        ]}
      />
      <SiteHeader />
      <section className="manifesto-public-band">
        <div className="manifesto-public-shell">
          {manifesto.text ? (
            <ManifestoDocumentView text={manifesto.text} title={title} />
          ) : (
            <ManifestoEmptyState hasPdf={Boolean(manifesto.pdfHref)} />
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
