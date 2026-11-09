import { editionCopy } from "@/lib/edition";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppearanceScript } from "@/components/ads/appearance";
import { PORTAL_APP, PORTAL_PALETTE } from "@/components/portal-shell-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: editionCopy().name,
  description: editionCopy().description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the stored palette and mode before the first paint. */}
        <AppearanceScript app={PORTAL_APP} defaultPalette={PORTAL_PALETTE} />
      </head>
      <body>{children}</body>
    </html>
  );
}
