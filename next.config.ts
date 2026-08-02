import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // CSP is applied only in production — dev tooling (HMR/eval) needs a looser policy.
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Content-Security-Policy",
                  value: [
                    "default-src 'self'",
                    // Next.js injects inline bootstrap scripts; Clerk loads from its CDN.
                    "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://img.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.r2.dev",
                    "font-src 'self' data:",
                    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
                    "media-src 'self' blob: data: https://*.r2.dev",
                    "frame-src 'self' https://*.clerk.accounts.dev",
                    "object-src 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                    "frame-ancestors 'none'",
                    "upgrade-insecure-requests",
                  ].join("; "),
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
