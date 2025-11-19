import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { isAddress } from "viem";
import { getContract } from "thirdweb";
import { getContractMetadata } from "thirdweb/extensions/common";

import type { CollectionInfo } from "@/components/marketplace/types";
import { fetchRoleMembersFromChain } from "@/components/marketplace/services/roles";
import { client } from "@/lib/thirdweb";
import { MARKETPLACE_V3_CHAIN, MARKETPLACE_WHITELISTED_COLLECTIONS } from "@/marketplace/config";

type CollectionsState = {
  collections: CollectionInfo[];
  collectionsLoading: boolean;
  collectionsError: string | null;
  refreshCollections: () => Promise<void>;
};

export function useMarketplaceCollections(): CollectionsState {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);

  const refreshCollections = useCallback(async () => {
    setCollectionsLoading(true);
    setCollectionsError(null);
    try {
      const members = await fetchRoleMembersFromChain("asset");
      const fallbackAddresses =
        MARKETPLACE_WHITELISTED_COLLECTIONS.map((address) => address.toLowerCase()) || [];
      const combined = new Set<string>();
      members.forEach((address) => combined.add(address));
      fallbackAddresses.forEach((address) => combined.add(address));
      const uniqueAddresses = Array.from(combined).filter((address) => isAddress(address));
      if (uniqueAddresses.length === 0) {
        setCollections([]);
        setCollectionsError(
          "No ASSET_ROLE collections detected. Grant role via the contract or set NEXT_PUBLIC_WHITELISTED_COLLECTIONS.",
        );
        setCollectionsLoading(false);
        return;
      }
      const enriched = await Promise.all(
        uniqueAddresses.map(async (address) => {
          try {
            const collectionContract = getContract({
              client,
              chain: MARKETPLACE_V3_CHAIN,
              address: address as Address,
            });
            const metadata = await getContractMetadata({
              contract: collectionContract,
            });
            return {
              address: address as Address,
              name: metadata.name,
              symbol: (metadata as any).symbol,
              description: metadata.description,
              image: metadata.image || metadata.imageUrl || null,
            } as CollectionInfo;
          } catch {
            return {
              address: address as Address,
            } as CollectionInfo;
          }
        }),
      );
      setCollections(enriched);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load whitelisted collections.";
      setCollectionsError(message);
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCollections();
  }, [refreshCollections]);

  return {
    collections,
    collectionsLoading,
    collectionsError,
    refreshCollections,
  };
}
