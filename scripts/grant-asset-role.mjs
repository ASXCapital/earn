#!/usr/bin/env node
import "dotenv/config";
import { isAddress } from "viem";
import { createThirdwebClient, getContract, sendTransaction } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { grantRole } from "thirdweb/extensions/permissions";
import { privateKeyToAccount } from "thirdweb/wallets";

const {
  THIRDWEB_SECRET_KEY,
  PRIVATE_KEY,
  NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS,
} = process.env;

if (!THIRDWEB_SECRET_KEY) {
  throw new Error("THIRDWEB_SECRET_KEY is missing from environment");
}
if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is missing from environment");
}
if (!NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS) {
  throw new Error("NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS is missing from environment");
}

const addressesFromArgs = process.argv.slice(2);
const defaultAddresses = [
  "0xf52F6879026Bd5f38e6b3fBF925c4392B8452DAb",
  "0x1EDD86Be0d610d6EBD91C24DB3Ce8fd01D8C66A9",
  "0xD36808Bf4f885B5a7279B46406f7FadB22c95588",
];
const targetAddresses = addressesFromArgs.length > 0 ? addressesFromArgs : defaultAddresses;

const primaryRpc = process.env.RPC_BSC_HTTP || "https://bsc-dataseed1.binance.org";
const rpcFallback = process.env.RPC_BSC_QNODE_HTTP;
const rpcUrls = [primaryRpc, rpcFallback].filter((url): url is string => Boolean(url));
const rpcEndpoint = rpcUrls[0];

const bsc = defineChain({
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpc: rpcEndpoint,
  rpcUrls: {
    default: { http: rpcUrls },
    public: { http: rpcUrls },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://bscscan.com" },
  },
  testnet: false,
});

const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
const account = privateKeyToAccount({ client, privateKey: PRIVATE_KEY });
const contract = getContract({
  client,
  chain: bsc,
  address: NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS,
});

async function main() {
  console.log(`Granting ASSET_ROLE on ${NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS} (BSC mainnet)`);
  const rpcLabel = rpcUrls.join(", ");
  console.log(`Using RPC: ${rpcLabel}`);
  for (const raw of targetAddresses) {
    const address = raw.trim();
    if (!isAddress(address)) {
      console.warn(`- Skipping ${address}: invalid address`);
      continue;
    }
    console.log(`- Granting ASSET_ROLE to ${address}...`);
    const transaction = grantRole({
      contract,
      role: "asset",
      targetAccountAddress: address,
    });
    const receipt = await sendTransaction({ transaction, account });
    console.log(`  Tx hash: ${receipt.transactionHash}`);
  }
  console.log("All done.");
}

main().catch((err) => {
  console.error("Grant role script failed:", err);
  process.exit(1);
});
