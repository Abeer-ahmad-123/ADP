import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nayi Subah Party | Modern Pakistani Political Website",
  description:
    "A modern Next.js prototype for a fictional Pakistani political party with manifesto, registration, membership cards, funding footer, and a page-turning book.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
