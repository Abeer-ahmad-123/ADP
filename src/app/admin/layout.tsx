import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    follow: false,
    googleBot: {
      follow: false,
      index: false,
      noarchive: true,
      nosnippet: true,
    },
    index: false,
    nocache: true,
  },
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
