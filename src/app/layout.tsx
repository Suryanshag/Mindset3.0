import type { Metadata } from "next";
import { Nunito, Barlow_Condensed } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Mindset",
  description: "Mental Health Platform",
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
        className={`${nunito.variable} ${barlowCondensed.variable}`}
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
