import AgendaSection from "@/components/AgendaSection";
import RecommendedSections from "@/components/RecommendedSections";
import { MANIFESTO_POINTS } from "@/data/partyContent";

export default function ManifestoSection() {
  return (
    <>
      <section id="manifesto" className="section-band manifesto-band">
        <div className="section-inner manifesto-layout">
          <div className="section-heading reveal-up">
            <p className="eyebrow">Manifesto</p>
            <h2>A clean, measurable promise for public service.</h2>
            <p>
              The opening manifesto should be short enough to remember and
              serious enough to audit. Each promise below is designed to become
              a public dashboard item later.
            </p>
          </div>

          <div className="manifesto-grid">
            {MANIFESTO_POINTS.map((point, index) => (
              <article
                className={`manifesto-card reveal-up delay-${Math.min(index, 3)}`}
                key={point.title}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{point.title}</h3>
                <p>{point.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <AgendaSection />
      <RecommendedSections />
    </>
  );
}
