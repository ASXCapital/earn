import "server-only";

import { getContract } from "thirdweb";
import type { Address } from "viem";
import { getContractEvents as getIndexerEvents } from "thirdweb/insight";
import {
  getAllValidAuctions,
  getAllValidListings,
  getAllValidOffers,
  newSaleEvent,
  totalAuctions,
  totalListings,
  totalOffers,
} from "thirdweb/extensions/marketplace";
import type { PreparedEvent } from "thirdweb";

import { EVENT_FILTERS } from "@/components/marketplace/constants";
import type { ActivityEntry } from "@/components/marketplace/types";
import {
  getEventsWithRateLimitRetry,
  isRateLimitError,
  mapLogToActivity,
} from "@/components/marketplace/utils";
import { decimals } from "thirdweb/extensions/erc20";

import { serverClient } from "@/lib/thirdweb-server";
import {
  MARKETPLACE_V3_ADDRESS,
  MARKETPLACE_V3_CHAIN,
  MARKETPLACE_V3_LISTING_CURRENCY,
} from "@/marketplace/config";

const ACTIVITY_LIMIT = 30;
const INDEXER_ACTIVITY_PAGE_SIZE = 120;
const INDEXER_ACTIVITY_MAX_PAGES = 3;
const INDEXER_VOLUME_PAGE_SIZE = 200;
const INDEXER_VOLUME_MAX_PAGES = 200;
const RPC_ACTIVITY_BLOCK_RANGE = 4_000n;

type FeedSource = {
  listings: "rpc";
  auctions: "rpc";
  offers: "rpc";
  activity: "indexer" | "rpc";
};

const MARKETPLACE_CONTRACT_SERVER = getContract({
  client: serverClient,
  chain: MARKETPLACE_V3_CHAIN,
  address: MARKETPLACE_V3_ADDRESS as Address,
});

export type MarketplaceFeed = {
  listings: Awaited<ReturnType<typeof getAllValidListings>>;
  auctions: Awaited<ReturnType<typeof getAllValidAuctions>>;
  offers: Awaited<ReturnType<typeof getAllValidOffers>>;
  activity: ActivityEntry[];
  lastUpdated: string;
  source: FeedSource;
  grossVolumeWei: string;
  grossVolume: number;
};

export async function fetchMarketplaceFeed(): Promise<MarketplaceFeed> {
  const [listings, auctions, offers, volume] = await Promise.all([
    fetchWithContext("listings", () => fetchAllValidListings()),
    fetchWithContext("auctions", () => fetchAllValidAuctions()),
    fetchWithContext("offers", () => fetchAllValidOffers()),
    fetchWithContext("volume", () => fetchGrossVolume()),
  ]);

  const { activity, source: activitySource } = await fetchActivity();

  return {
    listings,
    auctions,
    offers,
    activity,
    lastUpdated: new Date().toISOString(),
    source: {
      listings: "rpc",
      auctions: "rpc",
      offers: "rpc",
      activity: activitySource,
    },
    grossVolumeWei: volume.volumeWei.toString(),
    grossVolume: volume.volume,
  };
}

async function fetchAllValidListings() {
  const total = await totalListings({ contract: MARKETPLACE_CONTRACT_SERVER });
  if (total === 0n) return [];
  return getAllValidListings({
    contract: MARKETPLACE_CONTRACT_SERVER,
    start: 0,
    count: total,
  });
}

async function fetchAllValidAuctions() {
  const total = await totalAuctions({ contract: MARKETPLACE_CONTRACT_SERVER });
  if (total === 0n) return [];
  return getAllValidAuctions({
    contract: MARKETPLACE_CONTRACT_SERVER,
    start: 0,
    count: total,
  });
}

async function fetchAllValidOffers() {
  const total = await totalOffers({ contract: MARKETPLACE_CONTRACT_SERVER });
  if (total === 0n) return [];
  return getAllValidOffers({
    contract: MARKETPLACE_CONTRACT_SERVER,
    start: 0,
    count: total,
  });
}

