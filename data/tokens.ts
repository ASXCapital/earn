export const TOKENS = [
  // BSC
  { chain: "bsc", symbol: "ASX", name: "ASX Token", address: "0xebd3619642d78f0c98c84f6fa9a678653fb5a99b" },
  { chain: "bsc", symbol: "WBNB", name: "Wrapped BNB", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" },
  { chain: "bsc", symbol: "USDC", name: "USD Coin (BSC)", address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" },
  { chain: "bsc", symbol: "XAUM", name: "XAUM", address: "0x23AE4fd8E7844cdBc97775496eBd0E8248656028" },
  { chain: "bsc", symbol: "ETH", name: "Ethereum (BSC)", address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" },
  { chain: "bsc", symbol: "BTCB", name: "Bitcoin (BSC)", address: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c" },
  { chain: "bsc", symbol: "SOL", name: "Solana (BSC-PEG)", address: "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF" },

  // CORE
  { chain: "core", symbol: "ASX", name: "ASX Token (CORE)", address: "0xB28B43209d9de61306172Af0320f4f55e50E2f29" },
] as const;

export const LPS = [
  { label: "ASX/USDC (Pancake V2)", address: "0xcdA88b440ba9D1096678CECdDc6F823C56a24E5E" },
  { label: "ASX/BNB (Pancake V2)", address: "0x9f0faa9668cA7f0a0c1CeF0d267fcd3af388941B" },
  { label: "ASX/ETH (Pancake V2)", address: "0xA975604Aa84C1e925Cc236D1C489319eB783B1f4" },
  { label: "ASX/BTCB (Pancake V2)", address: "0xc51e01569cd9ce5788Bd80ddE452ace981be5848" },
  { label: "ASX/SOL (Pancake V2)", address: "0x93Cf6C75f0a468835C59687f39bf2661559b3b89" },
] as const;
