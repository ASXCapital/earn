import { getCoinsList, findCoinById, getPlatformAddress } from "@/lib/coingecko";

// Configure which CoinGecko IDs we care about.
// We add optional explicit network + contractAddress overrides when we want the onchain token info logo
// even if CoinGecko's platforms map doesn't expose it (e.g. BSC pegs for BTC/ETH/SOL).
// network values align with Coingecko onchain networks endpoint (e.g. 'bsc', 'eth', 'core', 'solana').
interface WatchConfig { id: string; platform?: string; network?: string; contractAddress?: string }
const WATCH_IDS: WatchConfig[] = [
    { id: "asx-capital", platform: "binance-smart-chain", network: "bsc", contractAddress: "0xebd3619642d78f0c98c84f6fa9a678653fb5a99b" },
    { id: "coredaoorg", platform: "core", network: "core" },
    // Wrapped / pegged representations on BSC
    { id: "bitcoin", platform: "binance-smart-chain", network: "bsc", contractAddress: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c" }, // BTCB (pegged BTC)
    { id: "ethereum", platform: "binance-smart-chain", network: "bsc", contractAddress: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" }, // ETH (pegged)
    { id: "binancecoin", platform: "binance-smart-chain", network: "bsc", contractAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" }, // WBNB
    { id: "solana", platform: "binance-smart-chain", network: "bsc", contractAddress: "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF" }, // SOL (pegged)
];

export interface WatchedCoinMeta {
    id: string;
    symbol: string;
    name: string;
    platform?: string; // CoinGecko platform key for contract discovery
    network?: string; // Onchain network slug for token info endpoint
    contractAddress?: string;
    image?: string;
}

let _watchCache: { ts: number; data: WatchedCoinMeta[] } | null = null;

// Server-side aggregation (do NOT import this directly in client components)
export async function getWatchedCoins(): Promise<WatchedCoinMeta[]> {
    const now = Date.now();
    if (_watchCache && now - _watchCache.ts < 5 * 60 * 1000) return _watchCache.data;

    const list = await getCoinsList(true);
    const hasList = Array.isArray(list) && list.length > 0;
    const mapped: WatchedCoinMeta[] = WATCH_IDS.map(cfg => {
        const coin = hasList ? findCoinById(list, cfg.id) : undefined;
        // Prefer explicit override contractAddress, else try platform lookup
        const discovered = (hasList && cfg.platform) ? getPlatformAddress(coin, cfg.platform) : undefined;
        const contract = cfg.contractAddress || discovered;
        return {
            id: cfg.id,
            symbol: coin?.symbol ?? cfg.id,
            name: coin?.name ?? cfg.id,
            platform: cfg.platform,
            network: cfg.network,
            contractAddress: contract,
            image: undefined,
        };
    });
    _watchCache = { ts: now, data: mapped };
    return mapped;
}

// Client hook for lazy loading via API route ---------------------------------
// Provides: data (array) | null while loading, error (string | null), refresh()

export type { CoinListItem } from "@/lib/coingecko";