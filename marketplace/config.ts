import { bsc, bscTestnet } from "@/lib/thirdweb";

const DEFAULT_MAINNET_ADDRESS = "0xFe2A24DE898BE1284bb99d1Dc5E06f817Ef92529";
const DEFAULT_TESTNET_ADDRESS = "0xfbEe1219180604f9cEF2E9A7C1fCF5392417182f";

const requestedChainId = Number(
  process.env.NEXT_PUBLIC_MARKETPLACE_CHAIN_ID || `${bscTestnet.id}`,
);

const resolvedChain =
  requestedChainId === bsc.id
    ? bsc
    : requestedChainId === bscTestnet.id
      ? bscTestnet
      : bscTestnet;

const isTestnet = resolvedChain.id === bscTestnet.id;

const fallbackAddress =
  process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS ||
  (isTestnet ? DEFAULT_TESTNET_ADDRESS : DEFAULT_MAINNET_ADDRESS);

if (!process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS) {
  // eslint-disable-next-line no-console
  console.warn(
    `NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS is not set. Falling back to ${
      isTestnet ? DEFAULT_TESTNET_ADDRESS : DEFAULT_MAINNET_ADDRESS
    }.`,
  );
}

export const MARKETPLACE_V3_ADDRESS = fallbackAddress;
export const MARKETPLACE_V3_CHAIN = resolvedChain;
export const MARKETPLACE_V3_CHAIN_ID = resolvedChain.id;
export const MARKETPLACE_V3_CHAIN_NAME = resolvedChain.name;
export const MARKETPLACE_V3_EXPLORER =
  resolvedChain.blockExplorers?.default?.url ||
  (isTestnet ? "https://testnet.bscscan.com" : "https://bscscan.com");
export const MARKETPLACE_V3_PLATFORM_FEE_BPS = Number(
  process.env.NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_BPS || "100",
);
export const MARKETPLACE_V3_PLATFORM_FEE_RECIPIENT =
  process.env.NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_RECIPIENT || "";
export const MARKETPLACE_WHITELISTED_COLLECTIONS =
  (process.env.NEXT_PUBLIC_WHITELISTED_COLLECTIONS || "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const listingCurrency =
  process.env.NEXT_PUBLIC_MARKETPLACE_LISTING_CURRENCY ||
  process.env.MARKETPLACE_LISTING_CURRENCY ||
  "";

if (!listingCurrency) {
  // eslint-disable-next-line no-console
  console.warn(
    "NEXT_PUBLIC_MARKETPLACE_LISTING_CURRENCY is not set. Listings default to the zero address.",
  );
}

export const MARKETPLACE_V3_LISTING_CURRENCY = listingCurrency;
