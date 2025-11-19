import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { getContract } from "thirdweb";
import {
  getOwnedNFTs as getOwnedErc721NFTs,
  getNFT as getErc721NFT,
  isERC721,
  ownerOf,
  totalSupply as erc721TotalSupply,
  transferEvent as erc721TransferEvent,
} from "thirdweb/extensions/erc721";
import {
  getOwnedNFTs as getOwnedErc1155NFTs,
  isERC1155,
} from "thirdweb/extensions/erc1155";

import { client } from "@/lib/thirdweb";
import { MARKETPLACE_V3_CHAIN } from "@/marketplace/config";
import { getEventsWithRateLimitRetry, sleep } from "@/components/marketplace/utils";

export type OwnedToken = {
  tokenId: string;
  metadata: Record<string, any> | null;
  quantityOwned: number;
  standard: "erc721" | "erc1155";
};

type OwnedTokensState = {
  tokens: OwnedToken[];
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: OwnedTokensState = {
  tokens: [],
  loading: false,
  error: null,
};

const FALLBACK_TRANSFER_CHUNK = 120_000n;
const FALLBACK_TRANSFER_MAX_CHUNKS = 6;
const FALLBACK_TRANSFER_LIMIT = 60;
const SUPPLY_SCAN_LIMIT = 400;
const FALLBACK_TRANSFER_DELAY_MS = 250;
type RefreshOptions = {
  deep?: boolean;
};

export function useOwnedTokens(
  collectionAddress?: string,
  accountAddress?: Address,
) {
  const [state, setState] = useState<OwnedTokensState>(INITIAL_STATE);
  const [deepScanAvailable, setDeepScanAvailable] = useState(false);
  const [deepScanRunning, setDeepScanRunning] = useState(false);

  const refresh = useCallback(async (options?: RefreshOptions) => {
    if (!collectionAddress || !accountAddress) {
      setState(INITIAL_STATE);
      setDeepScanAvailable(false);
      setDeepScanRunning(false);
      return;
    }

    if (options?.deep) {
      setDeepScanRunning(true);
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const contract = getContract({
        client,
        chain: MARKETPLACE_V3_CHAIN,
        address: collectionAddress as Address,
      });
      const [is721, is1155] = await Promise.all([
        isERC721({ contract }),
        isERC1155({ contract }),
      ]);

      if (!is721 && !is1155) {
        throw new Error("Collection must implement ERC721 or ERC1155.");
      }

      if (is721) {
        try {
          const owned = await getOwnedErc721NFTs({
            contract,
            owner: accountAddress,
          });
          const tokens: OwnedToken[] = owned.map((nft) => ({
            tokenId: nft.id.toString(),
            metadata: nft.metadata ?? null,
            quantityOwned: 1,
            standard: "erc721",
          }));
          setState({ tokens, loading: false, error: null });
          setDeepScanAvailable(false);
          return;
        } catch (err) {
          const rawMessage =
            err instanceof Error ? err.message : "Unable to load owned NFTs.";
          const lower = rawMessage.toLowerCase();
          const offerDeepScan =
            lower.includes("tokenofownerbyindex") || lower.includes("enumerable");

          if (!options?.deep) {
            const friendlyMessage = offerDeepScan
              ? "Collection is not enumerable on-chain. Run a deep scan (slow) to reconstruct holdings."
              : mapOwnedTokenError(rawMessage);
            setState({
              tokens: [],
              loading: false,
              error: friendlyMessage,
            });
            setDeepScanAvailable(offerDeepScan);
            return;
          }

          const fallbackTokens = await fetchErc721TokensViaTransfers(
            contract,
            accountAddress,
          );
          if (fallbackTokens.length > 0) {
            setState({
              tokens: fallbackTokens,
              loading: false,
              error: null,
            });
            setDeepScanAvailable(false);
            return;
          }
          const supplyTokens = await scanErc721TokensBySupply(
            contract,
            accountAddress,
          );
          if (supplyTokens.length > 0) {
            setState({
              tokens: supplyTokens,
              loading: false,
              error: null,
            });
            setDeepScanAvailable(false);
            return;
          }
          throw err;
        }
      }

      const owned = await getOwnedErc1155NFTs({
        contract,
        address: accountAddress,
      });
      const tokens: OwnedToken[] = owned.map((nft) => ({
        tokenId: nft.id.toString(),
        metadata: nft.metadata ?? null,
        quantityOwned: Number(nft.quantityOwned ?? 0n),
        standard: "erc1155",
      }));
      setState({ tokens, loading: false, error: null });
      setDeepScanAvailable(false);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Unable to load owned NFTs.";
      const friendlyMessage = mapOwnedTokenError(rawMessage);
      setState({
        tokens: [],
        loading: false,
        error: friendlyMessage,
      });
      if (!options?.deep) {
        setDeepScanAvailable(false);
      }
    } finally {
      setDeepScanRunning(false);
    }
  }, [accountAddress, collectionAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      ...state,
      refresh,
      deepScanAvailable,
      deepScanRunning,
    }),
    [state, refresh, deepScanAvailable, deepScanRunning],
  );
}

