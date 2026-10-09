import type { MetadataRoute } from "next";
import {
  absoluteUrl,
  SITE_URL,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function robots(): MetadataRoute.Robots {
  return {
    host: SITE_URL,
    rules: {
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
      ],
      userAgent: "*",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
