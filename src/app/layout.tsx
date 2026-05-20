import type { Metadata, Viewport } from "next";
import { Nunito, Barlow_Condensed, Source_Serif_4 } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import RecaptchaProvider from "@/components/providers/recaptcha-provider";
import { CartProvider } from "@/lib/cart-context";
import { auth } from "@/lib/auth";
import { getInitialCartItems } from "@/lib/queries/cart";
import { JsonLd, organizationLd, websiteLd } from "@/components/seo/json-ld";
import CookieBanner from "@/components/legal/cookie-banner";
import ServiceWorkerProvider from "@/components/pwa/service-worker-provider";
import InstallBanner from "@/components/pwa/install-banner";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-heading-var",
  weight: ["600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-var",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mindset.example";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Mindset — Mental Health Care, Made Accessible",
    template: "%s | Mindset",
  },
  description:
    "Talk to qualified therapists, join wellness workshops, and access self-care resources. Mindset makes mental health care accessible, affordable, and stigma-free.",
  keywords: [
    "mental health India",
    "online therapy",
    "counseling",
    "psychologist",
    "mental wellness",
    "therapy session",
    "mindfulness workshops",
    "anxiety help",
    "depression help",
  ],
  authors: [{ name: "Mindset" }],
  creator: "Mindset",
  publisher: "Mindset",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "Mindset",
    title: "Mindset — Mental Health Care, Made Accessible",
    description:
      "Talk to qualified therapists, join wellness workshops, and access self-care resources.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mindset — Mental health care made accessible",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mindset — Mental Health Care, Made Accessible",
    description:
      "Talk to qualified therapists, join wellness workshops, and access self-care resources.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/images/icons/Logo.webp" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mindset",
  },
  category: "health",
};

// Next 15+ moved themeColor + viewport-related metadata to a separate export.
export const viewport: Viewport = {
  themeColor: "#F7F2EA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  // Server-render the cart for USER sessions so CartProvider doesn't have
  // to round-trip /api/user/cart on mount (~2s warm before this change).
  // For non-USER roles + unauthenticated traffic this skips entirely.
  // Server-render the cart for USER sessions so CartProvider doesn't have
  // to round-trip /api/user/cart on mount (~2s warm before this change).
  // For non-USER roles + unauthenticated traffic this skips entirely.
  const initialCartItems =
    session?.user?.id && session.user.role === 'USER'
      ? await getInitialCartItems(session.user.id).catch(() => [])
      : undefined;
  const isAuthedUser = !!session?.user?.id && session.user.role === 'USER';
  return (
    <html lang="en">
      <head>
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />
      </head>
      <body
        className={`${nunito.variable} ${barlowCondensed.variable} ${sourceSerif.variable}`}
        suppressHydrationWarning
      >
        <ServiceWorkerProvider />
        {isAuthedUser && <InstallBanner />}
        <AuthSessionProvider session={session}>
          <RecaptchaProvider>
            <CartProvider initialItems={initialCartItems}>
              <div className="wp-site-blocks">{children}</div>
              <Toaster
                richColors
                position="top-right"
                closeButton
                expand={false}
                visibleToasts={3}
              />
            </CartProvider>
          </RecaptchaProvider>
        </AuthSessionProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
