import type { Metadata } from "next";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import JsonLd from "@/components/JsonLd";
import {
  PARTY_LOGO_ALT,
  PARTY_LOGO_SRC,
  PARTY_NAME,
  PARTY_TAGLINE,
} from "@/data/partyContent";
import { getLatestAnnouncement } from "@/lib/contentRepository";
import {
  createRootJsonLd,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  applicationName: PARTY_NAME,
  authors: [{ name: PARTY_NAME }],
  category: "politics",
  description:
    "Awam Dost Party is a national political party in Pakistan built around pragmatic public service, party discipline, measurable manifesto commitments, and direct participation of its members.",
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    description:
      "Awam Dost Party is a national political party in Pakistan built around pragmatic public service and measurable public commitments.",
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
    title: `${PARTY_NAME} | ${PARTY_TAGLINE}`,
    type: "website",
    url: "/",
  },
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: `${PARTY_NAME} | ${PARTY_TAGLINE}`,
    template: `%s | ${PARTY_NAME}`,
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Awam Dost Party is a national political party in Pakistan built around pragmatic public service and measurable public commitments.",
    images: [PARTY_LOGO_SRC],
    title: `${PARTY_NAME} | ${PARTY_TAGLINE}`,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const latestAnnouncement = await getLatestAnnouncement();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <JsonLd data={createRootJsonLd()} />
        <AnnouncementPopup latestAnnouncement={latestAnnouncement} />
        {children}
      </body>
    </html>
  );
}
