import Image from "next/image";
import { ArrowDown, BadgeCheck, BookOpenText, UserRoundPlus } from "lucide-react";
import { PARTY_NAME, PARTY_TAGLINE, STATS } from "@/data/partyContent";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <Image
        src="/civic-hero.png"
        alt="A hopeful civic plaza scene with Pakistani architectural details and citizens gathering."
        fill
        priority
        className="hero-image"
        sizes="100vw"
      />
      <div className="hero-scrim" />

      <div className="hero-content">
        <p className="hero-kicker">
          <BadgeCheck aria-hidden="true" size={18} />
          Pakistan&apos;s first civic party for measurable promises, and local leadership.
        </p>
        <h1>{PARTY_NAME}</h1>
        <p className="hero-copy">{PARTY_TAGLINE}</p>
        <p className="hero-manifesto">
          We believe Pakistan can be governed with visible budgets, useful
          education, jobs close to home, safer streets, and public institutions
          that report back to the people.
        </p>

        <div className="hero-actions">
          <a className="primary-button" href="#register">
            <UserRoundPlus aria-hidden="true" size={18} />
            Become a member
          </a>
          <a className="secondary-button" href="/book">
            <BookOpenText aria-hidden="true" size={18} />
            Read the book
          </a>
        </div>
      </div>

      <div className="hero-stat-strip">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.detail}</p>
          </div>
        ))}
      </div>

      <a className="scroll-cue no-print" href="#manifesto" aria-label="Skip to manifesto">
        <ArrowDown aria-hidden="true" size={18} />
      </a>
    </section>
  );
}
