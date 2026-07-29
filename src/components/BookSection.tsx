import Link from "next/link";
import { BookOpenText } from "lucide-react";
import BookReader from "@/components/BookReader";
import { PARTY_NAME } from "@/data/partyContent";
import { getPublicBook } from "@/lib/bookRepository";

export default async function BookSection() {
  const book = await getPublicBook();
  const bookTitle = book.title || "Party book";

  return (
    <section id="book" className="section-band book-band">
      <div className="section-inner book-layout">
        <div className="section-heading reveal-up">
          <p className="eyebrow">Book page</p>
          <h2>{bookTitle}.</h2>
          <p>{book.subtitle || "The public book is available for every visitor."}</p>
          <Link className="secondary-button dark-button" href="/book">
            <BookOpenText aria-hidden="true" size={18} />
            Open full book page
          </Link>
        </div>

        <div className="reveal-up delay-1">
          <BookReader
            compact
            pages={book.pages}
            partyName={PARTY_NAME}
            pdfHref={book.pdfHref}
            title={bookTitle}
          />
        </div>
      </div>
    </section>
  );
}
