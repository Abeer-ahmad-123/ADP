"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Landmark,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import {
  PARTY_LOGO_SRC,
  PARTY_SHORT_NAME,
  TIMELINE_ITEMS,
} from "@/data/partyContent";
import type { ElectionPlatformItem } from "@/types/party";

const CARD_LAUNCH_VECTORS = [
  { x: "52%", y: "126px" },
  { x: "-52%", y: "126px" },
  { x: "52%", y: "-126px" },
  { x: "-52%", y: "-126px" },
];

const AGENDA_ICONS = [Landmark, ShieldCheck, Banknote, MapPinned];

export default function AgendaSection({
  items,
}: {
  items: ElectionPlatformItem[];
}) {
  const [isActive, setIsActive] = useState(false);
  const isReadyToAnimateFromTopRef = useRef(true);
  const restartFrameRef = useRef<number | null>(null);
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
          if (isScrollingDown && isReadyToAnimateFromTopRef.current) {
            if (restartFrameRef.current !== null) {
              globalThis.cancelAnimationFrame(restartFrameRef.current);
            }

            setIsActive(false);
            restartFrameRef.current = globalThis.requestAnimationFrame(() => {
              setIsActive(true);
              restartFrameRef.current = null;
            });
            isReadyToAnimateFromTopRef.current = false;
            return;
          }

          setIsActive(true);
          return;
        }

        const viewportHeight =
          entry.rootBounds?.height ?? globalThis.innerHeight;

        if (entry.boundingClientRect.top >= viewportHeight) {
          isReadyToAnimateFromTopRef.current = true;
          setIsActive(false);
          return;
        }

        if (entry.boundingClientRect.bottom <= 0) {
          isReadyToAnimateFromTopRef.current = false;
          setIsActive(true);
        }
      },
      {
        rootMargin: "0px",
        threshold: 0.01,
      },
    );

    observer.observe(section);

    return () => {
      if (restartFrameRef.current !== null) {
        globalThis.cancelAnimationFrame(restartFrameRef.current);
      }

      observer.disconnect();
    };
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
          <p className="eyebrow">Election platform</p>
          <h2>From manifesto pillars to public delivery.</h2>
          <p>
            These priorities come from the party manifesto and give voters a
            clear view of what Awam Dost Party will organize, campaign on, and
            measure after election day.
          </p>
        </div>

        <div className="agenda-launch-stage">
          <div className="agenda-origin" aria-hidden="true">
            <span className="agenda-logo-ring" />
            <span className="agenda-logo-mark">
              <Image
                alt=""
                fill
                sizes="96px"
                src={PARTY_LOGO_SRC}
              />
              <span className="sr-only">{PARTY_SHORT_NAME}</span>
            </span>
          </div>

          <div className="agenda-grid agenda-launch-grid">
            {items.map((item, index) => {
              const Icon = AGENDA_ICONS[index] ?? AGENDA_ICONS[0];
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
                  key={`${item.area}-${item.title}`}
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
