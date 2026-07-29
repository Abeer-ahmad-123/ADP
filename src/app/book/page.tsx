import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BookReader from "@/components/BookReader";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  PARTY_LOGO_ALT,
  PARTY_LOGO_SRC,
  PARTY_NAME,
} from "@/data/partyContent";
import {
  getPublicBook,
  listPublicBooks,
} from "@/lib/bookRepository";
import {
  absoluteUrl,
  createPageMetadata,
  createWebPageJsonLd,
  getSeoRoute,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type BookRouteProps = {
  searchParams: Promise<{ book?: string }>;
};

async function getSelectedBook(slug?: string) {
  const books = await listPublicBooks();
  const selectedSlug = slug || books[0]?.slug;
  let book = await getPublicBook(selectedSlug);

  if (!book.id && books[0]) {
    book = await getPublicBook(books[0].slug);
  }

  return {
    book,
    books,
  };
}

export async function generateMetadata({
  searchParams,
}: BookRouteProps): Promise<Metadata> {
  const params = await searchParams;
  const { book } = await getSelectedBook(params.book);
  const route = getSeoRoute("/book");
  const bookPath = params.book && book.slug ? `/book?book=${book.slug}` : route.path;

  return createPageMetadata({
    ...route,
    description: book.subtitle || route.description,
    path: bookPath,
    title: book.title || route.title,
  });
}

export default async function BookPage({ searchParams }: BookRouteProps) {
  const params = await searchParams;
  const { book, books } = await getSelectedBook(params.book);
  const bookTitle = book.title || "Book";
  const route = getSeoRoute("/book");
  const bookPath = params.book && book.slug ? `/book?book=${book.slug}` : route.path;
  const pageSeo = {
    ...route,
    description: book.subtitle || route.description,
    path: bookPath,
    title: bookTitle,
  };

  return (
    <main className="public-page-route book-public-route">
      <JsonLd
        data={[
          createWebPageJsonLd(pageSeo),
          {
            "@context": "https://schema.org",
            "@type": "Book",
            author: book.author
              ? {
                  "@type": "Person",
                  name: book.author,
                }
              : PARTY_NAME,
            description: book.subtitle || route.description,
            inLanguage: "en-PK",
            name: bookTitle,
            publisher: {
              "@type": "Organization",
              name: PARTY_NAME,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: books.map((item, index) => ({
              "@type": "ListItem",
              item: {
                "@type": "Book",
                author: item.author || PARTY_NAME,
                description: item.subtitle,
                name: item.title,
                url: absoluteUrl(`${route.path}?book=${item.slug}`),
              },
              position: index + 1,
            })),
            name: `${PARTY_NAME} public book library`,
          },
        ]}
      />
      <SiteHeader />
      <section className="section-band public-page-hero-band hero-book">
        <div className="section-inner public-page-hero">
          <div className="public-page-hero-copy">
            <p className="eyebrow">Digital party book</p>
            <h1>{bookTitle}</h1>
            <p>{book.subtitle || "Read the public book in the page-turning reader."}</p>
          </div>

          <div className="public-hero-visual book-hero-visual" aria-hidden="true">
            <div className="public-hero-flag">
              <Image
                alt={PARTY_LOGO_ALT}
                fill
                priority
                sizes="(max-width: 760px) 72vw, 420px"
                src={PARTY_LOGO_SRC}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-band public-archive-band book-public-reader-band">
        <div className="section-inner book-public-reader book-public-library">
          <div className="book-library-heading">
            <p className="eyebrow">Book library</p>
            <h2>Public books and manifesto material.</h2>
            <span>
              Select a book to open it in the reader. Uploaded PDFs remain
              available even before page-turn content is added.
            </span>
          </div>

          <div className="book-library-grid">
            {books.map((item) => (
              <article
                className={`book-library-card ${
                  item.slug === book.slug ? "is-active" : ""
                }`}
                key={item.id}
              >
                <p>{item.author || PARTY_NAME}</p>
                <h2>{item.title}</h2>
                <span>{item.subtitle || "Public party book."}</span>
                <div className="book-library-meta">
                  <small>{item.pageCount} reader pages</small>
                </div>
                <Link href={`/book?book=${item.slug}`}>
                  {item.slug === book.slug ? "Currently open" : "Open reader"}
                </Link>
              </article>
            ))}
            {books.length === 0 && (
              <div className="book-empty">
                <p>No books have been published yet.</p>
              </div>
            )}
          </div>

          <BookReader pages={book.pages} partyName={PARTY_NAME} title={bookTitle} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
