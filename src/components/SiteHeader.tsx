"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpenText,
  ChevronDown,
  CreditCard,
  Menu,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  PARTY_LOGO_ALT,
  PARTY_LOGO_SRC,
  PARTY_SHORT_NAME,
} from "@/data/partyContent";

const primaryNavLinks = [
  { href: "/manifesto", label: "Manifesto" },
  { href: "/#agenda", label: "Agenda" },
  { href: "/book", label: "Book" },
  { href: "/#register", label: "Register" },
  // { href: "/#funding", label: "Funding" },
];

const secondaryNavLinks = [
  { href: "/news", label: "News" },
  { href: "/blogs", label: "Blogs" },
  { href: "/announcements", label: "Announcements" },
  { href: "/leadership", label: "Leadership" },
  { href: "/media", label: "Media" },
  { href: "/gallery", label: "Gallery" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const closeMenus = () => {
    setMenuOpen(false);
    setMoreOpen(false);
  };
  const toggleMenu = () => {
    if (menuOpen) {
      setMoreOpen(false);
    }

    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && !moreMenuRef.current?.contains(target)) {
        setMoreOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  return (
    <header className={`site-header no-print ${menuOpen ? "is-menu-open" : ""}`}>
      <Link className="brand-lockup" href="/" onClick={closeMenus}>
        <span className="brand-mark">
          <Image
            alt={PARTY_LOGO_ALT}
            fill
            priority
            sizes="42px"
            src={PARTY_LOGO_SRC}
          />
          <span className="sr-only">{PARTY_SHORT_NAME}</span>
        </span>
        <strong>Awam Dost</strong>
      </Link>

      <nav id="site-navigation" aria-label="Main navigation">
        {primaryNavLinks.map((link) => (
          <Link href={link.href} key={link.href} onClick={closeMenus}>
            {link.label}
          </Link>
        ))}
        <div
          className={`nav-more ${moreOpen ? "is-open" : ""}`}
          ref={moreMenuRef}
        >
          <button
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className="nav-more-button"
            onPointerDown={(event) => {
              event.stopPropagation();
              setMoreOpen((current) => !current);
            }}
            type="button"
          >
            More
            <ChevronDown aria-hidden="true" size={16} />
          </button>
          <div className="nav-more-menu" role="menu">
            {secondaryNavLinks.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                onClick={closeMenus}
                role="menuitem"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="header-actions">
        <Link
          className="icon-button"
          aria-label="Open book page"
          href="/book"
          onClick={closeMenus}
        >
          <BookOpenText aria-hidden="true" size={18} />
        </Link>
        <Link
          className="icon-button"
          aria-label="Register as member"
          href="/#register"
          onClick={closeMenus}
        >
          <UserRoundPlus aria-hidden="true" size={18} />
        </Link>
        {/* <Link
          className="icon-button desktop-only"
          aria-label="Funding details"
          href="/#funding"
          onClick={closeMenus}
        >
          <CreditCard aria-hidden="true" size={18} />
        </Link> */}
      </div>

      <button
        aria-controls="site-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        className="icon-button menu-toggle"
        onClick={toggleMenu}
        type="button"
      >
        {menuOpen ? (
          <X aria-hidden="true" size={19} />
        ) : (
          <Menu aria-hidden="true" size={20} />
        )}
      </button>
    </header>
  );
}