async function fetchActivity(): Promise<{
  activity: ActivityEntry[];
  source: FeedSource["activity"];
}> {
  const indexerActivity = await fetchActivityViaIndexer();
  if (indexerActivity) {
    return { activity: indexerActivity, source: "indexer" };
  }
  const fallback = await fetchActivityViaRpc();
  return { activity: fallback, source: "rpc" };
}

async function fetchActivityViaIndexer(): Promise<ActivityEntry[] | null> {
  try {
    const eventBatches = await Promise.all(
      EVENT_FILTERS.map((event) => fetchIndexerEventPages(event)),
    );
    const logs = eventBatches.flat();
    if (!logs.length) {
      return [];
    }
    const entries = logs
      .sort(
        (a, b) => Number(b.blockTimestamp - a.blockTimestamp) || b.logIndex - a.logIndex,
      )
      .map((log) =>
        mapLogToActivity({
          eventName: log.eventName,
          args: log.args,
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          blockTimestamp: log.blockTimestamp,
        }),
      )
      .filter((entry): entry is ActivityEntry => Boolean(entry))
      .slice(0, ACTIVITY_LIMIT);
    return entries;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "unknown";
    const isGateway = message.toLowerCase().includes("502") || message.includes("Bad Gateway");
    console.info(
      "[marketplace] Insight activity unavailable",
      isGateway ? "502 Bad Gateway" : message,
    );
    return null;
  }
}

type IndexerLog = {
  eventName: string;
  args: Record<string, unknown>;
  transactionHash: string;
  logIndex: number;
  blockTimestamp: number;
};

async function fetchIndexerEventPages(event: PreparedEvent<any>): Promise<IndexerLog[]> {
  const aggregated: IndexerLog[] = [];
  for (let page = 0; page < INDEXER_ACTIVITY_MAX_PAGES; page++) {
    const batch = await getIndexerEvents({
      client: serverClient,
      chains: [MARKETPLACE_V3_CHAIN],
      contractAddress: MARKETPLACE_V3_ADDRESS,
      event,
      decodeLogs: true,
      queryOptions: {
        limit: INDEXER_ACTIVITY_PAGE_SIZE,
        page,
        sort_order: "desc",
      },
    });
    if (!batch.length) break;
    aggregated.push(
      ...batch.map((entry) => ({
        eventName: entry.decoded?.name ?? entry.decoded?.signature ?? "",
        args: {
          ...(entry.decoded?.indexed_params ?? {}),
          ...(entry.decoded?.non_indexed_params ?? {}),
        },
        transactionHash: entry.transaction_hash,
        logIndex: entry.log_index,
        blockTimestamp: entry.block_timestamp,
      })),
    );
    if (batch.length < INDEXER_ACTIVITY_PAGE_SIZE) break;
  }
  return aggregated;
}

async function fetchGrossVolume(): Promise<{ volumeWei: bigint; volume: number }> {
  try {
    const logs = await fetchAllIndexerEvents(newSaleEvent());
    if (!logs.length) return { volumeWei: 0n, volume: 0 };
    const totalWei = logs.reduce((acc, log) => {
      const totalPrice = safeBigInt(log.args?.totalPricePaid);
      const pricePerToken = safeBigInt(log.args?.pricePerToken);
      const quantity = safeBigInt(log.args?.quantityBought) || 1n;
      const value = totalPrice > 0n ? totalPrice : pricePerToken * quantity;
      return acc + value;
    }, 0n);
    const currencyDecimals = await getListingCurrencyDecimals();
    const divisor = 10 ** currencyDecimals;
    const volume = divisor > 0 ? Number(totalWei) / divisor : 0;
    return { volumeWei: totalWei, volume };
  } catch (err) {
    console.warn("[marketplace] gross volume fetch failed", err);
    return { volumeWei: 0n, volume: 0 };
  }
}

