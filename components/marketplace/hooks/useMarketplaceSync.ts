import { useCallback, useEffect, useState } from "react";

import superjson from "superjson";

import type { MarketplaceFeed } from "@/components/marketplace/services/feed";
import type { ActivityEntry } from "@/components/marketplace/types";
import type {
  DirectListing,
  EnglishAuction,
  Offer,
} from "thirdweb/extensions/marketplace";

type SyncOptions = {
  silent?: boolean;
};

type MarketplaceSyncResult = {
  listings: DirectListing[];
  auctions: EnglishAuction[];
  offers: Offer[];
  activity: ActivityEntry[];
  grossVolume: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  syncMarketplace: (options?: SyncOptions) => Promise<void>;
};

export function useMarketplaceSync(
  onSyncError?: (message: string) => void,
): MarketplaceSyncResult {
  const [listings, setListings] = useState<DirectListing[]>([]);
  const [auctions, setAuctions] = useState<EnglishAuction[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [grossVolume, setGrossVolume] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const syncMarketplace = useCallback(
    async (options?: SyncOptions) => {
      setError(null);
      if (options?.silent) setRefreshing(true);
      else setLoading(true);

      try {
        // Cache-bust each request so fresh listings render on initial load (CDNs occasionally served stale)
        const response = await fetch(`/api/marketplace-feed?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Unable to sync marketplace.");
        }
        const text = await response.text();
        const payload = superjson.parse<MarketplaceFeed>(text);
        setListings(payload.listings ?? []);
        setAuctions(payload.auctions ?? []);
        setOffers(payload.offers ?? []);
        setActivity(payload.activity ?? []);
        setGrossVolume(payload.grossVolume ?? 0);
        setLastUpdated(payload.lastUpdated ? new Date(payload.lastUpdated) : new Date());
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to sync marketplace.";
        setError(message);
        onSyncError?.(message);
      } finally {
        if (options?.silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [onSyncError],
  );

  useEffect(() => {
    syncMarketplace();
  }, [syncMarketplace]);

  return {
    listings,
    auctions,
    offers,
    activity,
    grossVolume,
    loading,
    refreshing,
    error,
    lastUpdated,
    syncMarketplace,
  };
}
