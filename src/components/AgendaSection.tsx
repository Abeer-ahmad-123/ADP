"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  AGENDA_ITEMS,
  PARTY_SHORT_NAME,
  TIMELINE_ITEMS,
} from "@/data/partyContent";

const CARD_LAUNCH_VECTORS = [
  { x: "52%", y: "126px" },
  { x: "-52%", y: "126px" },
  { x: "52%", y: "-126px" },
  { x: "-52%", y: "-126px" },
];

export default function AgendaSection() {
  const [isActive, setIsActive] = useState(false);
  const hasExitedAboveRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    if (typeof globalThis.IntersectionObserver === "undefined") {
      const fallbackFrame = globalThis.requestAnimationFrame(() =>
        setIsActive(true),
      );
      return () => globalThis.cancelAnimationFrame(fallbackFrame);
    }

    lastScrollYRef.current = globalThis.scrollY;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        const currentScrollY = globalThis.scrollY;
        const isScrollingDown = currentScrollY >= lastScrollYRef.current;
        lastScrollYRef.current = currentScrollY;

        if (entry.isIntersecting) {
          if (isScrollingDown && hasExitedAboveRef.current) {
            setIsActive(false);
            globalThis.requestAnimationFrame(() => setIsActive(true));
            hasExitedAboveRef.current = false;
            return;
          }

          setIsActive(true);
          return;
        }

        if (entry.boundingClientRect.bottom <= 0) {
          hasExitedAboveRef.current = true;
          setIsActive(false);
        }
      },
      {
        rootMargin: "0px 0px -20% 0px",
        threshold: 0.28,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="agenda"
      className={`section-band agenda-band agenda-launch-band ${
        isActive ? "is-active" : ""
      }`}
      ref={sectionRef}
    >
      <div className="section-inner agenda-launch-inner">
        <div className="section-heading centered agenda-title-stage">
          <p className="eyebrow">Election-ready sections</p>
          <h2>What this website should show beyond the hero.</h2>
          <p>
            A political website needs policy depth, trust signals, local action,
            and regular reporting, not just a campaign slogan.
          </p>
        </div>

        <div className="agenda-launch-stage">
          <div className="agenda-origin" aria-hidden="true">
            <span className="agenda-logo-ring" />
            <span className="agenda-logo-mark">{PARTY_SHORT_NAME}</span>
          </div>

          <div className="agenda-grid agenda-launch-grid">
            {AGENDA_ITEMS.map(({ Icon, ...item }, index) => {
              const vector =
                CARD_LAUNCH_VECTORS[index] ?? CARD_LAUNCH_VECTORS[0];
              const cardStyle = {
                "--launch-x": vector.x,
                "--launch-y": vector.y,
                "--launch-index": index,
              } as CSSProperties;

              return (
                <article
                  className="agenda-card agenda-launch-card"
                  key={item.title}
                  style={cardStyle}
                >
                  <div className="card-icon">
                    <Icon aria-hidden="true" size={22} />
                  </div>
                  <p>{item.area}</p>
                  <h3>{item.title}</h3>
                  <span>{item.copy}</span>
                </article>
              );
            })}
          </div>

          <div className="timeline-strip agenda-timeline-launch">
            {TIMELINE_ITEMS.map((item, index) => {
              const itemStyle = {
                "--timeline-index": index,
              } as CSSProperties;

              return (
                <div key={item} style={itemStyle}>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
