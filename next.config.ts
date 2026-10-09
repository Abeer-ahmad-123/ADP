import type { NextConfig } from "next";

const PDFJS_TRACE_FILES = [
  "./node_modules/pdfjs-dist/cmaps/**/*",
  "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
  "./node_modules/pdfjs-dist/standard_fonts/**/*",
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    "/api/admin/book/*": [
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
      ...PDFJS_TRACE_FILES,
    ],
    "/api/admin/manifesto": [
      ...PDFJS_TRACE_FILES,
    ],
    "/api/admin/manifesto/*": [
      ...PDFJS_TRACE_FILES,
    ],
  },
  serverExternalPackages: ["@napi-rs/canvas", "pdf-to-png-converter"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, max-age=0, must-revalidate",
          },
          {
            key: "CDN-Cache-Control",
            value: "no-store",
          },
          {
            key: "Vercel-CDN-Cache-Control",
            value: "no-store",
          },
          {
            key: "Surrogate-Control",
            value: "no-store",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
