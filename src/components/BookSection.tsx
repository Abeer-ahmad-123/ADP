import Link from "next/link";
import { BookOpenText } from "lucide-react";
import BookReader from "@/components/BookReader";

export default function BookSection() {
  return (
    <section id="book" className="section-band book-band">
      <div className="section-inner book-layout">
        <div className="section-heading reveal-up">
          <p className="eyebrow">Book page</p>
          <h2>A real page-turning manifesto reader.</h2>
          <p>
            The party book can carry long-form vision, chapter excerpts, speech
            notes, founder letters, and printable policy essays.
          </p>
          <Link className="secondary-button dark-button" href="/book">
            <BookOpenText aria-hidden="true" size={18} />
            Open full book page
          </Link>
        </div>

        <div className="reveal-up delay-1">
          <BookReader compact />
        </div>
      </div>
    </section>
  );
}