async function fetchAllIndexerEvents(event: PreparedEvent<any>): Promise<IndexerLog[]> {
  const aggregated: IndexerLog[] = [];
  for (let page = 0; page < INDEXER_VOLUME_MAX_PAGES; page++) {
    const batch = await getIndexerEvents({
      client: serverClient,
      chains: [MARKETPLACE_V3_CHAIN],
      contractAddress: MARKETPLACE_V3_ADDRESS,
      event,
      decodeLogs: true,
      queryOptions: {
        limit: INDEXER_VOLUME_PAGE_SIZE,
        page,
        sort_order: "desc",
      },
    });
    if (!batch.length) break;
    aggregated.push(
      ...batch.map((entry) => ({
        eventName: entry.decoded?.name ?? entry.decoded?.signature ?? "",
        args: {
          ...(entry.decoded?.indexed_params ?? {}),
          ...(entry.decoded?.non_indexed_params ?? {}),
        },
        transactionHash: entry.transaction_hash,
        logIndex: entry.log_index,
        blockTimestamp: entry.block_timestamp,
      })),
    );
    if (batch.length < INDEXER_VOLUME_PAGE_SIZE) break;
  }
  return aggregated;
}

async function getListingCurrencyDecimals(): Promise<number> {
  try {
    if (
      !MARKETPLACE_V3_LISTING_CURRENCY ||
      MARKETPLACE_V3_LISTING_CURRENCY === "0x0000000000000000000000000000000000000000"
    ) {
      return 18;
    }
    const currencyContract = getContract({
      client: serverClient,
      chain: MARKETPLACE_V3_CHAIN,
      address: MARKETPLACE_V3_LISTING_CURRENCY as Address,
    });
    return await decimals({ contract: currencyContract });
  } catch {
    return 18;
  }
}

async function fetchActivityViaRpc(): Promise<ActivityEntry[]> {
  const logs = await getEventsWithRateLimitRetry(
    {
      contract: MARKETPLACE_CONTRACT_SERVER,
      events: [...EVENT_FILTERS],
      blockRange: RPC_ACTIVITY_BLOCK_RANGE,
      useIndexer: false,
    } as any,
  ).catch((err) => {
    if (isRateLimitError(err)) {
      console.info("[marketplace] RPC activity rate limited, skipping activity hydration");
      return [];
    }
    console.warn("[marketplace] RPC activity fetch failed", err);
    return [];
  });

  const sortedLogs = [...logs].sort((a, b) => {
    const aRaw = a.blockNumber;
    const bRaw = b.blockNumber;
    const aBlock =
      typeof aRaw === "bigint"
        ? Number(aRaw)
        : typeof aRaw === "number"
          ? aRaw
          : 0;
    const bBlock =
      typeof bRaw === "bigint"
        ? Number(bRaw)
        : typeof bRaw === "number"
          ? bRaw
          : 0;
    return bBlock - aBlock;
  });

  return sortedLogs
    .map((log) =>
      mapLogToActivity({
        eventName: log.eventName,
        args: log.args,
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
        blockTimestamp: ("blockTimestamp" in log && log.blockTimestamp
          ? Number(log.blockTimestamp)
          : 0) as number,
      }),
    )
    .filter((entry): entry is ActivityEntry => Boolean(entry))
    .slice(0, ACTIVITY_LIMIT);
}

async function fetchWithContext<T>(label: string, task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (err) {
    const description = formatError(err);
    console.error(`[marketplace] ${label} fetch failed`, err);
    throw new Error(`${label} fetch failed: ${description}`);
  }
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    const segments: string[] = [err.message];
    const code = (err as Error & { code?: string }).code;
    if (code) {
      segments.push(`code=${code}`);
    }
    const cause = (err as Error & { cause?: unknown }).cause;
    if (cause instanceof Error) {
      segments.push(`cause=${cause.message}`);
      const causeCode = (cause as Error & { code?: string }).code;
      if (causeCode) {
        segments.push(`causeCode=${causeCode}`);
      }
    } else if (typeof cause === "string") {
      segments.push(`cause=${cause}`);
    } else if (cause && typeof cause === "object" && "message" in cause) {
      segments.push(`cause=${String((cause as { message?: unknown }).message)}`);
    }
    return segments.join(" | ");
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

function safeBigInt(value: unknown): bigint {
  try {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(Math.floor(value));
    if (typeof value === "string" && value.length > 0) return BigInt(value);
    return 0n;
  } catch {
    return 0n;
  }
}
