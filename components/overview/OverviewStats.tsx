import { getGlobal, getSimplePrices, getTokenInfo, getCoinData } from "@/lib/coingecko";
import { getWatchedCoins } from "@/data/coins";

// Hard-coded token contract addresses per network for logo fetch (Coingecko onchain info API)
// Network keys follow Coingecko's `networks` list (e.g., 'ethereum', 'binance-smart-chain', 'core', 'solana').
// Adjust addresses as needed.
const TOKEN_CONTRACTS: Record<string, { network: string; address: string }> = {
  ASX: { network: "bsc", address: "0xebd3619642d78f0c98c84f6fa9a678653fb5a99b" }, // TODO: replace with real
  CORE: { network: "core", address: "0x0000000000000000000000000000000000000000" }, // placeholder
  BTC: { network: "ethereum", address: "0x0000000000000000000000000000000000000000" }, // using wrapped BTC would require actual WBTC address
  ETH: { network: "ethereum", address: "0x0000000000000000000000000000000000000000" },
  BNB: { network: "binance-smart-chain", address: "0x0000000000000000000000000000000000000000" },
  SOL: { network: "solana", address: "So11111111111111111111111111111111111111112" },
};

// Map token symbols you care about to Coingecko IDs
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  ASX: "asx-capital",
  CORE: "coredaoorg",
};

