import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// --- Chains ---
const PRIMARY_BSC_RPC = process.env.RPC_BSC_HTTP || "https://bsc-dataseed1.binance.org";
const FALLBACK_BSC_RPC = process.env.RPC_BSC_QNODE_HTTP;
const BSC_RPC_LIST = [PRIMARY_BSC_RPC, FALLBACK_BSC_RPC].filter(
  (url): url is string => Boolean(url),
);
const BSC_RPC = BSC_RPC_LIST[0];

export const bsc = defineChain({
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  // Provide flat rpc field (some thirdweb internals may rely on chain.rpc)
  rpc: BSC_RPC,
  rpcUrls: {
    default: { http: BSC_RPC_LIST },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://bscscan.com" },
  },
  testnet: false,
});

export const bscTestnet = defineChain({
  id: 97,
  name: "BNB Smart Chain Testnet",
  nativeCurrency: { name: "BNB Chain Native Token", symbol: "tBNB", decimals: 18 },
  rpc: [process.env.RPC_BSC_TESTNET_HTTP || "https://data-seed-prebsc-1-s1.binance.org:8545"],
  rpcUrls: {
    default: {
      http: [process.env.RPC_BSC_TESTNET_HTTP || "https://data-seed-prebsc-1-s1.binance.org:8545"],
    },
  },
  blockExplorers: {
    default: { name: "BscScan Testnet", url: "https://testnet.bscscan.com" },
  },
  testnet: true,
});

export const core = defineChain({
  id: 1116,
  name: "Core",
  nativeCurrency: { name: "CORE", symbol: "CORE", decimals: 18 },
  rpc: [process.env.CORE_RPC_1 || "https://rpc.ankr.com/core"],
  rpcUrls: {
    default: { http: [process.env.CORE_RPC_1 || "https://rpc.ankr.com/core"] },
  },
  blockExplorers: {
    default: { name: "CoreScan", url: "https://scan.coredao.org" },
  },
  testnet: false,
});

export const supportedChains = [bsc, bscTestnet, core];

// Minimal helper expected by staking page for RPC rotation (currently returns primary list only)
export function getRpcHttpUrls(chainKey: "bsc" | "bscTestnet" | "core"): string[] {
  if (chainKey === "core") {
    return (core as any).rpcUrls.default.http;
  }
  if (chainKey === "bscTestnet") {
    return (bscTestnet as any).rpcUrls.default.http;
  }
  return (bsc as any).rpcUrls.default.http;
}

// --- Thirdweb client ---
// A browser-facing Client ID MUST be public. Do NOT use your secret key here.
// The variable name keeps NEXT_PUBLIC_ so Next.js exposes it client-side.
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
if (!clientId) {
  // eslint-disable-next-line no-console
  console.warn("⚠️ NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set. Set it in your .env (public client id, NOT secret key). Wallet connect will not work.");
}

export const client = createThirdwebClient({ clientId: clientId || "missing_client_id" });
