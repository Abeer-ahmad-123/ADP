"use client";

import { type AnimationEvent, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { BOOK_SPREADS, PARTY_NAME } from "@/data/partyContent";
import type { BookSpread } from "@/types/party";

type TurnDirection = "next" | "previous" | null;

type BookReaderProps = {
  compact?: boolean;
};

type BookTurn = {
  direction: Exclude<TurnDirection, null>;
  targetIndex: number;
};

function renderBookPage(
  page: BookSpread,
  className: string,
  ariaHidden = false,
) {
  return (
    <article
      aria-hidden={ariaHidden || undefined}
      className={`book-page ${className}`}
    >
      <p>{page.kicker}</p>
      <h3>{page.title}</h3>
      <span>{page.body}</span>
      <strong>{page.pageNumber}</strong>
    </article>
  );
}

function renderTurningPage(page: BookSpread, className: string) {
  return renderBookPage(page, `turning-paper ${className}`, true);
}

export default function BookReader({ compact = false }: BookReaderProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [turn, setTurn] = useState<BookTurn | null>(null);

  const leftPage = BOOK_SPREADS[pageIndex];
  const rightPage = BOOK_SPREADS[pageIndex + 1] ?? BOOK_SPREADS[0];
  const targetLeftPage = turn ? BOOK_SPREADS[turn.targetIndex] : leftPage;
  const targetRightPage = turn
    ? BOOK_SPREADS[turn.targetIndex + 1] ?? BOOK_SPREADS[0]
    : rightPage;
  const visibleLeftPage = turn ? targetLeftPage : leftPage;
  const visibleRightPage = turn ? targetRightPage : rightPage;
  const turningFrontPage =
    turn?.direction === "next" ? rightPage : leftPage;
  const turningBackPage =
    turn?.direction === "next" ? targetLeftPage : targetRightPage;
  const isFirstSpread = pageIndex === 0;
  const isLastSpread = pageIndex >= BOOK_SPREADS.length - 2;
  const isTurning = Boolean(turn);

  const spreadLabel = useMemo(
    () =>
      `Pages ${visibleLeftPage.pageNumber}-${visibleRightPage.pageNumber}`,
    [visibleLeftPage.pageNumber, visibleRightPage.pageNumber],
  );

  function goNext() {
    if (isLastSpread || isTurning) {
      return;
    }

    setTurn({
      direction: "next",
      targetIndex: Math.min(pageIndex + 2, BOOK_SPREADS.length - 2),
    });
  }

  function goPrevious() {
    if (isFirstSpread || isTurning) {
      return;
    }

    setTurn({
      direction: "previous",
      targetIndex: Math.max(pageIndex - 2, 0),
    });
  }

  function resetBook() {
    if (isTurning || isFirstSpread) {
      return;
    }

    setTurn({
      direction: "previous",
      targetIndex: 0,
    });
  }

  function finishTurn(event: AnimationEvent<HTMLDivElement>) {
    if (event.currentTarget !== event.target) {
      return;
    }

    if (!turn) {
      return;
    }

    setPageIndex(turn.targetIndex);
    setTurn(null);
  }

  return (
    <div className={compact ? "book-shell compact" : "book-shell"}>
      <div className="book-toolbar">
        <div>
          <p className="eyebrow">Party book</p>
          <h2>{compact ? "Manifesto Reader" : "The Nayi Subah Notebook"}</h2>
        </div>
        <span className="spread-count">{spreadLabel}</span>
      </div>

      <div
        className={`book-stage ${turn?.direction === "next" ? "is-turning-next" : ""} ${
          turn?.direction === "previous" ? "is-turning-previous" : ""
        }`}
        aria-live="polite"
      >
        {renderBookPage(visibleLeftPage, "left-page")}
        {renderBookPage(visibleRightPage, "right-page")}

        {turn && (
          <div
            aria-hidden="true"
            className={`turning-sheet turning-${turn.direction}`}
            onAnimationEnd={finishTurn}
          >
            <div className="turning-face page-front">
              {renderTurningPage(
                turningFrontPage,
                turn.direction === "next" ? "right-page" : "left-page",
              )}
            </div>
            <div className="turning-face page-back">
              {renderTurningPage(
                turningBackPage,
                turn.direction === "next" ? "left-page" : "right-page",
              )}
            </div>
          </div>
        )}
      </div>

      <div className="book-controls">
        <button
          type="button"
          aria-label="Previous spread"
          onClick={goPrevious}
          disabled={isFirstSpread || isTurning}
        >
          <ChevronLeft aria-hidden="true" size={18} />
          Previous
        </button>
        <button
          type="button"
          aria-label={`Reset ${PARTY_NAME} book`}
          onClick={resetBook}
          disabled={isFirstSpread || isTurning}
        >
          <RotateCcw aria-hidden="true" size={16} />
          Reset
        </button>
        <button
          type="button"
          aria-label="Next spread"
          onClick={goNext}
          disabled={isLastSpread || isTurning}
        >
          Next
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}
