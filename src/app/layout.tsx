import type { Metadata } from "next";
import { Nunito, Barlow_Condensed, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import RecaptchaProvider from "@/components/providers/recaptcha-provider";
import { CartProvider } from "@/lib/cart-context";
import { auth } from "@/lib/auth";
import { JsonLd, organizationLd, websiteLd } from "@/components/seo/json-ld";

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
    icon: "/images/icons/Logo.webp",
    apple: "/images/icons/Logo.png",
  },
  category: "health",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
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
        <AuthSessionProvider session={session}>
          <RecaptchaProvider>
            <CartProvider>
              <div className="wp-site-blocks">{children}</div>
            </CartProvider>
          </RecaptchaProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
