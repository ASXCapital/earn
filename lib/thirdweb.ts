import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// --- Chains ---
export const bsc = defineChain({
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  // Provide flat rpc field (some thirdweb internals may rely on chain.rpc)
  rpc: [process.env.RPC_BSC_QNODE_HTTP || "https://bsc-dataseed1.binance.org"],
  rpcUrls: {
    default: { http: [process.env.RPC_BSC_QNODE_HTTP || "https://bsc-dataseed1.binance.org"] },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://bscscan.com" },
  },
  testnet: false,
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

export const supportedChains = [bsc, core];

// Minimal helper expected by staking page for RPC rotation (currently returns primary list only)
export function getRpcHttpUrls(chainKey: 'bsc' | 'core'): string[] {
  return chainKey === 'bsc' ? (bsc as any).rpcUrls.default.http : (core as any).rpcUrls.default.http;
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
