import Image from "next/image";
import Link from "next/link";
import { ArrowDown, BadgeCheck, BookOpenText, UserRoundPlus } from "lucide-react";
import {
  PARTY_LOGO_ALT,
  PARTY_LOGO_SRC,
  PARTY_NAME,
  PARTY_TAGLINE,
} from "@/data/partyContent";
import { DEFAULT_HERO_IMAGE_SRC } from "@/lib/siteSettings";

export default function HeroSection({
  heroImageSrc = DEFAULT_HERO_IMAGE_SRC,
}: {
  heroImageSrc?: string;
}) {
  const resolvedHeroImageSrc = heroImageSrc || DEFAULT_HERO_IMAGE_SRC;

  return (
    <section className="hero-section">
      <Image
        src={resolvedHeroImageSrc}
        alt="Awam Dost Party civic hero image."
        fill
        priority
        className="hero-image"
        sizes="100vw"
      />
      <div className="hero-scrim" />

      <div className="hero-content">
        <div className="hero-copy-column">
          <p className="hero-kicker">
            <BadgeCheck aria-hidden="true" size={18} />
            {PARTY_TAGLINE}
          </p>
          <h1>{PARTY_NAME}</h1>
          <div className="hero-statement" aria-label="Party vision statement">
            <p className="hero-statement-primary">
              A pragmatic path for Pakistan.
            </p>
            <p className="hero-statement-accent">Built by its own people.</p>
            <p className="hero-statement-urdu" lang="ur" dir="rtl">
              عوام دوست پارٹی — پاکستان کے لیے ایک حقیقت پسندانہ راستہ
            </p>
          </div>
          <p className="hero-manifesto">
            Awam Dost Party is a national political party organized around a
            pragmatic, practical approach to Pakistan&apos;s circumstances —
            grounded in service, discipline, and direct participation of its
            members across the country.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" href="/#register">
              <UserRoundPlus aria-hidden="true" size={18} />
              Become a member
            </Link>
            <Link className="secondary-button" href="/book">
              <BookOpenText aria-hidden="true" size={18} />
              Read the book
            </Link>
          </div>
        </div>

        <div className="hero-flag-showcase" aria-label="Awam Dost Party flag">
          <div className="hero-flag-frame">
            <Image
              alt={PARTY_LOGO_ALT}
              fill
              priority
              sizes="(max-width: 980px) 76vw, 390px"
              src={PARTY_LOGO_SRC}
            />
          </div>
        </div>
      </div>

      <a
        className="scroll-cue no-print"
        href="#approach"
        aria-label="Skip to approach"
      >
        <ArrowDown aria-hidden="true" size={18} />
      </a>
    </section>
  );
}
