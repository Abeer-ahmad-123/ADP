import type { MetadataRoute } from "next";
import {
  absoluteUrl,
  SITE_URL,
} from "@/lib/seo";

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
