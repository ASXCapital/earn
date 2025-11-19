import "server-only";

import { getContractEvents as getIndexerEvents } from "thirdweb/insight";
import { getContractEvents as getRpcEvents } from "thirdweb";
import {
  getAllValidAuctions,
  getAllValidListings,
  getAllValidOffers,
} from "thirdweb/extensions/marketplace";
import type { PreparedEvent } from "thirdweb";

import { EVENT_FILTERS, MARKETPLACE_CONTRACT } from "@/components/marketplace/constants";
import type { ActivityEntry } from "@/components/marketplace/types";
import { mapLogToActivity } from "@/components/marketplace/utils";
import { client } from "@/lib/thirdweb";
import { MARKETPLACE_V3_CHAIN } from "@/marketplace/config";

const ACTIVITY_LIMIT = 30;
const INDEXER_ACTIVITY_PAGE_SIZE = 120;
const INDEXER_ACTIVITY_MAX_PAGES = 3;
const RPC_ACTIVITY_BLOCK_RANGE = 4_000n;

type FeedSource = {
  listings: "rpc";
  auctions: "rpc";
  offers: "rpc";
  activity: "indexer" | "rpc";
};

export type MarketplaceFeed = {
  listings: Awaited<ReturnType<typeof getAllValidListings>>;
  auctions: Awaited<ReturnType<typeof getAllValidAuctions>>;
  offers: Awaited<ReturnType<typeof getAllValidOffers>>;
  activity: ActivityEntry[];
  lastUpdated: string;
  source: FeedSource;
};

export async function fetchMarketplaceFeed(): Promise<MarketplaceFeed> {
  const [listings, auctions, offers] = await Promise.all([
    fetchWithContext("listings", () =>
      getAllValidListings({
        contract: MARKETPLACE_CONTRACT,
        start: 0,
        count: 200n,
      }),
    ),
    fetchWithContext("auctions", () =>
      getAllValidAuctions({
        contract: MARKETPLACE_CONTRACT,
        start: 0,
        count: 200n,
      }),
    ),
    fetchWithContext("offers", () =>
      getAllValidOffers({
        contract: MARKETPLACE_CONTRACT,
        start: 0,
        count: 200n,
      }),
    ),
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
  };
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
    console.warn("[marketplace] Insight activity fetch failed", err);
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

async function fetchIndexerEventPages(event: PreparedEvent): Promise<IndexerLog[]> {
  const aggregated: IndexerLog[] = [];
  for (let page = 0; page < INDEXER_ACTIVITY_MAX_PAGES; page++) {
    const batch = await getIndexerEvents({
      client,
      chains: [MARKETPLACE_V3_CHAIN],
      contractAddress: MARKETPLACE_CONTRACT.address,
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

async function fetchActivityViaRpc(): Promise<ActivityEntry[]> {
  const logs = await getRpcEvents({
    contract: MARKETPLACE_CONTRACT,
    events: EVENT_FILTERS,
    blockRange: RPC_ACTIVITY_BLOCK_RANGE,
    useIndexer: false,
  }).catch((err) => {
    console.warn("[marketplace] RPC activity fetch failed", err);
    return [];
  });

  return logs
    .sort((a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)))
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
