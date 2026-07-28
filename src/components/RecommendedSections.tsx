"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { RECOMMENDED_SECTIONS } from "@/data/partyContent";

export default function RecommendedSections() {
  const [visibleCount, setVisibleCount] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const visibleCountRef = useRef(0);

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    let frameId = 0;
    const totalSections = RECOMMENDED_SECTIONS.length;

    const updateVisibleCount = () => {
      frameId = 0;

      const { top } = list.getBoundingClientRect();
      const viewportHeight = Math.max(globalThis.innerHeight, 1);
      const startLine = viewportHeight * 0.86;
      const finishLine = viewportHeight * 0.18;
      const rawProgress = (startLine - top) / (startLine - finishLine);
      const progress = Math.min(1, Math.max(0, rawProgress));
      const nextVisibleCount = Math.ceil(progress * totalSections);

      if (nextVisibleCount !== visibleCountRef.current) {
        visibleCountRef.current = nextVisibleCount;
        setVisibleCount(nextVisibleCount);
      }
    };

    const scheduleUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = globalThis.requestAnimationFrame(updateVisibleCount);
    };

    scheduleUpdate();

    globalThis.addEventListener("scroll", scheduleUpdate, { passive: true });
    globalThis.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId) {
        globalThis.cancelAnimationFrame(frameId);
      }

      globalThis.removeEventListener("scroll", scheduleUpdate);
      globalThis.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <section className="section-band recommended-band">
      <div className="section-inner recommended-layout">
        <div className="section-heading recommended-copy reveal-up">
          <p className="eyebrow">Recommended sections</p>
          <h2>Pages this party site must have.</h2>
          <p>
            These are the sections I would add before launch so the website
            feels serious, transparent, and campaign-ready.
          </p>
        </div>

        <div className="recommended-list" ref={listRef}>
          {RECOMMENDED_SECTIONS.map((section, index) => {
            const sectionId = section.title;
            const isVisible = index < visibleCount;
            const rowStyle = {
              "--drop-index": index,
            } as CSSProperties;

            return (
              <article
                className={`recommended-row recommended-drop-card ${
                  isVisible ? "is-visible" : ""
                }`}
                key={sectionId}
                style={rowStyle}
              >
                <span>{section.tag}</span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.copy}</p>
                </div>
                <ArrowRight aria-hidden="true" size={18} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
