"use client";

import {
  type AnimationEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import type { BookSpread } from "@/types/party";

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

const BOOK_PAGE_IMAGE_HEIGHT = 1320;
const BOOK_PAGE_IMAGE_SIZES =
  "(max-width: 700px) 330px, (max-width: 1200px) 44vw, 520px";
const BOOK_PAGE_IMAGE_WIDTH = 1020;

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
      height={BOOK_PAGE_IMAGE_HEIGHT}
      priority={page.pageNumber <= 4}
      sizes={BOOK_PAGE_IMAGE_SIZES}
      src={page.imageSrc}
      width={BOOK_PAGE_IMAGE_WIDTH}
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

export default function BookReader({
  compact = false,
  pages,
  partyName,
  title,
}: BookReaderProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pendingTurn, setPendingTurn] = useState<BookTurn | null>(null);
  const [turn, setTurn] = useState<BookTurn | null>(null);
  const pendingTurnRef = useRef<BookTurn | null>(null);
  const preloadedPageImagesRef = useRef<Set<string>>(new Set());
  const preloadContainerRef = useRef<HTMLDivElement | null>(null);
  const turnRef = useRef<BookTurn | null>(null);
  const isMobileBook = useMediaQuery("(max-width: 700px)");
  const pageStep = isMobileBook ? 1 : 2;
  const hasPages = pages.length > 0;
  const pageImageSources = useMemo(
    () =>
      Array.from(
        new Set(
          pages
            .map((page) => page.imageSrc)
            .filter((source): source is string => Boolean(source)),
        ),
      ),
    [pages],
  );
  const maxStartIndex = useMemo(() => {
    if (pages.length <= 1) {
      return 0;
    }

    if (isMobileBook) {
      return pages.length - 1;
    }

    return pages.length % 2 === 0 ? pages.length - 2 : pages.length - 1;
  }, [isMobileBook, pages.length]);
  const safePageIndex = Math.min(pageIndex, maxStartIndex);
  const readablePageIndex = safePageIndex;
  const bookTitle = title || "Book Reader";

  const leftPage = pages[readablePageIndex];
  const rightPage = pages[readablePageIndex + 1] ?? leftPage;
  const currentMobilePage = pages[readablePageIndex];
  const targetMobilePage = turn
    ? pages[turn.targetIndex]
    : currentMobilePage;
  const targetLeftPage = turn ? pages[turn.targetIndex] : leftPage;
  const targetRightPage = turn
    ? pages[turn.targetIndex + 1] ?? targetLeftPage
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
  const isPreparingTurn = Boolean(pendingTurn);
  const isTurning = Boolean(turn);
  const isReaderBusy = isTurning || isPreparingTurn;

  const arePagesReadyForIndex = useCallback(
    (
      targetIndex: number,
      loadedImages: Set<string> = preloadedPageImagesRef.current,
    ) => {
      const isPageReady = (page: BookSpread | undefined) =>
        !page?.imageSrc || loadedImages.has(page.imageSrc);

      if (isMobileBook) {
        return isPageReady(pages[targetIndex]);
      }

      const targetLeft = pages[targetIndex];
      const targetRight = pages[targetIndex + 1] ?? targetLeft;

      return isPageReady(targetLeft) && isPageReady(targetRight);
    },
    [isMobileBook, pages],
  );

  const markPageImageLoaded = useCallback(
    (source: string) => {
      const loadedImages = preloadedPageImagesRef.current;
      loadedImages.add(source);

      const waitingTurn = pendingTurnRef.current;
      if (
        waitingTurn &&
        !turnRef.current &&
        arePagesReadyForIndex(waitingTurn.targetIndex, loadedImages)
      ) {
        pendingTurnRef.current = null;
        turnRef.current = waitingTurn;
        setTurn(waitingTurn);
        setPendingTurn(null);
      }
    },
    [arePagesReadyForIndex],
  );

  const syncCompletePreloadImages = useCallback(() => {
    preloadContainerRef.current
      ?.querySelectorAll<HTMLImageElement>("img[data-book-preload-src]")
      .forEach((image) => {
        const source = image.dataset.bookPreloadSrc;

        if (source && image.complete) {
          markPageImageLoaded(source);
        }
      });
  }, [markPageImageLoaded]);

  useEffect(() => {
    pendingTurnRef.current = pendingTurn;
  }, [pendingTurn]);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  useEffect(() => {
    syncCompletePreloadImages();
  }, [pageImageSources, syncCompletePreloadImages]);

  const spreadLabel = useMemo(
    () => {
      if (pendingTurn) {
        return "Preparing pages...";
      }

      return !hasPages
        ? "No pages"
        : isMobileBook
        ? `Page ${targetMobilePage.pageNumber}`
        : `Pages ${targetLeftPage.pageNumber}-${targetRightPage.pageNumber}`;
    },
    [
      hasPages,
      isMobileBook,
      pendingTurn,
      targetLeftPage?.pageNumber,
      targetMobilePage?.pageNumber,
      targetRightPage?.pageNumber,
    ],
  );

  function requestTurn(nextTurn: BookTurn) {
    if (arePagesReadyForIndex(nextTurn.targetIndex)) {
      turnRef.current = nextTurn;
      setTurn(nextTurn);
      return;
    }

    pendingTurnRef.current = nextTurn;
    setPendingTurn(nextTurn);
    syncCompletePreloadImages();
  }

  function goNext() {
    if (isLastSpread || isReaderBusy) {
      return;
    }

    const targetIndex = Math.min(safePageIndex + pageStep, maxStartIndex);

    requestTurn({
      direction: "next",
      targetIndex,
    });
  }

  function goPrevious() {
    if (isFirstSpread || isReaderBusy) {
      return;
    }

    const targetIndex = Math.max(safePageIndex - pageStep, 0);

    requestTurn({
      direction: "previous",
      targetIndex,
    });
  }

  function resetBook() {
    if (isReaderBusy || isFirstSpread) {
      return;
    }

    requestTurn({
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
    turnRef.current = null;
    setTurn(null);
  }

  return (
    <div className={`${compact ? "book-shell compact" : "book-shell"} pdf-book`}>
      {pageImageSources.length > 0 && (
        <div
          aria-hidden="true"
          className="book-preload-cache"
          ref={preloadContainerRef}
        >
          {pageImageSources.map((source) => (
            <Image
              alt=""
              className="book-preload-image"
              data-book-preload-src={source}
              draggable={false}
              fetchPriority="low"
              height={BOOK_PAGE_IMAGE_HEIGHT}
              key={source}
              loading="eager"
              onError={() => markPageImageLoaded(source)}
              onLoad={() => markPageImageLoaded(source)}
              sizes={BOOK_PAGE_IMAGE_SIZES}
              src={source}
              width={BOOK_PAGE_IMAGE_WIDTH}
            />
          ))}
        </div>
      )}

      <div className="book-toolbar">
        <div>
          <p className="eyebrow">Party book</p>
          <h2>{compact ? "Manifesto Reader" : bookTitle}</h2>
        </div>
        <span className="spread-count">{spreadLabel}</span>
      </div>

      {hasPages ? (
        <div
          className={`book-stage ${isMobileBook ? "mobile-book-stage" : ""}`}
          aria-live="polite"
        >
          {isMobileBook ? (
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
          disabled={!hasPages || isFirstSpread || isReaderBusy}
        >
          <ChevronLeft aria-hidden="true" size={18} />
          Previous
        </button>
        <button
          type="button"
          aria-label={`Reset ${partyName} book`}
          onClick={resetBook}
          disabled={!hasPages || isFirstSpread || isReaderBusy}
        >
          <RotateCcw aria-hidden="true" size={16} />
          Reset
        </button>
        <button
          type="button"
          aria-label="Next spread"
          onClick={goNext}
          disabled={!hasPages || isLastSpread || isReaderBusy}
        >
          Next
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}
