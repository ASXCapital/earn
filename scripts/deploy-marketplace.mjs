import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { deployMarketplaceContract } from "thirdweb/deploys";
import { privateKeyToAccount } from "thirdweb/wallets";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadEnvIfNeeded() {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const fileContents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim();
    if (!process.env[key] && value.length) {
      const unquoted =
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
          ? value.slice(1, -1)
          : value;
      process.env[key] = unquoted;
    }
  }
}

loadEnvIfNeeded();

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const privateKey = process.env.PRIVATE_KEY;

if (!secretKey) {
  throw new Error("THIRDWEB_SECRET_KEY is required in your environment to deploy.");
}

if (!privateKey) {
  throw new Error("PRIVATE_KEY is required in your environment to deploy.");
}

const requestedNetwork = (process.env.MARKETPLACE_NETWORK || "").toLowerCase();
const inferredChainId =
  process.env.MARKETPLACE_CHAIN_ID ||
  (requestedNetwork === "mainnet"
    ? "56"
    : requestedNetwork === "testnet"
      ? "97"
      : undefined);

const chainId = Number(inferredChainId || 97);
const isMainnet = chainId === 56;
const isTestnet = chainId === 97;

if (!isMainnet && !isTestnet) {
  throw new Error(
    `Unsupported chain id ${chainId}. This script currently supports BNB Chain mainnet (56) and testnet (97).`,
  );
}

const networkLabel = isMainnet ? "BNB Chain Mainnet" : "BNB Chain Testnet";
const mainnetRpc =
  process.env.BSC_MAINNET_RPC_URL ||
  process.env.RPC_BSC_HTTP ||
  "https://bsc-dataseed1.binance.org";
const testnetRpc =
  process.env.BSC_TESTNET_RPC_URL ||
  process.env.RPC_BSC_TESTNET_HTTP ||
  "https://data-seed-prebsc-1-s1.binance.org:8545";

const rpcUrl = isMainnet ? mainnetRpc : testnetRpc;

const bnbChain = defineChain({
  id: chainId,
  name: networkLabel,
  testnet: isTestnet,
  nativeCurrency: {
    name: "BNB Chain Native Token",
    symbol: isMainnet ? "BNB" : "tBNB",
    decimals: 18,
  },
  rpc: rpcUrl,
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: isMainnet ? "BscScan" : "BscScan Testnet",
      url: isMainnet ? "https://bscscan.com" : "https://testnet.bscscan.com",
    },
  },
});

const client = createThirdwebClient({ secretKey });
const account = privateKeyToAccount({ client, privateKey });

const marketplaceName =
  process.env.MARKETPLACE_NAME?.trim() || "Earn Marketplace V3 (Testnet)";
const marketplaceDescription =
  process.env.MARKETPLACE_DESCRIPTION || "Marketplace V3 deployment for Earn platform.";
const platformFeeBps = Number(
  process.env.MARKETPLACE_PLATFORM_FEE_BPS?.trim() ||
    process.env.NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_BPS?.trim() ||
    "100",
);

if (Number.isNaN(platformFeeBps) || platformFeeBps < 0) {
  throw new Error("MARKETPLACE_PLATFORM_FEE_BPS must be a non-negative number.");
}

const platformFeeRecipient =
  process.env.MARKETPLACE_PLATFORM_FEE_RECIPIENT?.trim() ||
  process.env.NEXT_PUBLIC_MARKETPLACE_PLATFORM_FEE_RECIPIENT?.trim() ||
  account.address;

const trustedForwarders = process.env.MARKETPLACE_TRUSTED_FORWARDERS
  ? process.env.MARKETPLACE_TRUSTED_FORWARDERS.split(",")
      .map((forwarder) => forwarder.trim())
      .filter(Boolean)
  : [];

async function main() {
  console.log(`Deploying Marketplace V3 to ${networkLabel}...`);
  console.log(` - Chain ID: ${chainId}`);
  console.log(` - Admin & fee recipient: ${account.address}`);
  console.log(` - Platform fee (bps): ${platformFeeBps}`);
  console.log(` - RPC: ${rpcUrl}`);

  const address = await deployMarketplaceContract({
    client,
    chain: bnbChain,
    account,
    params: {
      name: marketplaceName,
      description: marketplaceDescription,
      defaultAdmin: account.address,
      platformFeeBps,
      platformFeeRecipient,
      trustedForwarders,
    },
  });

  console.log(`✅ Marketplace deployed at ${address}`);
}

main().catch((error) => {
  console.error("Failed to deploy Marketplace V3:", error);
  process.exit(1);
});
