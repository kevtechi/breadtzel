import type { Metadata } from "next";
import { Geist, Geist_Mono, Bungee } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Blocky arcade display face for the BREADTZEL marquee and big numbers.
const bungee = Bungee({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BREADTZEL — guess the weight, win the pot",
  description:
    "A pretzel-weight lottery on Gnosis Chain. Send XDAI to guess the weight (75g = 7.5 XDAI). Closest guess wins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
