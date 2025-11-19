import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { getContract } from "thirdweb";
import {
  getNFT as getErc721NFT,
  isApprovedForAll as isErc721ApprovedForAll,
  isERC721,
  ownerOf,
} from "thirdweb/extensions/erc721";
import {
  balanceOf as erc1155BalanceOf,
  getNFT as getErc1155NFT,
  isApprovedForAll as isErc1155ApprovedForAll,
  isERC1155,
} from "thirdweb/extensions/erc1155";

import { MARKETPLACE_CONTRACT } from "@/components/marketplace/constants";
import { client } from "@/lib/thirdweb";
import { MARKETPLACE_V3_CHAIN } from "@/marketplace/config";

type AssetStandard = "erc721" | "erc1155" | null;

type AssetInsightsState = {
  standard: AssetStandard;
  metadata: Record<string, any> | null;
  ownedBalance: number;
  hasApproval: boolean;
  loading: boolean;
  error: string | null;
  contract?: ReturnType<typeof getContract>;
};

const INITIAL_STATE: AssetInsightsState = {
  standard: null,
  metadata: null,
  ownedBalance: 0,
  hasApproval: false,
  loading: false,
  error: null,
  contract: undefined,
};

export function useListingAssetInsights(
  collectionAddress?: string,
  tokenId?: string,
  accountAddress?: Address,
) {
  const [state, setState] = useState<AssetInsightsState>(INITIAL_STATE);

  const refresh = useCallback(async () => {
    if (!collectionAddress || !tokenId) {
      setState(INITIAL_STATE);
      return;
    }

    let tokenBigInt: bigint;
    try {
      tokenBigInt = BigInt(tokenId);
    } catch {
      setState((prev) => ({
        ...INITIAL_STATE,
        error: "Enter a valid numeric token ID.",
      }));
      return;
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

      const standard: AssetStandard = is721 ? "erc721" : is1155 ? "erc1155" : null;
      if (!standard) {
        throw new Error("Collection must implement ERC721 or ERC1155.");
      }

      const metadata =
        standard === "erc721"
          ? (await getErc721NFT({ contract, tokenId: tokenBigInt }))?.metadata ?? null
          : (await getErc1155NFT({ contract, tokenId: tokenBigInt }))?.metadata ?? null;

      let ownedBalance = 0;
      let hasApproval = false;
      if (accountAddress) {
        if (standard === "erc721") {
          const owner = await ownerOf({ contract, tokenId: tokenBigInt });
          ownedBalance = owner?.toLowerCase() === accountAddress.toLowerCase() ? 1 : 0;
          hasApproval = await isErc721ApprovedForAll({
            contract,
            owner: accountAddress,
            operator: MARKETPLACE_CONTRACT.address as Address,
          });
        } else {
          ownedBalance = Number(
            await erc1155BalanceOf({
              contract,
              owner: accountAddress,
              tokenId: tokenBigInt,
            }),
          );
          hasApproval = await isErc1155ApprovedForAll({
            contract,
            owner: accountAddress,
            operator: MARKETPLACE_CONTRACT.address as Address,
          });
        }
      }

      setState({
        standard,
        metadata,
        ownedBalance,
        hasApproval,
        loading: false,
        error: null,
        contract,
      });
    } catch (err) {
      setState({
        ...INITIAL_STATE,
        error: err instanceof Error ? err.message : "Unable to load asset insights.",
      });
    }
  }, [accountAddress, collectionAddress, tokenId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh],
  );
}
