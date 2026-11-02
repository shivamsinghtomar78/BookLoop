import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { HydrationMarker } from "@/components/shell/hydration-marker";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0e9f6e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

// One typeface, weight-only hierarchy — UI_REFERENCE.md §2 (D-047)
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Editorial display face for the hero and section headlines only.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "BookLoop — school book exchange",
    template: "%s · BookLoop",
  },
  description:
    "Give your books a second life — buy, sell, exchange and donate school books with students from your own school.",
  applicationName: "BookLoop",
  openGraph: {
    type: "website",
    siteName: "BookLoop",
    title: "BookLoop — give every book a second life",
    description:
      "Buy, sell, exchange or donate school books with students from your own school.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookLoop — give every book a second life",
    description:
      "Buy, sell, exchange or donate school books with students from your own school.",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <HydrationMarker />
        {children}
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
