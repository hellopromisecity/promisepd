import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      // YouTube video thumbnails for the /gallery "ভিডিও" tab.
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },

  // Strip console.* in production builds (keep error/warn for crash reports).
  compiler: isProd
    ? { removeConsole: { exclude: ["error", "warn"] } }
    : undefined,

  // Tree-shake heavy named-export libraries at the import level.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    // Form submissions ship a client-generated PDF (base64) to the
    // submit-form Server Action — allow a comfortable payload.
    serverActions: { bodySizeLimit: "8mb" },
  },

  // Old division URLs (`/divisions/<slug>`) now live at the root.
  // Permanent (301) so social-media unfurls, bookmarks, and existing
  // backlinks continue to land on the right page.
  async redirects() {
    return [
      {
        source: "/divisions/:slug",
        destination: "/:slug",
        permanent: true,
      },
    ];
  },

  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        // 2 years, includeSubDomains, preload — recommended HSTS posture.
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // Cache fingerprinted Next assets aggressively.
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Images / video / static media.
      {
        source: "/:path*\\.(svg|png|jpg|jpeg|webp|avif|ico|mp4|webm|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
