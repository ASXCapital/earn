import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Marketplace | ASX RWA",
  description:
    "Explore the ASX Marketplace V3 experience powered by thirdweb on BNB Chain testnet.",
};

export default function MarketplacePage() {
  redirect("/marketplace");
}
