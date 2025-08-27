export const STAKING_POOLS = [
  // BSC staking contracts
  { key: "asx-asx-bsc", chain: "bsc", label: "ASX → ASX", tokens: ["ASX"], address: "0x26A699ebAFFd04B7Fd8D21445F247fD71e9dce5f" },
  { key: "asx-bnb-bsc", chain: "bsc", label: "ASX/BNB LP", tokens: ["ASX", "BNB"], address: "0x5578bffb8D14821E52fd34198E5eF9d9cE968257" },
  { key: "asx-eth-bsc", chain: "bsc", label: "ASX/ETH LP", tokens: ["ASX", "ETH"], address: "0xE6e897D7Eac4DdC8E320CB378060727b30A01220" },
  { key: "asx-btcb-bsc", chain: "bsc", label: "ASX/BTCB LP", tokens: ["ASX", "BTCB"], address: "0x50f9CCA82084D0A1215e627944b629376A9c6070" },
  { key: "asx-sol-bsc", chain: "bsc", label: "ASX/SOL LP", tokens: ["ASX", "SOL"], address: "0x648fF88fB3e661dC5bb75FB4356483eda31DDdc8" },
  // Removed CAT LP pool (deprecated)

  // Core staking
  { key: "asx-asx-core", chain: "core", label: "ASX → ASX (CORE)", tokens: ["ASX"], address: "0x9990C20f9F65c38AeA24D7941Afa6b3cA3DF7deD" },
] as const;
