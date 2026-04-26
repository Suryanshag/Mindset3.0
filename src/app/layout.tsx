import type { Metadata } from "next";
import { Nunito, Barlow_Condensed, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import { CartProvider } from "@/lib/cart-context";
import { auth } from "@/lib/auth";

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

export const metadata: Metadata = {
  title: "Mindset",
  description: "Mental Health Platform",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${barlowCondensed.variable} ${sourceSerif.variable}`}
        suppressHydrationWarning
      >
        <AuthSessionProvider session={session}>
          <CartProvider>
            <div className="wp-site-blocks">{children}</div>
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
