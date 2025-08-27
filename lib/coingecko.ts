export interface SimplePriceResult {
    [id: string]: {
        usd: number;
        usd_24h_change?: number;
        usd_market_cap?: number;
    };
}

const BASE = "https://pro-api.coingecko.com/api/v3"; // pro endpoint

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: {
            ...(init?.headers || {}),
            "x-cg-pro-api-key": process.env.COINGECKO_API_KEY || "",
        },
        // Enable ISR so the page can remain static with periodic revalidation
        next: { revalidate: 120 }, // 2 minutes
    });
    if (!res.ok) throw new Error(`Coingecko error ${res.status}`);
    return res.json() as Promise<T>;
}

export async function getSimplePrices(ids: string[]): Promise<SimplePriceResult> {
    if (ids.length === 0) return {};
    const url = `${BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
    return fetchJSON<SimplePriceResult>(url);
}

export interface GlobalData {
    data: {
        total_market_cap: { [currency: string]: number };
        market_cap_change_percentage_24h_usd: number;
        updated_at: number;
    };
}

export async function getGlobal(): Promise<GlobalData> {
    const url = `${BASE}/global`;
    return fetchJSON<GlobalData>(url);
}

// --- Token metadata (logo) ---
export interface TokenInfoResponse {
    data: {
        id?: string;
        type?: string;
        attributes?: {
            image_url?: string;
            name?: string;
            symbol?: string;
        };
    };
}

export async function getTokenInfo(network: string, address: string): Promise<TokenInfoResponse | null> {
    try {
        return await fetchJSON<TokenInfoResponse>(`${BASE}/onchain/networks/${network}/tokens/${address}/info`);
    } catch {
        return null;
    }
}

// --- Coins list (ID map) ---
export interface CoinListItem {
    id: string;
    symbol: string;
    name: string;
    platforms?: Record<string, string>; // platform -> contract address
}

let _coinsCache: { ts: number; data: CoinListItem[] } | null = null;

export async function getCoinsList(includePlatform = true): Promise<CoinListItem[]> {
    const now = Date.now();
    if (_coinsCache && now - _coinsCache.ts < 5 * 60 * 1000) { // 5 min cache
        return _coinsCache.data;
    }
    const url = `${BASE}/coins/list?${includePlatform ? 'include_platform=true' : ''}`;
    // IMPORTANT: This endpoint returns a very large JSON (>2MB). Attempting to place it into
    // Next.js incremental cache (using the `next: { revalidate }` option) triggers an error:
    // "Failed to set Next.js data cache, items over 2MB can not be cached". We avoid that by
    // doing a manual fetch with `cache: 'no-store'` and relying solely on our in-memory cache.
    const res = await fetch(url, {
        headers: { "x-cg-pro-api-key": process.env.COINGECKO_API_KEY || "" },
        cache: 'no-store', // prevent Next from attempting to persist this oversized payload
    });
    if (!res.ok) throw new Error(`Coingecko error ${res.status}`);
    const data = await res.json() as CoinListItem[];
    _coinsCache = { ts: now, data };
    return data;
}

export function findCoinById(coins: CoinListItem[], id: string): CoinListItem | undefined {
    return coins.find(c => c.id === id);
}

export function getPlatformAddress(coin: CoinListItem | undefined, platform: string): string | undefined {
    return coin?.platforms?.[platform];
}

// --- Single coin (metadata-only) fetch for fallback image/logo ---
export interface CoinData {
    image?: { thumb?: string; small?: string; large?: string };
}

const _coinDataCache: Record<string, { ts: number; data: CoinData }> = {};

export async function getCoinData(id: string): Promise<CoinData | null> {
    const cached = _coinDataCache[id];
    const now = Date.now();
    if (cached && now - cached.ts < 5 * 60 * 1000) return cached.data;
    try {
        const url = `${BASE}/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
        const data = await fetchJSON<CoinData>(url, { next: { revalidate: 300 } });
        _coinDataCache[id] = { ts: now, data };
        return data;
    } catch {
        return null;
    }
}

// --- Pools search (onchain) ---
export interface PoolsSearchResponse {
    data?: Array<{
        id: string;
        type: string;
        attributes?: any; // we keep loose typing for brevity
        relationships?: any;
    }>;
    included?: Array<{
        id: string;
        type: string;
        attributes?: any;
    }>;
}

const _poolsCache: Record<string, { ts: number; data: PoolsSearchResponse | null }> = {};

export async function getPools(query: string, network: string, page = 1, include = "base_token,quote_token,dex"): Promise<PoolsSearchResponse | null> {
    const key = `${query}:${network}:${page}:${include}`;
    const cached = _poolsCache[key];
    const now = Date.now();
    if (cached && now - cached.ts < 30 * 1000) return cached.data; // 30s cache per docs
    try {
        const url = `${BASE}/onchain/search/pools?query=${encodeURIComponent(query)}&network=${encodeURIComponent(network)}&page=${page}&include=${encodeURIComponent(include)}`;
        const data = await fetchJSON<PoolsSearchResponse>(url, { next: { revalidate: 30 } });
        _poolsCache[key] = { ts: now, data };
        return data;
    } catch {
        _poolsCache[key] = { ts: now, data: null };
        return null;
    }
}
