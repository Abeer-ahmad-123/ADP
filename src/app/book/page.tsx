import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BookReader from "@/components/BookReader";
import { PARTY_NAME } from "@/data/partyContent";

export default function BookPage() {
  return (
    <main className="book-page-route">
      <div className="book-page-nav no-print">
        <Link href="/">
          <ArrowLeft aria-hidden="true" size={18} />
          Back to site
        </Link>
        <span>{PARTY_NAME}</span>
      </div>

      <section className="book-page-hero">
        <p className="eyebrow">Digital party book</p>
        <h1>The Nayi Subah Notebook</h1>
        <p>
          A page-turning reader for the manifesto, speeches, policy essays, and
          founder letters.
        </p>
      </section>

      <div className="book-page-reader">
        <BookReader />
      </div>
    </main>
  );
}
