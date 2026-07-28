import Link from "next/link";
import { BookOpenText, CreditCard, UserRoundPlus } from "lucide-react";
import { PARTY_SHORT_NAME } from "@/data/partyContent";

export default function SiteHeader() {
  return (
    <header className="site-header no-print">
      <Link className="brand-lockup" href="/">
        <span>{PARTY_SHORT_NAME}</span>
        <strong>Nayi Subah</strong>
      </Link>

      <nav aria-label="Main navigation">
        <a href="#manifesto">Manifesto</a>
        <a href="#agenda">Agenda</a>
        <Link href="/book">Book</Link>
        <a href="#register">Register</a>
        <a href="#funding">Funding</a>
      </nav>

      <div className="header-actions">
        <Link className="icon-button" aria-label="Open book page" href="/book">
          <BookOpenText aria-hidden="true" size={18} />
        </Link>
        <a className="icon-button" aria-label="Register as member" href="#register">
          <UserRoundPlus aria-hidden="true" size={18} />
        </a>
        <a className="icon-button desktop-only" aria-label="Funding details" href="#funding">
          <CreditCard aria-hidden="true" size={18} />
        </a>
      </div>
    </header>
  );
}
