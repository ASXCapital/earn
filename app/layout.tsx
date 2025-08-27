import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { Shell } from "@/components/layout/Shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ASX earn",
  description: "ASX earn — staking, NFTs, and ecosystem dashboard",
  metadataBase: new URL("https://asx.capital"),
  icons: { icon: "/asx_white_square1200_transparent.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
