import { env } from "@/lib/env";
import { safeFetch } from '@/lib/safeFetch';

// Maps for fetching prices from CoinGecko Pro
// We'll query by chain + contract address.
const BSC_CHAIN_SLUG = "binance-smart-chain";

const contracts = {
  asxBsc: "0xebd3619642d78f0c98c84f6fa9a678653fb5a99b",
  wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  weth: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
  btcb: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
  sol: "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF",
  xaum: "0x23AE4fd8E7844cdBc97775496eBd0E8248656028",
};

type PricesShape = { asxBsc: number | null; asxCore: number | null; bnb: number | null; eth: number | null; btcb: number | null; sol: number | null; xaum: number | null };
const NULL_PRICES: PricesShape = { asxBsc: null, asxCore: null, bnb: null, eth: null, btcb: null, sol: null, xaum: null };

// Lightweight in-memory cache to reduce upstream calls & mitigate transient errors.
let cache: { data: PricesShape; ts: number } | null = null;
const CACHE_TTL_MS = 55_000; // just under ISR revalidate (60s) so we usually serve warm

function fromJson(json: any): PricesShape {
  const asxBsc = json?.[contracts.asxBsc.toLowerCase()]?.usd ?? null;
  const asxCore = asxBsc; // mapping ASX on Core to BSC price
  const bnb = json?.[contracts.wbnb.toLowerCase()]?.usd ?? null;
  const eth = json?.[contracts.weth.toLowerCase()]?.usd ?? null;
  const btcb = json?.[contracts.btcb.toLowerCase()]?.usd ?? null;
  const sol = json?.[contracts.sol.toLowerCase()]?.usd ?? null;
  const xaum = json?.[contracts.xaum.toLowerCase()]?.usd ?? null;
  return { asxBsc, asxCore, bnb, eth, btcb, sol, xaum };
}

export async function getPricesServer(): Promise<PricesShape> {
  // Serve cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.data;

  if (!env.COINGECKO_API_KEY) {
    // Fail fast but cache nulls so we don't recompute each request
    cache = { data: NULL_PRICES, ts: Date.now() };
    return NULL_PRICES;
  }

  const url = new URL(`https://pro-api.coingecko.com/api/v3/simple/token_price/${BSC_CHAIN_SLUG}`);
  url.searchParams.set("contract_addresses", [contracts.asxBsc, contracts.wbnb, contracts.weth, contracts.btcb, contracts.sol, contracts.xaum].join(","));
  url.searchParams.set("vs_currencies", "usd");

  try {
    const res = await safeFetch(url.toString(), {
      headers: { accept: "application/json", "x-cg-pro-api-key": env.COINGECKO_API_KEY },
      // @ts-ignore next passthrough
      next: { revalidate: 60 },
      timeoutMs: 6_000,
      retries: 2,
    } as any);
    const json = await res.json();
    const data = fromJson(json);
    cache = { data, ts: Date.now() };
    return data;
  } catch (lastError) {
    console.error("Price fetch failed after retries", lastError);
  }
  // Return stale cache if present
  if (cache) return cache.data;
  cache = { data: NULL_PRICES, ts: Date.now() };
  return NULL_PRICES;
}
