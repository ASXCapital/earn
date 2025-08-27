import { env } from "@/lib/env";

// Maps for fetching prices from CoinGecko Pro
// We'll query by chain + contract address.
const BSC_CHAIN_SLUG = "binance-smart-chain";

const contracts = {
  asxBsc: "0xebd3619642d78f0c98c84f6fa9a678653fb5a99b",
  wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  weth: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
  btcb: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
  sol:  "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF",
};

export async function getPricesServer() {
  try {
    const url = new URL(`https://pro-api.coingecko.com/api/v3/simple/token_price/${BSC_CHAIN_SLUG}`);
    url.searchParams.set("contract_addresses", [
      contracts.asxBsc, contracts.wbnb, contracts.weth, contracts.btcb, contracts.sol
    ].join(","));
    url.searchParams.set("vs_currencies", "usd");

    const res = await fetch(url.toString(), {
      headers: { "accept": "application/json", "x-cg-pro-api-key": env.COINGECKO_API_KEY },
      next: { revalidate: 60 }
    });

    if (!res.ok) throw new Error(`Coingecko error ${res.status}`);
    const json = await res.json();

    const asxBsc = json[contracts.asxBsc.toLowerCase()]?.usd ?? null;
    const asxCore = asxBsc; // mapping ASX on Core to BSC for price
    const bnb = json[contracts.wbnb.toLowerCase()]?.usd ?? null;
    const eth = json[contracts.weth.toLowerCase()]?.usd ?? null;
    const btcb = json[contracts.btcb.toLowerCase()]?.usd ?? null;
    const sol = json[contracts.sol.toLowerCase()]?.usd ?? null;

    return { asxBsc, asxCore, bnb, eth, btcb, sol };
  } catch (e) {
    console.error("Price fetch failed", e);
    return { asxBsc: null, asxCore: null, bnb: null, eth: null, btcb: null, sol: null };
  }
}
