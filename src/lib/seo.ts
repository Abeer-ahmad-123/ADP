import type { Metadata } from "next";
import {
  FOOTER_CONTACTS,
  PARTY_CHAIRMAN_NAME,
  PARTY_LOGO_ALT,
  PARTY_LOGO_SRC,
  PARTY_NAME,
  PARTY_SHORT_NAME,
  PARTY_TAGLINE,
  SOCIAL_LINKS,
} from "@/data/partyContent";
import type { PublicContentItem } from "@/types/party";

const FALLBACK_SITE_URL = "http://localhost:3000";

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    getVercelSiteUrl() ||
    FALLBACK_SITE_URL,
);

const HOME_DESCRIPTION =
  "Awam Dost Party is a national political party in Pakistan built around pragmatic public service, party discipline, measurable manifesto commitments, and direct participation of its members.";

export const PUBLIC_SEO_ROUTES = [
  {
    changeFrequency: "weekly",
    description: HOME_DESCRIPTION,
    label: "Home",
    path: "/",
    priority: 1,
    title: PARTY_NAME,
  },
  {
    changeFrequency: "monthly",
    description:
      "Read the Awam Dost Party manifesto for pragmatic policy priorities, public service commitments, and measurable plans for Pakistan.",
    label: "Manifesto",
    path: "/manifesto",
    priority: 0.9,
    title: "Manifesto",
  },
  {
    changeFrequency: "weekly",
    description:
      "Latest Awam Dost Party news about organizing, membership, manifesto access, and public party work.",
    label: "News",
    path: "/news",
    priority: 0.82,
    title: "News",
  },
  {
    changeFrequency: "weekly",
    description:
      "Read Awam Dost Party blogs, policy essays, organizing notes, and public explainers.",
    label: "Blogs",
    path: "/blogs",
    priority: 0.78,
    title: "Blogs",
  },
  {
    changeFrequency: "daily",
    description:
      "Official Awam Dost Party announcements, public notices, schedules, and chairman updates.",
    label: "Announcements",
    path: "/announcements",
    priority: 0.84,
    title: "Announcements",
  },
  {
    changeFrequency: "monthly",
    description:
      `Leadership profiles for Awam Dost Party, including Chairman ${PARTY_CHAIRMAN_NAME}.`,
    label: "Leadership",
    path: "/leadership",
    priority: 0.76,
    title: "Leadership",
  },
  {
    changeFrequency: "weekly",
    description:
      "Audio messages and video reels from Awam Dost Party for citizens, volunteers, and district teams.",
    label: "Media",
    path: "/media",
    priority: 0.74,
    title: "Media",
  },
  {
    changeFrequency: "monthly",
    description:
      "Read the Awam Dost Party public book and manifesto material through the online page-turning reader.",
    label: "Book",
    path: "/book",
    priority: 0.88,
    title: "Book",
  },
] as const;

type SeoRoute = (typeof PUBLIC_SEO_ROUTES)[number];

export type PageSeoInput = {
  description: string;
  keywords?: string[];
  path: string;
  title: string;
};

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function createPageMetadata({
  description,
  keywords = [],
  path,
  title,
}: PageSeoInput): Metadata {
  const isHomeTitle = title === PARTY_NAME;
  const fullTitle = isHomeTitle
    ? `${PARTY_NAME} | ${PARTY_TAGLINE}`
    : `${title} | ${PARTY_NAME}`;

  return {
    alternates: {
      canonical: path,
    },
    description,
    keywords: [
      PARTY_NAME,
      PARTY_SHORT_NAME,
      "Awam Dost Party Pakistan",
      "Pakistan political party",
      "Sab se pehle awam",
      ...keywords,
    ],
    openGraph: {
      description,
      images: [
        {
          alt: PARTY_LOGO_ALT,
          height: 1086,
          url: PARTY_LOGO_SRC,
          width: 1448,
        },
      ],
      locale: "en_PK",
      siteName: PARTY_NAME,
      title: fullTitle,
      type: "website",
      url: path,
    },
    title: isHomeTitle ? { absolute: fullTitle } : title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [PARTY_LOGO_SRC],
      title: fullTitle,
    },
  };
}

export function getSeoRoute(path: string): SeoRoute {
  return PUBLIC_SEO_ROUTES.find((route) => route.path === path) || PUBLIC_SEO_ROUTES[0];
}

export function createWebPageJsonLd({
  description,
  path,
  title,
}: PageSeoInput) {
  return {
    "@context": "https://schema.org",
    "@id": `${absoluteUrl(path)}#webpage`,
    "@type": "WebPage",
    description,
    inLanguage: "en-PK",
    isPartOf: {
      "@id": `${SITE_URL}#website`,
    },
    name: title === PARTY_NAME ? `${PARTY_NAME} | ${PARTY_TAGLINE}` : `${title} | ${PARTY_NAME}`,
    publisher: {
      "@id": `${SITE_URL}#organization`,
    },
    url: absoluteUrl(path),
  };
}

export function createArchiveItemListJsonLd({
  items,
  name,
  path,
}: {
  items: PublicContentItem[];
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: {
        "@type": "Thing",
        description: item.summary,
        name: item.title,
        url: absoluteUrl(item.href.startsWith("/") ? item.href : path),
      },
      position: index + 1,
    })),
    name,
    url: absoluteUrl(path),
  };
}

export function createRootJsonLd() {
  const publicSocialLinks = SOCIAL_LINKS
    .map((link) => link.href)
    .filter((href) => !href.includes("example.com"));
  const contactNumber = FOOTER_CONTACTS.find((contact) =>
    contact.href.startsWith("tel:"),
  )?.href.replace("tel:", "");

  return [
    {
      "@context": "https://schema.org",
      "@id": `${SITE_URL}#organization`,
      "@type": "PoliticalParty",
      alternateName: PARTY_SHORT_NAME,
      areaServed: {
        "@type": "Country",
        name: "Pakistan",
      },
      contactPoint: contactNumber
        ? {
            "@type": "ContactPoint",
            contactType: "Public contact",
            telephone: contactNumber,
          }
        : undefined,
      image: absoluteUrl(PARTY_LOGO_SRC),
      logo: absoluteUrl(PARTY_LOGO_SRC),
      name: PARTY_NAME,
      slogan: PARTY_TAGLINE,
      url: SITE_URL,
      ...(publicSocialLinks.length > 0 ? { sameAs: publicSocialLinks } : {}),
      member: {
        "@type": "Person",
        jobTitle: "Chairman",
        name: PARTY_CHAIRMAN_NAME,
      },
    },
    {
      "@context": "https://schema.org",
      "@id": `${SITE_URL}#website`,
      "@type": "WebSite",
      inLanguage: "en-PK",
      name: PARTY_NAME,
      publisher: {
        "@id": `${SITE_URL}#organization`,
      },
      url: SITE_URL,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: PUBLIC_SEO_ROUTES.map((route, index) => ({
        "@type": "ListItem",
        item: {
          "@type": "SiteNavigationElement",
          name: route.label,
          url: absoluteUrl(route.path),
        },
        position: index + 1,
      })),
      name: `${PARTY_NAME} main pages`,
    },
  ];
}

function getVercelSiteUrl() {
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  if (!vercelUrl) {
    return "";
  }

  return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

function normalizeSiteUrl(value: string) {
  return value.replace(/\/+$/, "");
}
