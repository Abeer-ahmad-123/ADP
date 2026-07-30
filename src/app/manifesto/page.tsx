import type { ReactNode } from "react";
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PARTY_NAME } from "@/data/partyContent";
import {
  getManifestoLines,
  parseManifestoText,
  parseTextBlocks,
  type ManifestoTextBlock,
} from "@/lib/manifestoParser";
import { getManifestoDocument } from "@/lib/manifestoRepository";
import { createPageMetadata, createWebPageJsonLd, getSeoRoute } from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = getSeoRoute("/manifesto");

const EMPHASIS_PHRASES = [
  "every law, policy, and institution of the state must revolve around the interest, benefit, and welfare of the people of Pakistan",
  "Pragmatism:",
  "the state of Pakistan exists for its people",
];

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
