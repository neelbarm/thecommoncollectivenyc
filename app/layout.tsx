import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";

import { CapacitorNativeBridge } from "@/components/native/capacitor-native-bridge";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Common Collective",
  description:
    "A live, non-exclusive NYC members club focused on recurring social connection and thoughtful experiences.",
  manifest: "/manifest.webmanifest",
  applicationName: "The Common Collective",
  keywords: ["members club", "cohorts", "events", "community", "concierge"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Common Collective",
  },
  icons: {
    apple: "/app-icons/icon-180.png",
    icon: [
      { url: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#090806",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
        <CapacitorNativeBridge />
        {children}
      </body>
    </html>
  );
}
