import { useMemo } from "react";
import type { Address } from "viem";
import type {
  DirectListing,
  EnglishAuction,
  Offer,
} from "thirdweb/extensions/marketplace";

import type {
  CatalogAsset,
  CollectionInfo,
  CollectionSnapshot,
} from "@/components/marketplace/types";
import {
  isAuctionLive,
  isListingLive,
  isOfferLive,
  resolveMediaUrl,
} from "@/components/marketplace/utils";

type CatalogArgs = {
  listings: DirectListing[];
  auctions: EnglishAuction[];
  offers: Offer[];
  collections: CollectionInfo[];
};

type CatalogResult = {
  catalogAssets: CatalogAsset[];
  collectionSummaries: CollectionSnapshot[];
};

export function useMarketplaceCatalog({
  listings,
  auctions,
  offers,
  collections,
}: CatalogArgs): CatalogResult {
  return useMemo(() => {
    const collectionMap = new Map<string, CollectionInfo>();
    collections.forEach((collection) => {
      collectionMap.set(collection.address.toLowerCase(), collection);
    });

    const assets = new Map<string, CatalogAsset>();
    const summaryMap = new Map<string, CollectionSnapshot>();

    const touchSummary = (address: Address) => {
      const key = address.toLowerCase();
      const existing = summaryMap.get(key);
      if (existing) return existing;
      const metadata = collectionMap.get(key);
      const snapshot: CollectionSnapshot = {
        address,
        name: metadata?.name,
        symbol: metadata?.symbol,
        image: metadata?.image,
        live: 0,
        total: 0,
      };
      summaryMap.set(key, snapshot);
      return snapshot;
    };

    const upsertAsset = (candidate: CatalogAsset) => {
      const existing = assets.get(candidate.id);
      if (!existing) {
        assets.set(candidate.id, candidate);
        return;
      }
      assets.set(candidate.id, {
        ...existing,
        description: existing.description ?? candidate.description,
        image: existing.image ?? candidate.image,
        collectionName: existing.collectionName ?? candidate.collectionName,
        source: existing.source === "listing" ? existing.source : candidate.source,
        live: existing.live || candidate.live,
      });
    };

    const now = Date.now() / 1000;

    listings.forEach((listing) => {
      const address = listing.assetContractAddress as Address;
      const live = isListingLive(listing, now);
      const summary = touchSummary(address);
      summary.total += 1;
      if (live) summary.live += 1;
      const collectionName =
        collectionMap.get(address.toLowerCase())?.name ?? undefined;
      const image = resolveMediaUrl(listing.asset?.metadata?.image as string | undefined);
      const id = `${listing.assetContractAddress}-${listing.tokenId.toString()}`;
      upsertAsset({
        id,
        tokenId: listing.tokenId.toString(),
        assetContractAddress: address,
        collectionAddress: address,
        name:
          listing.asset?.metadata?.name ??
          `Token #${listing.tokenId.toString()}`,
        description: listing.asset?.metadata?.description,
        image,
        collectionName,
        source: "listing",
        live,
      });
    });

    auctions.forEach((auction) => {
      const address = auction.assetContractAddress as Address;
      const live = isAuctionLive(auction, now);
      const summary = touchSummary(address);
      summary.total += 1;
      if (live) summary.live += 1;
      const collectionName =
        collectionMap.get(address.toLowerCase())?.name ?? undefined;
      const image = resolveMediaUrl(auction.asset?.metadata?.image as string | undefined);
      const id = `${auction.assetContractAddress}-${auction.tokenId.toString()}`;
      upsertAsset({
        id,
        tokenId: auction.tokenId.toString(),
        assetContractAddress: address,
        collectionAddress: address,
        name:
          auction.asset?.metadata?.name ??
          `Auction #${auction.id.toString()}`,
        description: auction.asset?.metadata?.description,
        image,
        collectionName,
        source: "auction",
        live,
      });
    });

    offers.forEach((offer) => {
      const address = offer.assetContractAddress as Address;
      const live = isOfferLive(offer, now);
      const summary = touchSummary(address);
      summary.total += 1;
      if (live) summary.live += 1;
      const collectionName =
        collectionMap.get(address.toLowerCase())?.name ?? undefined;
      const image = resolveMediaUrl(offer.asset?.metadata?.image as string | undefined);
      const id = `${offer.assetContractAddress}-${offer.tokenId.toString()}`;
      upsertAsset({
        id,
        tokenId: offer.tokenId.toString(),
        assetContractAddress: address,
        collectionAddress: address,
        name:
          offer.asset?.metadata?.name ??
          `Token #${offer.tokenId.toString()}`,
        description: offer.asset?.metadata?.description,
        image,
        collectionName,
        source: "offer",
        live,
      });
    });

    const collectionSummaries = Array.from(summaryMap.values()).sort(
      (a, b) => b.live - a.live || b.total - a.total,
    );

    return {
      catalogAssets: Array.from(assets.values()),
      collectionSummaries,
    };
  }, [auctions, collections, listings, offers]);
}
