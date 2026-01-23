import type { Address } from "viem";

export type SortKey =
  | "collection-asc"
  | "collection-desc"
  | "price-asc"
  | "price-desc"
  | "seller-asc"
  | "seller-desc";

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

export type CatalogAsset = {
  id: string;
  tokenId: string;
  assetContractAddress: Address;
  name: string;
  description?: string | null;
  image?: string | null;
  collectionName?: string;
  collectionAddress: Address;
  source: "listing" | "auction" | "offer";
  live: boolean;
};

export type CollectionSnapshot = {
  address: Address;
  name?: string;
  symbol?: string;
  image?: string | null;
  live: number;
  total: number;
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
