import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>{children}</body>
    </html>
  );
}
