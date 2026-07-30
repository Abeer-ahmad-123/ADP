import type { NextConfig } from "next";

const PDFJS_TRACE_FILES = [
  "./node_modules/pdfjs-dist/cmaps/**/*",
  "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
  "./node_modules/pdfjs-dist/standard_fonts/**/*",
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "*.blob.vercel-storage.com",
        protocol: "https",
      },
    ],
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
