import Image from "next/image";
import Link from "next/link";
import {
  Landmark,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import {
  FOOTER_BANK_DETAILS,
  FOOTER_CONTACTS,
  FOOTER_NAV_GROUPS,
  PARTY_LOGO_ALT,
  PARTY_LOGO_SRC,
  PARTY_NAME,
  SOCIAL_LINKS,
} from "@/data/partyContent";

export default function SiteFooter() {
  return (
    <footer id="funding" className="site-footer no-print">
      <div className="section-inner footer-main">
        <div className="footer-brand-panel">
          <Link className="footer-logo" href="/">
            <span className="footer-logo-mark">
              <Image
                alt={PARTY_LOGO_ALT}
                fill
                sizes="64px"
                src={PARTY_LOGO_SRC}
              />
            </span>
            <strong>{PARTY_NAME}</strong>
          </Link>
          <p>
            A modern public movement for measurable promises,
            local leadership, and citizen-facing progress.
          </p>

          <div className="footer-contact-list">
            {FOOTER_CONTACTS.map((contact, index) => {
              const Icon = index === 0 ? Mail : index === 1 ? Phone : MapPin;

              return (
                <a key={contact.label} href={contact.href}>
                  <Icon aria-hidden="true" size={16} />
                  {contact.label}
                </a>
              );
            })}
          </div>
        </div>

        <nav className="footer-nav-grid" aria-label="Footer navigation">
          {FOOTER_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) =>
                link.href.startsWith("/") ? (
                  <Link key={link.label} href={link.href}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href}>
                    {link.label}
                  </a>
                ),
              )}
            </div>
          ))}

          <div className="footer-nav-social">
            <h3>Social</h3>
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        {/* <div className="footer-funding-card">
          <div className="funding-card-header">
            <span>
              <Landmark aria-hidden="true" size={19} />
            </span>
            <div>
              <p>Funding</p>
              <h3>Party fund status</h3>
            </div>
          </div>

          <dl>
            {FOOTER_BANK_DETAILS.map((detail) => (
              <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div> */}
      </div>

      <div className="section-inner footer-social-row">
        <p>Copyrights © ADP 2026. All rights reserved.</p>
      </div>
    </footer>
  );
}
