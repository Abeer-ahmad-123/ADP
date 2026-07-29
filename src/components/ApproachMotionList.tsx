"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { ApproachPoint } from "@/types/party";

export default function ApproachMotionList({
  points,
}: {
  points: ApproachPoint[];
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const visibleCountRef = useRef(0);

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    let frameId = 0;
    const totalSections = points.length;

    const updateVisibleCount = () => {
      frameId = 0;

      const { top } = list.getBoundingClientRect();
      const viewportHeight = Math.max(globalThis.innerHeight, 1);
      const startLine = viewportHeight * 0.86;
      const finishLine = viewportHeight * 0.2;
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
  }, [points.length]);

  return (
    <div className="approach-list" ref={listRef}>
      {points.map((point, index) => {
        const isVisible = index < visibleCount;
        const itemStyle = {
          "--drop-index": index,
        } as CSSProperties;

        return (
          <article
            className={`approach-item approach-drop-card ${
              isVisible ? "is-visible" : ""
            }`}
            key={point.title}
            style={itemStyle}
          >
            <span>{point.number}</span>
            <div>
              <h3>{point.title}</h3>
              <p>{point.copy}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
