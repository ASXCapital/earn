import type { Address } from "viem";

export type SortKey = "featured" | "price-low" | "price-high" | "newest";

export type ViewMode = "mosaic" | "immersive";

export type ActivityKind =
  | "listing"
  | "sale"
  | "auction"
  | "bid"
  | "offer"
  | "offer-accepted";

export type ActivityEntry = {
  id: string;
  type: ActivityKind;
  title: string;
  description: string;
  timestamp: Date;
  txHash?: string;
};

export type CollectionInfo = {
  address: Address;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string | null;
};

export type MarketplaceStats = {
  liveListings: number;
  liveAuctions: number;
  openOffers: number;
  auctionsEndingSoon: number;
  totalListingsValue: number;
  floor: number | null;
  symbol: string;
};
