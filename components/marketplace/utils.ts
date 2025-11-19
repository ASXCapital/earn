import type { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";
import { getContractEvents } from "thirdweb";

import type {
  ActivityEntry,
  MarketplaceStats,
  SortKey,
} from "@/components/marketplace/types";

export const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

export const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function computeStats(
  listings: DirectListing[],
  auctions: EnglishAuction[],
  offers: Offer[],
): MarketplaceStats {
  const now = Date.now() / 1000;
  let liveListings = 0;
  let floor = Number.POSITIVE_INFINITY;
  let totalListingsValue = 0;
  let symbol = listings[0]?.currencyValuePerToken.symbol || "tBNB";

  for (const listing of listings) {
    const price = safeNumber(listing.currencyValuePerToken.displayValue);
    const qty = Number(listing.quantity || 1n) || 1;
    totalListingsValue += price * qty;
    if (isListingLive(listing, now)) {
      liveListings += 1;
      floor = Math.min(floor, price);
    }
    if (!symbol && listing.currencyValuePerToken.symbol) {
      symbol = listing.currencyValuePerToken.symbol;
    }
  }

  const liveAuctions = auctions.filter((auction) => isAuctionLive(auction, now)).length;
  const auctionsEndingSoon = auctions.filter((auction) => {
    const remaining = Number(auction.endTimeInSeconds) - now;
    return remaining > 0 && remaining < 3600;
  }).length;
  const openOffers = offers.filter((offer) => isOfferLive(offer, now)).length;

  return {
    liveListings,
    liveAuctions,
    openOffers,
    totalListingsValue,
    auctionsEndingSoon,
    floor: floor === Number.POSITIVE_INFINITY ? null : floor,
    symbol,
  };
}

export function safeNumber(value?: string | number | bigint | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const code = typeof err === "object" && err !== null ? (err as any).code : undefined;
  if (code === -32005) return true;
  const message =
    typeof err === "string"
      ? err
      : typeof err === "object" && err !== null
        ? (err as any).message ?? (err as Error).message
        : undefined;
  return typeof message === "string" && message.toLowerCase().includes("rate limit");
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const RATE_LIMIT_BACKOFF_MS = [300, 600, 1200];
const MIN_BLOCK_RANGE = 128n;

export async function getEventsWithRateLimitRetry(
  options: Parameters<typeof getContractEvents>[0],
  attempt = 0,
  ): Promise<Awaited<ReturnType<typeof getContractEvents>>> {
  try {
    return await getContractEvents(options as any);
  } catch (err) {
    if (isRateLimitError(err) && attempt < RATE_LIMIT_BACKOFF_MS.length) {
      const waitMs = RATE_LIMIT_BACKOFF_MS[attempt];
      const nextOptions = { ...options };
      const blockRange = (options as any).blockRange as bigint | undefined;
      if (blockRange && blockRange > MIN_BLOCK_RANGE) {
        const halved = blockRange / 2n;
        nextOptions.blockRange = halved > MIN_BLOCK_RANGE ? halved : MIN_BLOCK_RANGE;
        if (options.fromBlock && !options.toBlock) {
          // ensure next call still pages forward when using fromBlock+blockRange
          nextOptions.fromBlock = options.fromBlock;
        }
      }
      await sleep(waitMs);
      return getEventsWithRateLimitRetry(nextOptions, attempt + 1);
    }
    throw err;
  }
}

export function isListingLive(listing: DirectListing, nowSeconds: number) {
  const start = Number(listing.startTimeInSeconds);
  const end = Number(listing.endTimeInSeconds);
  return start <= nowSeconds && end > nowSeconds;
}

export function isAuctionLive(auction: EnglishAuction, nowSeconds: number) {
  const start = Number(auction.startTimeInSeconds);
  const end = Number(auction.endTimeInSeconds);
  return start <= nowSeconds && end > nowSeconds;
}

export function isOfferLive(offer: Offer, nowSeconds: number) {
  return Number(offer.endTimeInSeconds) > nowSeconds;
}

export function getListingState(listing: DirectListing) {
  const now = Date.now() / 1000;
  const start = Number(listing.startTimeInSeconds);
  const end = Number(listing.endTimeInSeconds);

  if (start > now) {
    return {
      state: "scheduled",
      label: "Scheduled drop",
      detail: `Opens in ${formatRelative(start - now)}`,
    } as const;
  }

  if (end <= now) {
    return {
      state: "closed",
      label: "Closed",
      detail: "Listing expired",
    } as const;
  }

  return {
    state: "live",
    label: "Live now",
    detail: `Ends in ${formatRelative(end - now)}`,
  } as const;
}

export function formatRelative(deltaSeconds: number) {
  if (deltaSeconds <= 0) return "now";
  const hours = Math.floor(deltaSeconds / 3600);
  const minutes = Math.floor((deltaSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor(deltaSeconds)}s`;
}

export function formatRelativeTime(date: Date) {
  const delta = date.getTime() - Date.now();
  const abs = Math.abs(delta);
  if (abs < 60_000) {
    const secs = Math.round(delta / 1000);
    return `${secs >= 0 ? "in " : ""}${Math.abs(secs)}s${secs < 0 ? " ago" : ""}`;
  }
  if (abs < 3_600_000) {
    const mins = Math.round(delta / 60_000);
    return `${mins >= 0 ? "in " : ""}${Math.abs(mins)}m${mins < 0 ? " ago" : ""}`;
  }
  const hours = Math.round(delta / 3_600_000);
  return `${hours >= 0 ? "in " : ""}${Math.abs(hours)}h${hours < 0 ? " ago" : ""}`;
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`;
  }
  return url;
}

export function shortAddress(address: string) {
  if (!address) return "0x0000...0000";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function sortListings(a: DirectListing, b: DirectListing, key: SortKey) {
  const priceA = safeNumber(a.currencyValuePerToken.displayValue);
  const priceB = safeNumber(b.currencyValuePerToken.displayValue);

  if (key === "price-low") return priceA - priceB;
  if (key === "price-high") return priceB - priceA;
  if (key === "newest") {
    return Number(b.startTimeInSeconds) - Number(a.startTimeInSeconds);
  }

  const now = Date.now() / 1000;
  const aLive = isListingLive(a, now);
  const bLive = isListingLive(b, now);
  if (aLive !== bLive) return aLive ? -1 : 1;
  return Number(a.endTimeInSeconds) - Number(b.endTimeInSeconds);
}

export function mapLogToActivity(log: any): ActivityEntry | null {
  const timestamp = extractTimestamp(log);
  const txHash: string | undefined = log.transactionHash;
  const id = `${txHash}-${log.logIndex ?? 0}`;

  switch (log.eventName) {
    case "NewListing":
      return {
        id,
        type: "listing",
        title: `Listing #${log.args?.listingId?.toString() ?? ""}`,
        description: `${shortAddress(log.args?.listingCreator ?? "")} listed token ${
          log.args?.tokenId ?? ""
        }`,
        timestamp,
        txHash,
      };
    case "NewSale":
      return {
        id,
        type: "sale",
        title: `Sale on listing #${log.args?.listingId?.toString() ?? ""}`,
        description: `${shortAddress(log.args?.buyer ?? "")} bought ${
          log.args?.quantityBought ?? ""
        } unit(s)`,
        timestamp,
        txHash,
      };
    case "NewAuction":
      return {
        id,
        type: "auction",
        title: `Auction #${log.args?.auctionId?.toString() ?? ""} opened`,
        description: `${shortAddress(log.args?.auctionCreator ?? "")} listed token ${
          log.args?.tokenId ?? ""
        }`,
        timestamp,
        txHash,
      };
    case "NewBid":
      return {
        id,
        type: "bid",
        title: `Bid on auction #${log.args?.auctionId?.toString() ?? ""}`,
        description: `${shortAddress(log.args?.bidder ?? "")} bid ${
          log.args?.bidAmount ?? ""
        }`,
        timestamp,
        txHash,
      };
    case "NewOffer":
      return {
        id,
        type: "offer",
        title: `Offer #${log.args?.offerId?.toString() ?? ""}`,
        description: `${shortAddress(log.args?.offeror ?? "")} bid on token ${
          log.args?.tokenId ?? ""
        }`,
        timestamp,
        txHash,
      };
    case "AcceptedOffer":
      return {
        id,
        type: "offer-accepted",
        title: `Offer #${log.args?.offerId?.toString() ?? ""} accepted`,
        description: `${shortAddress(log.args?.seller ?? "")} accepted ${
          shortAddress(log.args?.offeror ?? "")
        }`,
        timestamp,
        txHash,
      };
    default:
      return null;
  }
}

export function extractTimestamp(log: any) {
  if (log.blockTimestamp) {
    const ts = Number(log.blockTimestamp) * 1000;
    if (Number.isFinite(ts) && ts > 0) return new Date(ts);
  }
  if (log.blockNumber) {
    const approx = Number(log.blockNumber) * 12 * 1000;
    if (Number.isFinite(approx) && approx > 0) {
      return new Date(Date.now() - approx);
    }
  }
  return new Date();
}
