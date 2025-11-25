import type { Metadata } from "next";

import { MarketplaceExperience } from "@/components/marketplace/MarketplaceExperience";

export const metadata: Metadata = {
  title: "Marketplace | ASX",
  description:
    "Buy, sweep, and list ASX ecosystem NFTs across whitelisted collections via thirdweb Marketplace V3.",
};

export default function MarketplacePage() {
  return (
    <div className="space-y-10">
      <MarketplaceExperience />
    </div>
  );
}
