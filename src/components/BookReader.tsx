"use client";

import { type AnimationEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Landmark,
  LockKeyhole,
  Mail,
  RotateCcw,
} from "lucide-react";
import type { BookSpread } from "@/types/party";

const PUBLIC_PREVIEW_PAGE_LIMIT = 4;

type TurnDirection = "next" | "previous" | null;

type BookReaderProps = {
  compact?: boolean;
  pages: BookSpread[];
  partyName: string;
  title: string;
};

type BookTurn = {
  direction: Exclude<TurnDirection, null>;
  targetIndex: number;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQuery.matches);

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);

    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, [query]);

  return matches;
}

function renderBookPage(
  page: BookSpread,
  className: string,
  bookTitle: string,
  ariaHidden = false,
) {
  const bodyParagraphs = page.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const pageImage = page.imageSrc ? (
    <Image
      alt={ariaHidden ? "" : page.imageAlt || `${bookTitle}, page ${page.pageNumber}`}
      className="book-page-image"
      draggable={false}
      height={1320}
      priority={page.pageNumber <= 4}
      sizes="(max-width: 700px) 330px, (max-width: 1200px) 44vw, 520px"
      src={page.imageSrc}
      width={1020}
    />
  ) : null;

  return (
    <article
      aria-hidden={ariaHidden || undefined}
      className={`book-page ${pageImage ? "book-page-pdf" : ""} ${className}`}
    >
      {pageImage || (
        <>
          <p>{page.kicker}</p>
          <h3>{page.title}</h3>
          <div className="book-page-body">
            {bodyParagraphs.map((paragraph, index) => (
              <span
                className={paragraph.length <= 72 ? "book-page-subhead" : undefined}
                key={`${page.pageNumber}-${index}`}
              >
                {paragraph}
              </span>
            ))}
          </div>
          <strong>{page.pageNumber}</strong>
        </>
      )}
    </article>
  );
}

function renderTurningPage(page: BookSpread, className: string, bookTitle: string) {
  return renderBookPage(page, `turning-paper ${className}`, bookTitle, true);
}

function renderLockedNotice(partyName: string, lockedPageCount: number) {
  return (
    <div className="book-locked-panel">
      <div className="book-lock-mark">
        <LockKeyhole aria-hidden="true" size={28} />
      </div>
      <p className="eyebrow">Preview complete</p>
      <h3>Buy to unlock the complete book.</h3>
      <p>
        The first four pages are open for public preview. To unlock the full
        book, pay at the official party bank account and share your payment
        reference with the email address where you want to receive the book.
      </p>
      <div className="book-unlock-notes">
        <span>
          <Landmark aria-hidden="true" size={17} />
          {partyName} bank details are listed in the funding section.
        </span>
        <span>
          <Mail aria-hidden="true" size={17} />
          The complete book will be emailed within 12 hours after confirmation.
        </span>
      </div>
      <Link className="primary-button" href="/#funding">
        View funding details
      </Link>
      <small>{lockedPageCount} pages are locked in this public preview.</small>
    </div>
  );
}

