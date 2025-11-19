import type { Metadata } from 'next';
import { MarketplaceExperience } from '@/components/marketplace/MarketplaceExperience';

export const metadata: Metadata = {
  title: 'Marketplace | ASX RWA',
  description: 'Explore the ASX Marketplace V3 experience powered by thirdweb on BNB Chain testnet.',
};

export default function MarketplacePage() {
  return (
    <div className="space-y-10">
      <MarketplaceExperience />
    </div>
  );
}
