"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useEffect } from "react";

const TRACKABLE_ELEMENTS =
  "a, button, [role='button'], [data-analytics-label]";
const MAX_PARAMETER_LENGTH = 100;

function normalizeParameter(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_PARAMETER_LENGTH);
}

function getLinkTarget(link: HTMLAnchorElement) {
  const rawHref = link.getAttribute("href");

  if (!rawHref) {
    return "link";
  }

  try {
    const url = new URL(rawHref, window.location.href);

    if (url.protocol === "mailto:") {
      return "email";
    }

    if (url.protocol === "tel:") {
      return "phone";
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return url.protocol.replace(":", "") || "link";
    }

    const safeHash = /^#[a-z][\w-]*$/i.test(url.hash) ? url.hash : "";

    if (url.origin === window.location.origin) {
      return `${url.pathname}${safeHash}`;
    }

    return `${url.hostname}${url.pathname}`;
  } catch {
    return "link";
  }
}

function getElementLabel(element: HTMLElement, link: HTMLAnchorElement | null) {
  if (link?.protocol === "mailto:") {
    return "Email link";
  }

  if (link?.protocol === "tel:") {
    return "Phone link";
  }

  const label =
    element.dataset.analyticsLabel ||
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent ||
    element.id ||
    element.tagName.toLowerCase();

  return normalizeParameter(label);
}

function getClickSection(element: HTMLElement) {
  const section = element.closest<HTMLElement>(
    "[data-analytics-section], section, header, footer, nav, main",
  );

  if (!section) {
    return "page";
  }

  return normalizeParameter(
    section.dataset.analyticsSection ||
      section.id ||
      section.getAttribute("aria-label") ||
      section.tagName.toLowerCase(),
  );
}

export default function GoogleAnalyticsEvents() {
  useEffect(() => {
    const trackClick = (event: MouseEvent) => {
      if (window.location.pathname.startsWith("/admin")) {
        return;
      }

      const eventTarget = event.target;

      if (!(eventTarget instanceof Element)) {
        return;
      }

      const element = eventTarget.closest<HTMLElement>(TRACKABLE_ELEMENTS);

      if (
        !element ||
        element.closest("[data-analytics-ignore]") ||
        element.getAttribute("aria-disabled") === "true" ||
        (element instanceof HTMLButtonElement && element.disabled)
      ) {
        return;
      }

      const link = element instanceof HTMLAnchorElement ? element : null;
      const clickType = link
        ? "link"
        : element instanceof HTMLButtonElement
          ? "button"
          : element.getAttribute("role") || element.tagName.toLowerCase();

      sendGAEvent("event", "ui_click", {
        click_section: getClickSection(element),
        click_target: link
          ? getLinkTarget(link)
          : normalizeParameter(element.id ? `#${element.id}` : clickType),
        click_text: getElementLabel(element, link),
        click_type: clickType,
        page_path: window.location.pathname,
      });
    };

    // Capture before a Next.js link can change window.location, so page_path is
    // always the page where the interaction started.
    document.addEventListener("click", trackClick, true);

    return () => document.removeEventListener("click", trackClick, true);
  }, []);

  return null;
}
