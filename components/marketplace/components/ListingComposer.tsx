import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { createListing } from "thirdweb/extensions/marketplace";
import { sendTransaction } from "thirdweb";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import {
  setApprovalForAll as setErc721ApprovalForAll,
  transferFrom,
} from "thirdweb/extensions/erc721";
import {
  setApprovalForAll as setErc1155ApprovalForAll,
  safeTransferFrom,
} from "thirdweb/extensions/erc1155";
import Image from "next/image";
import { RefreshCcw } from "lucide-react";

import {
  MARKETPLACE_CONTRACT,
  MARKETPLACE_LISTING_CURRENCY,
} from "@/components/marketplace/constants";
import type { CollectionInfo } from "@/components/marketplace/types";
import { useListingAssetInsights } from "@/components/marketplace/hooks/useListingAssetInsights";
import { useOwnedTokens, type OwnedToken } from "@/components/marketplace/hooks/useOwnedTokens";
import { resolveMediaUrl, shortAddress } from "@/components/marketplace/utils";

type ListingComposerProps = {
  collections: CollectionInfo[];
  collectionsLoading: boolean;
  collectionsError: string | null;
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

export function ListingComposer({
  collections,
  collectionsLoading,
  collectionsError,
  onRefetch,
  notifySuccess,
  notifyError,
}: ListingComposerProps) {
  const account = useActiveAccount();
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [tokenId, setTokenId] = useState("");
  const [pricePerToken, setPricePerToken] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("1");
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [bulkPricePerToken, setBulkPricePerToken] = useState("");
  const [bulkListingLoading, setBulkListingLoading] = useState(false);

  useEffect(() => {
    if (!selectedCollection && collections.length > 0) {
      setSelectedCollection(collections[0].address);
    }
  }, [collections, selectedCollection]);

  const {
    standard,
    metadata: assetMetadata,
    ownedBalance,
    hasApproval,
    loading: assetLoading,
    error: assetError,
    contract: assetContract,
    refresh: refreshAsset,
  } = useListingAssetInsights(
    selectedCollection,
    tokenId,
    account?.address as Address | undefined,
  );
  const {
    tokens: ownedTokens,
    loading: ownedTokensLoading,
    error: ownedTokensError,
    refresh: refreshOwnedTokens,
    deepScanAvailable,
    deepScanRunning,
  } = useOwnedTokens(selectedCollection, account?.address as Address | undefined);

  const handleTokenSelection = useCallback(
    (nextId: string) => {
      setTokenId(nextId);
    },
    [],
  );

  useEffect(() => {
    if (!tokenId && ownedTokens.length > 0) {
      handleTokenSelection(ownedTokens[0].tokenId);
    }
  }, [ownedTokens, tokenId, handleTokenSelection]);

  const selectedOwnedToken = useMemo(
    () => ownedTokens.find((token) => token.tokenId === tokenId),
    [ownedTokens, tokenId],
  );
  const selectedBulkTokens = useMemo(
    () => ownedTokens.filter((token) => selectedTokenIds.includes(token.tokenId)),
    [ownedTokens, selectedTokenIds],
  );

  const quantityNumber = 1;
  const detectedStandard = standard ?? selectedOwnedToken?.standard ?? null;
  const effectiveOwnedBalance = selectedOwnedToken?.quantityOwned ?? ownedBalance;
  const isInsightsLoading = ownedTokensLoading || assetLoading;

  const ownershipSatisfied = useMemo(() => {
    if (!account || !detectedStandard) return false;
    if (detectedStandard === "erc721") return effectiveOwnedBalance >= 1;
    return effectiveOwnedBalance >= quantityNumber;
  }, [account, detectedStandard, effectiveOwnedBalance, quantityNumber]);

  const transferAmount = useMemo(() => {
    const parsed = Number(transferQuantity || "1");
    const base = Number.isNaN(parsed) ? 1 : parsed;
    if (detectedStandard === "erc1155") {
      return Math.min(Math.max(1, base), Math.max(1, effectiveOwnedBalance));
    }
    return 1;
  }, [transferQuantity, detectedStandard, effectiveOwnedBalance]);

  const handleListing = () => {
    if (!selectedCollection) {
      throw new Error("Select a whitelisted collection.");
    }
    if (!pricePerToken) {
      throw new Error("Set a price for your listing.");
    }
    const resolvedTokenId = (tokenId || "").trim();
    if (!resolvedTokenId) {
      throw new Error("Select or enter a token ID.");
    }
    const now = Math.floor(Date.now() / 1000);
    const start = now; // list immediately
    const duration = 365 * 24 * 3600; // keep live for 1 year
    const startDate = new Date(start * 1000);
    const endDate = new Date((start + duration) * 1000);

    if (!account) {
      throw new Error("Connect your wallet to list assets.");
    }
    if (!ownershipSatisfied) {
      throw new Error("You do not own enough of this token to list it.");
    }
    if (!hasApproval) {
      throw new Error("Grant marketplace approvals before listing.");
    }
    return createListing({
      contract: MARKETPLACE_CONTRACT,
      assetContractAddress: selectedCollection as Address,
      tokenId: BigInt(resolvedTokenId),
      quantity: 1n,
      currencyContractAddress: MARKETPLACE_LISTING_CURRENCY,
      pricePerToken,
      startTimestamp: startDate,
      endTimestamp: endDate,
      isReservedListing: false,
    });
  };

  const handleTransfer = () => {
    if (!selectedCollection) {
      throw new Error("Select a whitelisted collection.");
    }
    const resolvedTokenId = (tokenId || "").trim();
    if (!resolvedTokenId) {
      throw new Error("Select or enter a token ID.");
    }
    if (!account) {
      throw new Error("Connect your wallet to send assets.");
    }
    if (!assetContract || !detectedStandard) {
      throw new Error("Select a compatible NFT before sending.");
    }
    const destination = transferTo.trim();
    if (!destination) {
      throw new Error("Enter a destination address.");
    }
    if (!ownershipSatisfied) {
      throw new Error("You do not hold this token.");
    }
    if (detectedStandard === "erc721") {
      return transferFrom({
        contract: assetContract,
        from: account.address as Address,
        to: destination as Address,
        tokenId: BigInt(resolvedTokenId),
      });
    }
    return safeTransferFrom({
      contract: assetContract,
      from: account.address as Address,
      to: destination as Address,
      tokenId: BigInt(resolvedTokenId),
      value: BigInt(transferAmount),
      data: "0x",
    });
  };

  const selectedCollectionInfo = collections.find(
    (collection) => collection.address === selectedCollection,
  );

  const toggleBulkToken = useCallback(
    (token: OwnedToken) => {
      setSelectedTokenIds((prev) =>
        prev.includes(token.tokenId)
          ? prev.filter((id) => id !== token.tokenId)
          : [...prev, token.tokenId],
      );
    },
    [],
  );

  const clearBulkSelection = useCallback(() => setSelectedTokenIds([]), []);

  const handleBulkListing = async () => {
    if (!selectedCollection) {
      throw new Error("Select a whitelisted collection.");
    }
    if (selectedBulkTokens.length === 0) {
      throw new Error("Select at least one owned token to list.");
    }
    if (!bulkPricePerToken) {
      throw new Error("Set a price for your listings.");
    }
    if (!account) {
      throw new Error("Connect your wallet to list assets.");
    }
    const now = Math.floor(Date.now() / 1000);
    const start = now;
    const duration = 365 * 24 * 3600;
    const startDate = new Date(start * 1000);
    const endDate = new Date((start + duration) * 1000);

    if (!hasApproval) {
      throw new Error("Grant marketplace approvals before listing.");
    }

    setBulkListingLoading(true);
    try {
      let created = 0;
      for (const token of selectedBulkTokens) {
        const tx = createListing({
          contract: MARKETPLACE_CONTRACT,
          assetContractAddress: selectedCollection as Address,
          tokenId: BigInt(token.tokenId),
          quantity: 1n,
          currencyContractAddress: MARKETPLACE_LISTING_CURRENCY,
          pricePerToken: bulkPricePerToken,
          startTimestamp: startDate,
          endTimestamp: endDate,
          isReservedListing: false,
        });
        await sendTransaction({
          account,
          transaction: tx,
        });
        created += 1;
      }
      notifySuccess(
        "Bulk listings created",
        `${created} token${created === 1 ? "" : "s"} will appear once indexed.`,
      );
      onRefetch();
      setBulkPricePerToken("");
      setSelectedTokenIds([]);
    } finally {
      setBulkListingLoading(false);
    }
  };

  return (
    <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-white">Your wallet inventory & actions</p>
        <p className="text-xs text-white/60">
          Send, single-list, or bulk-list directly against the marketplace trade currency.
        </p>
      </div>
      {collectionsLoading ? (
        <LoadingPanel label="Detecting collections" description="Fetching all ASSET_ROLE contracts..." />
      ) : collections.length === 0 ? (
        <p className="text-sm text-white/60">
          No ASSET_ROLE collections found. Ask an admin to grant the role via the contract before listing.
        </p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-white/40">Collection</p>
              <select
                value={selectedCollection}
                onChange={(event) => setSelectedCollection(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
              >
                {collections.map((collection) => (
                  <option key={collection.address} value={collection.address}>
                    {collection.name ?? shortAddress(collection.address)}
                  </option>
                ))}
              </select>
              {collectionsError && <p className="mt-2 text-xs text-red-300">{collectionsError}</p>}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-white/40">Your token</p>
              {ownedTokensLoading ? (
                <LoadingPanel label="Syncing token IDs" />
              ) : ownedTokens.length > 0 ? (
                <select
                  value={tokenId}
                  onChange={(event) => handleTokenSelection(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                >
                  {ownedTokens.map((token) => (
                    <option key={token.tokenId} value={token.tokenId}>
                      {token.metadata?.name ?? `Token #${token.tokenId}`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  placeholder="Enter token ID"
                  value={tokenId}
                  onChange={(event) => setTokenId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
                />
              )}
              <p className="mt-2 text-xs text-white/50">
                {ownedTokens.length > 0
                  ? "Showing only NFTs you hold. Tap a token or choose from the dropdown."
                  : "Paste any token ID from this collection."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-white/40">Price (ERC20)</p>
              <input
                type="number"
                placeholder="Set listing price"
                value={pricePerToken}
                onChange={(event) => setPricePerToken(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
              />
              <p className="mt-2 flex items-center gap-2 text-xs text-white/50">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/60">
                  Currency
                </span>
                {shortAddress(MARKETPLACE_LISTING_CURRENCY)}
              </p>
            </div>
          </div>

          {selectedCollectionInfo && (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedCollectionInfo.name ?? shortAddress(selectedCollectionInfo.address)}
                </p>
                <p className="text-xs text-white/50">{shortAddress(selectedCollectionInfo.address)}</p>
                {selectedCollectionInfo.description && (
                  <p className="mt-2 text-xs text-white/60 line-clamp-2">
                    {selectedCollectionInfo.description}
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/60">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/40">Start</p>
                  <p className="text-sm text-white">Immediate</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/40">Duration</p>
                  <p className="text-sm text-white">1 year (max)</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/70">
          <p className="text-xs uppercase tracking-widest text-white/40">Timing</p>
          <p className="text-sm text-white">Lists immediately and stays live for 1 year.</p>
          <p className="text-xs text-white/50">No manual scheduling or expiry controls are exposed.</p>
        </div>
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/70">
          <p className="text-xs uppercase tracking-widest text-white/40">Send selected token</p>
          <input
            type="text"
            placeholder="Destination wallet address"
            value={transferTo}
            onChange={(event) => setTransferTo(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
          />
          {detectedStandard === "erc1155" && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={transferQuantity}
                onChange={(event) => setTransferQuantity(event.target.value)}
                className="w-24 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-white focus:border-cyan-300/60 focus:outline-none"
              />
              <span className="text-[11px] text-white/50">
                You own {effectiveOwnedBalance}
              </span>
            </div>
          )}
          <TransactionButton
            disabled={
              !account ||
              !detectedStandard ||
              !tokenId ||
              !ownershipSatisfied ||
              !transferTo ||
              collections.length === 0
            }
            transaction={() => {
              return handleTransfer();
            }}
            onTransactionConfirmed={() => {
              const destination = transferTo.trim();
              notifySuccess("Asset sent", `Token #${tokenId} sent to ${shortAddress(destination)}`);
              refreshAsset();
              refreshOwnedTokens();
              setTransferTo("");
              setTransferQuantity("1");
            }}
            onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
          >
            Send NFT
          </TransactionButton>
          <p className="text-[11px] text-white/50">
            Uses safe transfer with your connected wallet as the sender.
          </p>
        </div>
      </div>

      <div className="text-xs text-white/60">
        Listings settle in {shortAddress(MARKETPLACE_LISTING_CURRENCY)}. Ensure your NFT approvals are set so the
        marketplace contract can transfer them on sale.
      </div>

      <OwnedTokensGallery
        tokens={ownedTokens}
        loading={ownedTokensLoading}
        error={ownedTokensError}
        selectedTokenId={tokenId}
        onSelect={(token) => handleTokenSelection(token.tokenId)}
        selectedTokenIds={selectedTokenIds}
        onToggleSelect={toggleBulkToken}
        onClearSelection={clearBulkSelection}
        onRefresh={() => refreshOwnedTokens()}
        onDeepScan={() => refreshOwnedTokens({ deep: true })}
        deepScanAvailable={deepScanAvailable}
        deepScanRunning={deepScanRunning}
        connected={!!account}
      />

        {isInsightsLoading ? (
          <LoadingPanel
            label="Preparing asset readiness"
            description="Fetching metadata, balance, and approval status..."
          />
        ) : assetError ? (
          <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {assetError}
          </div>
        ) : tokenId ? (
          <AssetInsightCard
            metadata={assetMetadata}
            standard={detectedStandard}
            ownedBalance={effectiveOwnedBalance}
            quantity={quantityNumber}
            hasApproval={hasApproval}
            onRefresh={refreshAsset}
          />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/60">
            Select one of your owned tokens to review readiness details.
          </div>
        )}

      {account && standard && !hasApproval && (
        <TransactionButton
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
          transaction={() => {
            if (!assetContract) {
              throw new Error("Select a valid collection before granting approvals.");
            }
            const operator = MARKETPLACE_CONTRACT.address as Address;
            return standard === "erc721"
              ? setErc721ApprovalForAll({
                  contract: assetContract,
                  operator,
                  approved: true,
                })
              : setErc1155ApprovalForAll({
                  contract: assetContract,
                  operator,
                  approved: true,
                });
          }}
          onTransactionConfirmed={() => {
            notifySuccess("Approval granted", "Marketplace contract can transfer your NFT.");
            refreshAsset();
          }}
          onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
        >
          Grant marketplace approval
        </TransactionButton>
      )}

      {account && !ownershipSatisfied && (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          You own {effectiveOwnedBalance} unit(s) of this token. Select a different token to continue listing.
        </p>
      )}

      <TransactionButton
        transaction={() => {
          return handleListing();
        }}
        disabled={
          !account ||
          collections.length === 0 ||
          !detectedStandard ||
          !ownershipSatisfied ||
          !hasApproval ||
          !pricePerToken ||
          !tokenId
        }
        onTransactionConfirmed={() => {
          notifySuccess("Listing created", "It will appear once indexed.");
          onRefetch();
          setPricePerToken("");
          refreshAsset();
        }}
        onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
      >
        List asset
      </TransactionButton>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Bulk list selected</p>
          <div className="text-xs text-white/60">
            {selectedBulkTokens.length} selected
            {selectedBulkTokens.length > 0 && (
              <button
                type="button"
                onClick={clearBulkSelection}
                className="ml-2 text-cyan-300 underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <label className="text-xs uppercase tracking-widest text-white/50">Price (ERC20)</label>
            <input
              type="number"
              placeholder="Set listing price"
              value={bulkPricePerToken}
              onChange={(event) => setBulkPricePerToken(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <label className="text-xs uppercase tracking-widest text-white/50">Timing</label>
            <p className="text-sm text-white">Lists immediately and stays live for 1 year.</p>
            <p className="text-[11px] text-white/50">No scheduling controls for bulk listings.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <label className="text-xs uppercase tracking-widest text-white/50">Notes</label>
            <p className="text-sm text-white">Approvals must be set before bulk listing.</p>
            <p className="text-[11px] text-white/50">Wallet will prompt once per token.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            handleBulkListing().catch((err) =>
              notifyError(err instanceof Error ? err.message : String(err)),
            );
          }}
          disabled={
            bulkListingLoading ||
            !account ||
            selectedBulkTokens.length === 0 ||
            !hasApproval ||
            !bulkPricePerToken
          }
          className={clsx(
            "w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition",
            bulkListingLoading
              ? "border-white/20 bg-white/10 text-white/50"
              : "border-white/10 bg-black/40 text-white hover:border-white/30",
            (!account ||
              selectedBulkTokens.length === 0 ||
              !hasApproval ||
              !bulkPricePerToken) &&
              "opacity-60 cursor-not-allowed",
          )}
        >
          {bulkListingLoading
            ? "Listing selected..."
            : `List ${selectedBulkTokens.length || 0} selected tokens`}
        </button>
      </div>
    </div>
  );
}

type AssetInsightCardProps = {
  metadata: Record<string, any> | null;
  standard: "erc721" | "erc1155" | null;
  ownedBalance: number;
  quantity: number;
  hasApproval: boolean;
  onRefresh: () => void;
};

function AssetInsightCard({
  metadata,
  standard,
  ownedBalance,
  quantity,
  hasApproval,
  onRefresh,
}: AssetInsightCardProps) {
  const image = resolveMediaUrl(metadata?.image);
  const name = metadata?.name || "Token preview";
  const description = metadata?.description;

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Asset readiness</p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:w-32">
          {image ? (
            <Image src={image} alt={name} fill sizes="128px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
              No preview
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 text-sm text-white/70">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs uppercase tracking-widest text-white/60">
              {standard === "erc721" ? "ERC721" : standard === "erc1155" ? "ERC1155" : "Unknown"}
            </span>
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-xs uppercase tracking-widest",
                hasApproval ? "border border-emerald-400/40 text-emerald-200" : "border border-amber-400/30 text-amber-200",
              )}
            >
              {hasApproval ? "Approved" : "Needs approval"}
            </span>
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-xs uppercase tracking-widest",
                ownedBalance >= quantity
                  ? "border border-emerald-400/40 text-emerald-200"
                  : "border border-amber-400/30 text-amber-200",
              )}
            >
              {ownedBalance >= quantity ? "Sufficient balance" : `Own ${ownedBalance}`}
            </span>
          </div>
          <p className="text-base font-semibold text-white">{name}</p>
          {description && <p className="text-xs text-white/60 line-clamp-2">{description}</p>}
        </div>
      </div>
    </div>
  );
}

type OwnedTokensGalleryProps = {
  tokens: OwnedToken[];
  loading: boolean;
  error: string | null;
  selectedTokenId: string;
  selectedTokenIds?: string[];
  onSelect: (token: OwnedToken) => void;
  onToggleSelect?: (token: OwnedToken) => void;
  onClearSelection?: () => void;
  onRefresh: () => void;
  onDeepScan?: () => void;
  deepScanAvailable?: boolean;
  deepScanRunning?: boolean;
  connected: boolean;
};

function OwnedTokensGallery({
  tokens,
  loading,
  error,
  selectedTokenId,
  selectedTokenIds = [],
  onSelect,
  onToggleSelect,
  onClearSelection,
  onRefresh,
  onDeepScan,
  deepScanAvailable,
  deepScanRunning,
  connected,
}: OwnedTokensGalleryProps) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Tokens you hold</p>
        <div className="flex items-center gap-2 text-xs text-white/60">
          {onClearSelection && selectedTokenIds.length > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-white/60 transition hover:text-white"
            >
              Clear {selectedTokenIds.length} selected
            </button>
          )}
          {deepScanAvailable && onDeepScan && (
            <button
              type="button"
              onClick={onDeepScan}
              disabled={!connected || loading || deepScanRunning}
              className={clsx(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 transition",
                deepScanRunning
                  ? "border-white/15 bg-white/5 text-white/60"
                  : "border-white/15 bg-black/40 hover:text-white",
              )}
            >
              {deepScanRunning ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-cyan-300/60 border-t-transparent" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCcw size={12} />
                  Deep scan
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-white/60 transition hover:text-white"
          >
            <RefreshCcw size={12} /> Refresh
          </button>
        </div>
      </div>
      {!connected ? (
        <p className="text-sm text-white/60">Connect your wallet to browse owned tokens.</p>
      ) : loading ? (
        <LoadingPanel
          label="Syncing wallet inventory"
          description="Deriving token IDs directly from your holdings..."
        />
      ) : error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-white/60">No owned tokens detected for this collection.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {tokens.map((token) => {
            const image = resolveMediaUrl(token.metadata?.image || token.metadata?.image_url);
            const isSelected = token.tokenId === selectedTokenId;
            const inBulk = selectedTokenIds?.includes(token.tokenId);
            return (
              <div
                key={token.tokenId}
                className={clsx(
                  "flex flex-col gap-1 rounded-lg border p-2 text-left transition",
                  isSelected
                    ? "border-cyan-400/60 bg-cyan-400/10"
                    : "border-white/10 bg-white/5 hover:border-white/30",
                  inBulk && "ring-1 ring-cyan-400/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(token)}
                    className="flex-1 text-left"
                  >
                    <div className="relative w-full overflow-hidden rounded-md border border-white/10 bg-black/20 pt-[100%]">
                      {image ? (
                        <Image
                          src={image}
                          alt={token.metadata?.name ?? `Token #${token.tokenId}`}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/60">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 text-[10px] leading-tight text-white/60">
                      <p className="text-white/80">
                        {token.metadata?.name ?? `Token #${token.tokenId}`}
                      </p>
                      <div>{token.standard === "erc721" ? "ERC721" : "ERC1155"}</div>
                    </div>
                  </button>
                  {onToggleSelect && (
                    <label className="inline-flex items-center gap-1 text-[11px] text-white/70">
                      <input
                        type="checkbox"
                        checked={inBulk}
                        onChange={() => onToggleSelect(token)}
                        className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-400 focus:ring-cyan-300"
                      />
                      Bulk
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type LoadingPanelProps = {
  label: string;
  description?: string;
};

function LoadingPanel({ label, description }: LoadingPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-300/70 border-t-transparent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{label}</p>
          {description && <p className="text-xs text-white/60">{description}</p>}
          <div className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
