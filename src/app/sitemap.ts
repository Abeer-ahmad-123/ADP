import type { MetadataRoute } from "next";
import { listPublicBooks } from "@/lib/bookRepository";
import {
  absoluteUrl,
  PUBLIC_SEO_ROUTES,
} from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const books = await listPublicBooks();

  return [
    ...PUBLIC_SEO_ROUTES.map((route) => ({
      changeFrequency: route.changeFrequency,
      lastModified,
      priority: route.priority,
      url: absoluteUrl(route.path),
    })),
    ...books.map((book) => ({
      changeFrequency: "monthly" as const,
      lastModified,
      priority: 0.72,
      url: absoluteUrl(`/book?book=${book.slug}`),
    })),
  ];
}