export default function BookReader({
  compact = false,
  pages,
  partyName,
  title,
}: BookReaderProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [turn, setTurn] = useState<BookTurn | null>(null);
  const isMobileBook = useMediaQuery("(max-width: 700px)");
  const pageStep = isMobileBook ? 1 : 2;
  const visiblePages = useMemo(
    () => pages.slice(0, PUBLIC_PREVIEW_PAGE_LIMIT),
    [pages],
  );
  const hasLockedPages = pages.length > visiblePages.length;
  const lockedPageCount = Math.max(pages.length - visiblePages.length, 0);
  const hasPages = visiblePages.length > 0;
  const lockedIndex = visiblePages.length;
  const maxReadableStartIndex = Math.max(visiblePages.length - pageStep, 0);
  const maxStartIndex = hasLockedPages ? lockedIndex : maxReadableStartIndex;
  const safePageIndex = Math.min(pageIndex, maxStartIndex);
  const isLockedSpread = hasLockedPages && safePageIndex >= lockedIndex;
  const readablePageIndex = Math.min(safePageIndex, maxReadableStartIndex);
  const bookTitle = title || "Book Reader";

  const leftPage = visiblePages[readablePageIndex];
  const rightPage = visiblePages[readablePageIndex + 1] ?? leftPage;
  const currentMobilePage = visiblePages[readablePageIndex];
  const targetMobilePage = turn
    ? visiblePages[turn.targetIndex]
    : currentMobilePage;
  const targetLeftPage = turn ? visiblePages[turn.targetIndex] : leftPage;
  const targetRightPage = turn
    ? visiblePages[turn.targetIndex + 1] ?? targetLeftPage
    : rightPage;
  const visibleLeftPage =
    turn?.direction === "previous" ? targetLeftPage : leftPage;
  const visibleRightPage =
    turn?.direction === "next" ? targetRightPage : rightPage;
  const incomingTurningPage = turn
    ? isMobileBook
      ? targetMobilePage
        : turn.direction === "next"
          ? targetLeftPage
          : targetRightPage
    : currentMobilePage;
  const isFirstSpread = safePageIndex === 0;
  const isLastSpread = safePageIndex >= maxStartIndex;
  const isTurning = Boolean(turn);

  const spreadLabel = useMemo(
    () =>
      !hasPages
        ? "No pages"
        : isLockedSpread
          ? "Locked pages"
        :
      isMobileBook
        ? `Page ${targetMobilePage.pageNumber}`
        : `Pages ${targetLeftPage.pageNumber}-${targetRightPage.pageNumber}`,
    [
      hasPages,
      isLockedSpread,
      isMobileBook,
      targetLeftPage?.pageNumber,
      targetMobilePage?.pageNumber,
      targetRightPage?.pageNumber,
    ],
  );

  function goNext() {
    if (isLastSpread || isTurning) {
      return;
    }

    const targetIndex = Math.min(safePageIndex + pageStep, maxStartIndex);

    if (hasLockedPages && targetIndex >= lockedIndex) {
      setPageIndex(lockedIndex);
      setTurn(null);
      return;
    }

    setTurn({
      direction: "next",
      targetIndex,
    });
  }

  function goPrevious() {
    if (isFirstSpread || isTurning) {
      return;
    }

    const targetIndex = Math.max(safePageIndex - pageStep, 0);

    if (isLockedSpread) {
      setPageIndex(targetIndex);
      setTurn(null);
      return;
    }

    setTurn({
      direction: "previous",
      targetIndex,
    });
  }

  function resetBook() {
    if (isTurning || isFirstSpread) {
      return;
    }

    if (isLockedSpread) {
      setPageIndex(0);
      setTurn(null);
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
    <div className={`${compact ? "book-shell compact" : "book-shell"} pdf-book`}>
      <div className="book-toolbar">
        <div>
          <p className="eyebrow">Party book</p>
          <h2>{compact ? "Manifesto Reader" : bookTitle}</h2>
        </div>
        <span className="spread-count">{spreadLabel}</span>
      </div>

      {hasPages ? (
        <div
          className={`book-stage ${isLockedSpread ? "is-locked-stage" : ""} ${isMobileBook ? "mobile-book-stage" : ""} ${turn?.direction === "next" ? "is-turning-next" : ""} ${
            turn?.direction === "previous" ? "is-turning-previous" : ""
          }`}
          aria-live="polite"
        >
          {isLockedSpread ? (
            renderLockedNotice(partyName, lockedPageCount)
          ) : isMobileBook ? (
            renderBookPage(
              turn ? targetMobilePage : currentMobilePage,
              "mobile-page",
              bookTitle,
            )
          ) : (
            <>
              {renderBookPage(visibleLeftPage, "left-page", bookTitle)}
              {renderBookPage(visibleRightPage, "right-page", bookTitle)}
            </>
          )}

          {turn && (
            <>
              <div
                aria-hidden="true"
                className={`turning-sheet turning-${turn.direction}`}
                onAnimationEnd={finishTurn}
              >
                <div className="turning-face page-front">
                  {renderTurningPage(
                    incomingTurningPage,
                    isMobileBook
                      ? "mobile-page"
                      : turn.direction === "next"
                        ? "right-page"
                        : "left-page",
                    bookTitle,
                  )}
                </div>
                <div className="turning-face page-back">
                  {renderTurningPage(
                    incomingTurningPage,
                    isMobileBook
                      ? "mobile-page"
                      : turn.direction === "next"
                        ? "left-page"
                        : "right-page",
                    bookTitle,
                  )}
                </div>
              </div>

              <div
                aria-hidden="true"
                className={`readable-turn-sheet readable-${turn.direction}`}
              >
                {renderBookPage(
                  incomingTurningPage,
                  `readable-turn-paper ${
                    isMobileBook
                      ? "mobile-page"
                      : turn.direction === "next"
                        ? "left-page"
                        : "right-page"
                  }`,
                  bookTitle,
                  true,
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="book-empty">
          <p>No book pages have been published yet.</p>
        </div>
      )}

      <div className="book-controls">
        <button
          type="button"
          aria-label="Previous spread"
          onClick={goPrevious}
          disabled={!hasPages || isFirstSpread || isTurning}
        >
          <ChevronLeft aria-hidden="true" size={18} />
          Previous
        </button>
        <button
          type="button"
          aria-label={`Reset ${partyName} book`}
          onClick={resetBook}
          disabled={!hasPages || isFirstSpread || isTurning}
        >
          <RotateCcw aria-hidden="true" size={16} />
          Reset
        </button>
        <button
          type="button"
          aria-label="Next spread"
          onClick={goNext}
          disabled={!hasPages || isLastSpread || isTurning}
        >
          Next
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}
