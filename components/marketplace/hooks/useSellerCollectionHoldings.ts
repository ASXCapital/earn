import { useEffect, useState } from "react";
import type { Address } from "viem";
import { getContract } from "thirdweb";
import {
  getOwnedNFTs as getOwnedErc721NFTs,
  isERC721,
} from "thirdweb/extensions/erc721";
import {
  getOwnedNFTs as getOwnedErc1155NFTs,
  isERC1155,
} from "thirdweb/extensions/erc1155";

import { client } from "@/lib/thirdweb";
import { MARKETPLACE_V3_CHAIN } from "@/marketplace/config";

type HoldingsState = {
  loading: boolean;
  balance: number | null;
  error: string | null;
};

const CACHE_TTL_MS = 2 * 60 * 1000;
const holdingsCache = new Map<
  string,
  {
    balance: number | null;
    error: string | null;
    timestamp: number;
  }
>();

export function useSellerCollectionHoldings(
  collectionAddress?: string,
  sellerAddress?: Address,
): HoldingsState {
  const [state, setState] = useState<HoldingsState>({
    loading: false,
    balance: null,
    error: null,
  });

  useEffect(() => {
    if (!collectionAddress || !sellerAddress) {
      setState({ loading: false, balance: null, error: null });
      return;
    }

    const key = `${collectionAddress.toLowerCase()}:${sellerAddress.toLowerCase()}`;
    const cached = holdingsCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setState({
        loading: false,
        balance: cached.balance,
        error: cached.error,
      });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
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

        let balance = 0;
        if (is721) {
          const owned = await getOwnedErc721NFTs({
            contract,
            owner: sellerAddress,
          });
          balance = owned.length;
        } else if (is1155) {
          const owned = await getOwnedErc1155NFTs({
            contract,
            address: sellerAddress,
          });
          balance = owned.reduce(
            (sum, nft) => sum + Number(nft.quantityOwned ?? 0n),
            0,
          );
        } else {
          throw new Error("Unsupported collection standard.");
        }

        const next = {
          balance,
          error: null,
          timestamp: Date.now(),
        };
        holdingsCache.set(key, next);
        if (!cancelled) {
          setState({ loading: false, balance, error: null });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load seller holdings.";
        const next = {
          balance: null,
          error: message,
          timestamp: Date.now(),
        };
        holdingsCache.set(key, next);
        if (!cancelled) {
          setState({ loading: false, balance: null, error: message });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [collectionAddress, sellerAddress]);

  return state;
}