function formatUSD(n?: number) {
  if (n == null) return "—";
  return Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatPrice(n?: number) {
  if (n == null) return "—";
  let core: string;
  if (n < 1) core = n.toFixed(4);
  else if (n < 1000) core = n.toFixed(2);
  else core = Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  return `$${core}`;
}

function formatChange(p?: number) {
  if (p == null) return "—";
  const fixed = p.toFixed(2);
  return (p > 0 ? "+" : "") + fixed + "%";
}

function formatCompactUSD(n?: number) {
  if (n == null) return "";
  const T = 1_000_000_000_000;
  const B = 1_000_000_000;
  const M = 1_000_000;
  let value: number;
  let suffix = "";
  if (n >= T) {
    value = n / T; suffix = "T";
  } else if (n >= B) {
    value = n / B; suffix = "B";
  } else if (n >= M) {
    value = n / M; suffix = "M";
  } else {
    // For sub-million keep prior formatting (no suffix, with commas & no decimals beyond 0)
    return formatUSD(n).replace(/\.00$/, "");
  }
  return `$${value.toFixed(2)}${suffix}`; // always two decimals per request
}

export async function OverviewStats() {
  let globalData: Awaited<ReturnType<typeof getGlobal>> | null = null;
  let prices: Awaited<ReturnType<typeof getSimplePrices>> | null = null;
  try {
    [globalData, prices] = await Promise.all([
      getGlobal(),
      getSimplePrices(Object.values(COINGECKO_IDS)),
    ]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Price fetch failed", e);
  }

  const totalMcUsd = globalData?.data.total_market_cap.usd;
  const mcChange = globalData?.data.market_cap_change_percentage_24h_usd;

  const btc = prices?.[COINGECKO_IDS.BTC];
  const eth = prices?.[COINGECKO_IDS.ETH];
  const bnb = prices?.[COINGECKO_IDS.BNB];
  const sol = prices?.[COINGECKO_IDS.SOL];
  const asx = prices?.[COINGECKO_IDS.ASX];
  const core = prices?.[COINGECKO_IDS.CORE];

  // Fetch coin metadata list (including contract addresses if available) to later derive logos via token info
  const watched = await getWatchedCoins();
  // Attempt to fetch logos for coins that have a contract & platform (skip bitcoin / solana base assets if no contract)
  const logoMap: Record<string, string | undefined> = {};
  await Promise.all(
    watched.map(async (w) => {
      let url: string | undefined;
      // Prefer network override if supplied; else fall back to platform for token info
      const networkForOnchain = w.network || w.platform; // 'bsc', 'core', 'ethereum', etc.
      if (w.contractAddress && networkForOnchain) {
        const info = await getTokenInfo(networkForOnchain, w.contractAddress);
        url = info?.data.attributes?.image_url;
      }
      if (!url) {
        const cd = await getCoinData(w.id);
        url = cd?.image?.small || cd?.image?.thumb || cd?.image?.large;
      }
      if (url) logoMap[w.id] = url;
    })
  );

  const Stat = ({ label, value, change, mc, icon }: { label: string; value: string; change?: number; mc?: number; icon?: React.ReactNode }) => {
    const positive = (change ?? 0) > 0;
    const color = change == null ? "text-white/50" : positive ? "text-emerald-400" : change === 0 ? "text-white/50" : "text-red-400";
    // Pre-calc placeholders to maintain uniform card height regardless of missing change/mc
    const changeEl = change != null ? (
      <div className={`font-mono text-2xs tabular-nums ${color} whitespace-nowrap`}>{formatChange(change)}</div>
    ) : (
      <div className="font-mono text-2xs tabular-nums opacity-0 select-none whitespace-nowrap">+0.00%</div>
    );
    const mcEl = mc != null ? (
      <div className="font-mono text-3xs text-white/40 tabular-nums whitespace-nowrap sm:text-right">{formatCompactUSD(mc)}</div>
    ) : (
      <div className="font-mono text-3xs tabular-nums opacity-0 select-none whitespace-nowrap sm:text-right">$0.00B</div>
    );
    return (
      <div className="card p-3 min-w-[150px] flex flex-col gap-2 justify-between">
        <div className="flex items-start justify-between gap-2 min-h-[22px]">
          <div className="flex items-center gap-1 text-2xs tracking-tight text-white/60 whitespace-nowrap">
            {icon && <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
              {typeof icon === 'string' ? icon : icon}
            </span>}
            <span>{label}</span>
          </div>
          {changeEl}
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 min-h-[20px]">
          <div className="font-mono text-sm text-white tabular-nums whitespace-nowrap">{value}</div>
          {mcEl}
        </div>
      </div>
    );
  };

  return (
    <div className="grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
      <Stat label="Global MC" value={formatCompactUSD(totalMcUsd)} change={mcChange} icon={<span className="text-xs">🌐</span>} />
      <Stat label="ASX" value={formatPrice(asx?.usd)} change={asx?.usd_24h_change} mc={asx?.usd_market_cap} icon={logoMap[COINGECKO_IDS.ASX] ? <img alt="ASX" src={logoMap[COINGECKO_IDS.ASX]!} className="h-5 w-5 object-contain rounded-full" /> : <span className="text-xs">🅰️</span>} />
      <Stat label="CORE" value={formatPrice(core?.usd)} change={core?.usd_24h_change} mc={core?.usd_market_cap} icon={logoMap[COINGECKO_IDS.CORE] ? <img alt="CORE" src={logoMap[COINGECKO_IDS.CORE]!} className="h-5 w-5 object-contain rounded-full" /> : <span className="text-xs">⚙️</span>} />
      <Stat label="BTC" value={formatPrice(btc?.usd)} change={btc?.usd_24h_change} mc={btc?.usd_market_cap} icon={logoMap[COINGECKO_IDS.BTC] ? <img alt="BTC" src={logoMap[COINGECKO_IDS.BTC]!} className="h-5 w-5 object-contain rounded-full" /> : <span className="text-xs">₿</span>} />
      <Stat label="ETH" value={formatPrice(eth?.usd)} change={eth?.usd_24h_change} mc={eth?.usd_market_cap} icon={logoMap[COINGECKO_IDS.ETH] ? <img alt="ETH" src={logoMap[COINGECKO_IDS.ETH]!} className="h-5 w-5 object-contain rounded-full" /> : <span className="text-xs">Ξ</span>} />
      <Stat label="BNB" value={formatPrice(bnb?.usd)} change={bnb?.usd_24h_change} mc={bnb?.usd_market_cap} icon={logoMap[COINGECKO_IDS.BNB] ? <img alt="BNB" src={logoMap[COINGECKO_IDS.BNB]!} className="h-5 w-5 object-contain rounded-full" /> : <span className="text-xs">🅱️</span>} />
      <Stat label="SOL" value={formatPrice(sol?.usd)} change={sol?.usd_24h_change} mc={sol?.usd_market_cap} icon={logoMap[COINGECKO_IDS.SOL] ? <img alt="SOL" src={logoMap[COINGECKO_IDS.SOL]!} className="h-5 w-5 object-contain rounded-full" /> : <span className="text-xs">🌀</span>} />
      <Stat label="Updated" value={globalData ? new Date(globalData.data.updated_at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} icon={<span className="text-xs">⏰</span>} />
    </div>
  );
}
