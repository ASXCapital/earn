import type { Metadata } from "next";
import "./globals.css";
import { IBM_Plex_Sans, IBM_Plex_Mono, Bebas_Neue } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { Shell } from "@/components/layout/Shell";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-ibm-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-ibm-mono" });
const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-condensed" });

export const metadata: Metadata = {
  title: "ASX earn",
  description: "ASX earn — staking, NFTs, and ecosystem dashboard",
  metadataBase: new URL("https://asx.capital"),
  icons: { icon: "/asx_white_square1200_transparent.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={[plexSans.variable, plexMono.variable, display.variable].join(" ")}>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
