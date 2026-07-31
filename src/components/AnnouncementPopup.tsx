"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import type { PublicContentItem } from "@/types/party";

const ANNOUNCEMENT_SESSION_KEY = "adp:seen-announcement";
const seenAnnouncementKeys = new Set<string>();

function hasSeenAnnouncement(announcementKey: string) {
  if (!announcementKey) {
    return true;
  }

  if (seenAnnouncementKeys.has(announcementKey)) {
    return true;
  }

  try {
    return (
      window.sessionStorage.getItem(ANNOUNCEMENT_SESSION_KEY) ===
      announcementKey
    );
  } catch {
    return false;
  }
}

function rememberSeenAnnouncement(announcementKey: string) {
  if (!announcementKey) {
    return;
  }

  seenAnnouncementKeys.add(announcementKey);

  try {
    window.sessionStorage.setItem(ANNOUNCEMENT_SESSION_KEY, announcementKey);
  } catch {
    // In-memory fallback still prevents repeats during this page session.
  }
}

export default function AnnouncementPopup({
  latestAnnouncement,
}: {
  latestAnnouncement?: PublicContentItem;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAnnouncementRoute =
    pathname === "/announcements" || pathname.startsWith("/announcements/");
  const isSuppressedRoute = isAdminRoute || isAnnouncementRoute;
  const hasAnnouncement = Boolean(latestAnnouncement);
  const announcementKey = latestAnnouncement
    ? `${latestAnnouncement.href}:${latestAnnouncement.meta}:${latestAnnouncement.title}`
    : "";
  const [isOpen, setIsOpen] = useState(false);

  const closeAnnouncement = useCallback(() => {
    rememberSeenAnnouncement(announcementKey);
    setIsOpen(false);
  }, [announcementKey]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const shouldOpen =
        hasAnnouncement &&
        !isSuppressedRoute &&
        Boolean(announcementKey) &&
        !hasSeenAnnouncement(announcementKey);

      if (shouldOpen) {
        rememberSeenAnnouncement(announcementKey);
      }

      setIsOpen(shouldOpen);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [announcementKey, hasAnnouncement, isSuppressedRoute]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAnnouncement();
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeAnnouncement, isOpen]);

  if (isSuppressedRoute || !isOpen || !latestAnnouncement) {
    return null;
  }

  return (
    <div className="announcement-overlay no-print">
      <aside
        aria-labelledby="announcement-popup-title"
        aria-modal="true"
        className="announcement-modal"
        role="dialog"
      >
        <button
          aria-label="Close announcement"
          className="announcement-close"
          onClick={closeAnnouncement}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>

        <div className="announcement-heading-row">
          <div className="announcement-icon">
            <Bell aria-hidden="true" size={21} />
          </div>
          <p className="eyebrow">Latest announcement</p>
        </div>
        <h2 id="announcement-popup-title">{latestAnnouncement.title}</h2>
        <p className="preserve-entered-text">{latestAnnouncement.summary}</p>

        <div className="announcement-actions">
          <Link
            className="primary-button"
            href="/announcements"
            onClick={closeAnnouncement}
          >
            View announcements
          </Link>
          <button
            className="secondary-button dark-button"
            onClick={closeAnnouncement}
            type="button"
          >
            Continue to site
          </button>
        </div>
      </aside>
    </div>
  );
}
