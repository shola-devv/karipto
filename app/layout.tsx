import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";

export const metadata = {
  title: "SNOOP",
  description: "THE SNOOP NFT COLLECTION",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Syne:wght@400;700;800&display=swap" rel="stylesheet" />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}