async function fetchErc721TokensViaTransfers(
  contract: ReturnType<typeof getContract>,
  accountAddress: Address,
): Promise<OwnedToken[]> {
  const accountLower = accountAddress.toLowerCase();
  const observed = new Set<string>();
  const owned: OwnedToken[] = [];
  let toBlock: bigint | undefined = undefined;

  for (let chunk = 0; chunk < FALLBACK_TRANSFER_MAX_CHUNKS; chunk++) {
    const logs = await getEventsWithRateLimitRetry({
      contract,
      events: [erc721TransferEvent()],
      blockRange: FALLBACK_TRANSFER_CHUNK,
      toBlock,
      useIndexer: false,
    }).catch((err) => {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("rate limit")) {
        throw err;
      }
      return [];
    });

    if (!logs.length) {
      break;
    }

    const sorted = [...logs].sort((a, b) => {
      const aBlock = a.blockNumber ?? 0n;
      const bBlock = b.blockNumber ?? 0n;
      if (aBlock === bBlock) {
        return Number((b.logIndex ?? 0) - (a.logIndex ?? 0));
      }
      return bBlock > aBlock ? 1 : -1;
    });

    for (const log of sorted) {
      const tokenId = log.args?.tokenId;
      if (tokenId === undefined) continue;
      const key = tokenId.toString();
      if (observed.has(key)) continue;
      observed.add(key);

      const toAddr = (log.args?.to ?? "").toLowerCase();
      if (toAddr !== accountLower) {
        continue;
      }

      try {
        const owner = await ownerOf({ contract, tokenId });
        if (owner?.toLowerCase() !== accountLower) {
          continue;
        }
        const nft = await getErc721NFT({
          contract,
          tokenId,
          useIndexer: false,
        });
        owned.push({
          tokenId: key,
          metadata: nft.metadata ?? null,
          quantityOwned: 1,
          standard: "erc721",
        });
        if (owned.length >= FALLBACK_TRANSFER_LIMIT) {
          return owned;
        }
      } catch {
        // ignore per-token errors
      }
    }

    const minBlock = sorted.reduce<bigint | null>((min, log) => {
      const block = log.blockNumber ?? 0n;
      if (min === null || block < min) return block;
      return min;
    }, null);
    if (!minBlock || minBlock === 0n) {
      break;
    }
    toBlock = minBlock - 1n;
    await sleep(FALLBACK_TRANSFER_DELAY_MS);
  }

  return owned;
}

async function scanErc721TokensBySupply(
  contract: ReturnType<typeof getContract>,
  accountAddress: Address,
): Promise<OwnedToken[]> {
  let supply: bigint | null = null;
  try {
    supply = await erc721TotalSupply({
      contract,
    });
  } catch {
    supply = null;
  }
  if (!supply || supply <= 0n) {
    return [];
  }
  const owned: OwnedToken[] = [];
  const range = supply < BigInt(SUPPLY_SCAN_LIMIT) ? supply : BigInt(SUPPLY_SCAN_LIMIT);
  for (let offset = 0n; offset < range; offset++) {
    const tokenId = supply - 1n - offset;
    try {
      const owner = await ownerOf({
        contract,
        tokenId,
      });
      if (owner?.toLowerCase() !== accountAddress.toLowerCase()) {
        if (tokenId === 0n) break;
        continue;
      }
      const nft = await getErc721NFT({
        contract,
        tokenId,
        useIndexer: false,
      });
      owned.push({
        tokenId: tokenId.toString(),
        metadata: nft.metadata ?? null,
        quantityOwned: 1,
        standard: "erc721",
      });
      if (owned.length >= FALLBACK_TRANSFER_LIMIT) {
        break;
      }
    } catch {
      // ignore invalid tokens
    }
    if (tokenId === 0n) {
      break;
    }
  }
  return owned;
}

function mapOwnedTokenError(rawMessage: string) {
  if (rawMessage.includes("tokenOfOwnerByIndex")) {
    return "This collection does not expose enumerable owner lookups. Enter a token ID manually or run a deep scan to reconstruct holdings.";
  }
  if (rawMessage.toLowerCase().includes("insight")) {
    return "Indexer unavailable on this chain. Try again shortly or input token IDs directly.";
  }
  return rawMessage || "Unable to load owned NFTs.";
}
