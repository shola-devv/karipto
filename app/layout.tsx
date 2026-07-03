import type { Metadata } from "next";
import { Rubik, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Karipto — ETH & USDT Wallet",
  description: "Custodial ETH & USDT wallet with unique deposit addresses per user.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-ink text-text min-h-screen antialiased">{children}</body>
    </html>
  );
}
