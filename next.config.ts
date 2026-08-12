import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
            // microphone=(self) — voice dictation (composer MediaRecorder) needs it;
            // camera/geolocation/payment stay fully blocked.
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), payment=()",
          },
          // CSP is applied only in production — dev tooling (HMR/eval) needs a looser policy.
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Content-Security-Policy",
                  value: [
                    "default-src 'self'",
                    // Next.js injects inline bootstrap scripts; Clerk loads from its CDN;
                    // Paddle.js loads from cdn.paddle.com and dynamically injects the
                    // checkout overlay loader (https://*.paddle.com covers it). Paddle also
                    // injects its ProfitWell analytics script from public.profitwell.com.
                    "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.paddle.com https://public.profitwell.com",
                    // Sentry Session Replay spawns its compression worker from a blob URL
                    // (worker-src falls back to script-src when unset, which blocked it).
                    "worker-src 'self' blob:",
                    // Paddle loads its checkout overlay stylesheet from sandbox-cdn/live-cdn.
                    "style-src 'self' 'unsafe-inline' https://*.paddle.com",
                    "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://img.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.r2.dev https://*.paddle.com",
                    "font-src 'self' data:",
                    // Paddle.js talks to api.paddle.com (live) / sandbox-api.paddle.com
                    // (sandbox) and sends telemetry — https://*.paddle.com covers both;
                    // ProfitWell analytics also reports from public.profitwell.com.
                    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.sentry.io https://*.ingest.sentry.io https://*.paddle.com https://public.profitwell.com",
                    "media-src 'self' blob: data: https://*.r2.dev",
                    // Paddle hosted checkout renders in an overlay iframe served from
                    // checkout.paddle.com (live) / sandbox-checkout.paddle.com (sandbox).
                    "frame-src 'self' https://*.clerk.accounts.dev https://*.paddle.com",
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

// Sentry wraps the config to upload source maps on production builds and to
// alias the SDK's runtime builds for client/edge. Tree-shaking options are
// webpack-only, so none are set (this project builds with Turbopack).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Suppress non-CI output
  silent: !process.env.CI,
});
