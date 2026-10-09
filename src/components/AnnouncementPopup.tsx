"use client";

import { useEffect, useState } from "react";
import Link from "@/components/NoCacheLink";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import type { PublicContentItem } from "@/types/party";

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
  const [isOpen, setIsOpen] = useState(false);

  const closeAnnouncement = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const shouldOpen =
        hasAnnouncement &&
        !isSuppressedRoute;

      setIsOpen(shouldOpen);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hasAnnouncement, isSuppressedRoute]);

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
  }, [isOpen]);

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
            prefetch={false}
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
