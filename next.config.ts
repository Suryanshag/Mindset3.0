import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      { source: '/user/ebooks', destination: '/user/library', permanent: true },
      { source: '/user/assignments', destination: '/user/sessions', permanent: true },
      { source: '/user/shop/cart', destination: '/user/cart', permanent: true },
      { source: '/user/shop/orders', destination: '/user/orders', permanent: true },
      { source: '/user/addresses', destination: '/user/profile', permanent: true },
      // Sprint Pre-Launch H1: /ngo-visits/join was a server component that
      // called redirect() — Next streaming SSR turned that into 200+RSC+
      // meta-refresh, not a true HTTP redirect. A config-level redirect runs
      // before any page logic and emits a real 308. /login auto-redirects
      // already-authed users to the callbackUrl so this single rule handles
      // both auth states without needing a server auth check.
      {
        source: '/ngo-visits/join',
        destination: '/login?callbackUrl=/user/discover/ngo-visits',
        permanent: true,
      },
    ]
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const csp = [
      "default-src 'self'",
      // reCAPTCHA v3 (Sprint Pre-Launch C3): api.js comes from www.google.com,
      // anchor + invisible iframe assets from www.gstatic.com, the verification
      // iframe lives at www.google.com/recaptcha, and challenge XHRs go back to
      // www.google.com. All four buckets need entries.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://via.placeholder.com https://*.razorpay.com",
      "media-src 'self' https://res.cloudinary.com",
      "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://api.cloudinary.com https://script.google.com https://script.googleusercontent.com https://www.google.com/recaptcha/",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      isProd ? "upgrade-insecure-requests" : "",
    ]
      .filter(Boolean)
      .join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        // PWA service worker. Per Next 16's official PWA guide we must not
        // cache the SW itself — otherwise users would be pinned to whatever
        // version was first cached by their browser and would never receive
        // updates. CSP is inherited from the global block above (script-src
        // 'self' already permits SW execution).
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
