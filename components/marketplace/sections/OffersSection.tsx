import { useEffect, useMemo, useState } from "react";
import { parseUnits, type Address } from "viem";
import {
  acceptOffer,
  cancelOffer,
  makeOffer,
  type Offer,
} from "thirdweb/extensions/marketplace";
import { approve } from "thirdweb/extensions/erc20";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { HandCoins } from "lucide-react";

import type { MarketplaceContract } from "@/components/marketplace/constants";
import { MARKETPLACE_LISTING_CURRENCY } from "@/components/marketplace/constants";
import { SectionHeading } from "@/components/marketplace/components/primitives";
import type { CatalogAsset, CollectionInfo } from "@/components/marketplace/types";
import {
  formatRelative,
  isOfferLive,
  integerFormatter,
  numberFormatter,
  resolveMediaUrl,
  safeNumber,
  shortAddress,
} from "@/components/marketplace/utils";
import { useCurrencyAllowance } from "@/components/marketplace/hooks/useCurrencyAllowance";

type OffersSectionProps = {
  offers: Offer[];
  contract: MarketplaceContract;
  collections: CollectionInfo[];
  catalogAssets: CatalogAsset[];
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

export function OffersSection({
  offers,
  contract,
  collections,
  catalogAssets,
  onRefetch,
  notifySuccess,
  notifyError,
}: OffersSectionProps) {
  const account = useActiveAccount();
  const openOffers = offers.filter((offer) => isOfferLive(offer, Date.now() / 1000));
  return (
    <section className="space-y-6">
      <SectionHeading
        title="Offers desk"
        description="Incoming bids on ASX collectibles. Accept if you control the asset or post a new offer with a wrapped token."
        icon={<HandCoins size={18} />}
      />
      <OfferComposer
        contract={contract}
        collections={collections}
        catalogAssets={catalogAssets}
        onRefetch={onRefetch}
        notifySuccess={notifySuccess}
        notifyError={notifyError}
      />
      {openOffers.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70">
          No open offers yet. Use the composer above to seed liquidity or wait for collectors to place
          bids on your assets.
        </p>
      ) : (
        <div className="space-y-4">
          {openOffers.map((offer) => (
            <OfferCard
              key={offer.id.toString()}
              offer={offer}
              contract={contract}
              onRefetch={onRefetch}
              notifySuccess={notifySuccess}
              notifyError={notifyError}
              canCancel={
                !!account &&
                account.address.toLowerCase() === offer.offerorAddress.toLowerCase()
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

type OfferCardProps = {
  offer: Offer;
  contract: MarketplaceContract;
  canCancel: boolean;
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

function OfferCard({
  offer,
  contract,
  canCancel,
  onRefetch,
  notifySuccess,
  notifyError,
}: OfferCardProps) {
  const account = useActiveAccount();
  const name =
    offer.asset?.metadata?.name ||
    `Offer #${offer.id.toString()}  ${shortAddress(offer.assetContractAddress)}`;
  const amount = `${numberFormatter.format(
    safeNumber(offer.currencyValue.displayValue),
  )} ${offer.currencyValue.symbol || "ERC20"}`;
  const expiresIn = formatRelative(Number(offer.endTimeInSeconds) - Date.now() / 1000);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <p className="text-lg font-semibold text-white">{name}</p>
        <p className="text-sm text-white/60">
          Bidder {shortAddress(offer.offerorAddress)} wants {integerFormatter.format(Number(offer.quantity || 1n))} unit(s) for {amount}. Expires in {expiresIn}.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TransactionButton
          transaction={() =>
            acceptOffer({
              contract,
              offerId: offer.id,
            })
          }
          disabled={!account}
          onTransactionConfirmed={() => {
            notifySuccess("Offer accepted", `${amount} transferred to your wallet.`);
            onRefetch();
          }}
          onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
        >
          Accept & settle
        </TransactionButton>
        {canCancel && (
          <TransactionButton
            transaction={() =>
              cancelOffer({
                contract,
                offerId: offer.id,
              })
            }
            onTransactionConfirmed={() => {
              notifySuccess("Offer cancelled");
              onRefetch();
            }}
            onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
          >
            Cancel offer
          </TransactionButton>
        )}
      </div>
    </div>
  );
}

type OfferComposerProps = {
  contract: MarketplaceContract;
  collections: CollectionInfo[];
  catalogAssets: CatalogAsset[];
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

function OfferComposer({
  contract,
  collections,
  catalogAssets,
  onRefetch,
  notifySuccess,
  notifyError,
}: OfferComposerProps) {
  const account = useActiveAccount();
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [manualAssetContract, setManualAssetContract] = useState("");
  const [manualTokenId, setManualTokenId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [amount, setAmount] = useState("");
  const [expiryHours, setExpiryHours] = useState("48");

  useEffect(() => {
    if (selectedCollection) return;
    const fromCatalog = catalogAssets[0]?.collectionAddress;
    const fromCollections = collections[0]?.address;
    if (fromCatalog) {
      setSelectedCollection(fromCatalog);
    } else if (fromCollections) {
      setSelectedCollection(fromCollections);
    }
  }, [catalogAssets, collections, selectedCollection]);

  const collectionOptions = useMemo(
    () => {
      const map = new Map<string, { value: string; label: string }>();
      collections.forEach((collection) => {
        map.set(collection.address.toLowerCase(), {
          value: collection.address,
          label: collection.name ?? shortAddress(collection.address),
        });
      });
      catalogAssets.forEach((asset) => {
        const key = asset.collectionAddress.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            value: asset.collectionAddress,
            label: asset.collectionName ?? shortAddress(asset.collectionAddress),
          });
        }
      });
      return Array.from(map.values());
    },
    [catalogAssets, collections],
  );

  const availableAssets = useMemo(() => {
    if (!catalogAssets.length) return [];
    if (!selectedCollection) return catalogAssets;
    const normalized = selectedCollection.toLowerCase();
    return catalogAssets.filter(
      (asset) => asset.collectionAddress.toLowerCase() === normalized,
    );
  }, [catalogAssets, selectedCollection]);

  useEffect(() => {
    if (availableAssets.length === 0) {
      setSelectedAssetId("");
      setUseManualEntry(true);
      return;
    }
    setUseManualEntry(false);
    setSelectedAssetId((prev) => {
      if (prev && availableAssets.some((asset) => asset.id === prev)) {
        return prev;
      }
      return availableAssets[0].id;
    });
  }, [availableAssets]);

  const selectedAsset = useMemo(
    () => availableAssets.find((asset) => asset.id === selectedAssetId),
    [availableAssets, selectedAssetId],
  );

  const resolvedAssetContract =
    useManualEntry || !selectedAsset
      ? manualAssetContract || selectedCollection
      : selectedAsset.assetContractAddress;
  const resolvedTokenId =
    useManualEntry || !selectedAsset ? manualTokenId : selectedAsset?.tokenId ?? "";

  const totalPriceWei = (() => {
    try {
      return amount ? parseUnits(amount, 18) : 0n;
    } catch {
      return 0n;
    }
  })();
  const allowanceState = useCurrencyAllowance({
    currencyAddress: MARKETPLACE_LISTING_CURRENCY as Address,
    accountAddress: account?.address as Address | undefined,
    spenderAddress: contract.address as Address,
    decimals: 18,
    requiredAmountWei: totalPriceWei,
  });
  const approvalSymbol = shortAddress(MARKETPLACE_LISTING_CURRENCY);
  const walletBalanceLabel = (() => {
    if (!allowanceState.balanceFormatted) return null;
    const parsed = Number(allowanceState.balanceFormatted);
    if (!Number.isFinite(parsed)) return null;
    return `${numberFormatter.format(parsed)} ${approvalSymbol} in wallet`;
  })();
  const needsApproval = allowanceState.needsApproval;
  const hasSufficientBalance = allowanceState.hasSufficientBalance;
  const isWarning =
    !!account && (!hasSufficientBalance || needsApproval);
  const currencyStatusTone = isWarning ? "text-amber-200/90" : "text-white/60";
  const currencyStatusMessage = (() => {
    if (!account) return "Connect wallet to check trade currency allowance.";
    if (allowanceState.loading) return "Checking trade currency allowance...";
    if (allowanceState.error) return "Allowance check unavailable";
    if (!hasSufficientBalance) return `Need more ${approvalSymbol} to fund this offer.`;
    if (needsApproval) return `Approve ${approvalSymbol} before submitting.`;
    return walletBalanceLabel || `Requires ${approvalSymbol}`;
  })();
  const currencyContract = allowanceState.currencyContract;
  const refreshAllowance = allowanceState.refresh;
  const showApprovalButton =
    needsApproval && currencyContract !== undefined && totalPriceWei > 0n;

  const handleOffer = () => {
    if (!resolvedAssetContract || !resolvedTokenId || !amount) {
      throw new Error("Select an asset from the dropdowns or fill manual contract + token.");
    }
    if (totalPriceWei <= 0n) {
      throw new Error("Enter a valid offer amount.");
    }
    let quantityBigInt: bigint;
    try {
      quantityBigInt = BigInt(quantity || "1");
    } catch {
      throw new Error("Enter a valid quantity.");
    }
    const expirationSeconds = BigInt(
      Math.floor(Date.now() / 1000 + Number(expiryHours || "24") * 3600),
    );
    const expirationDate = new Date(Number(expirationSeconds) * 1000);
    return makeOffer({
      contract,
      assetContractAddress: resolvedAssetContract as Address,
      tokenId: BigInt(resolvedTokenId),
      quantity: quantityBigInt,
      currencyContractAddress: MARKETPLACE_LISTING_CURRENCY as Address,
      totalOfferWei: totalPriceWei,
      offerExpiresAt: expirationDate,
    });
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Post a new offer</p>
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-widest text-white/60">
          Catalog driven
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-6">
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 lg:col-span-2">
          <p className="text-xs uppercase tracking-widest text-white/50">Collection</p>
          <select
            value={selectedCollection}
            onChange={(event) => setSelectedCollection(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
          >
            {collectionOptions.length === 0 ? (
              <option value="">No collections detected</option>
            ) : (
              collectionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
          <p className="text-[11px] text-white/50">
            Pulls whitelisted collections and any with live liquidity.
          </p>
        </div>
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 lg:col-span-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/50">
            <span>Asset</span>
            <button
              type="button"
              onClick={() => setUseManualEntry((prev) => !prev)}
              className="text-[11px] uppercase tracking-widest text-cyan-200 underline-offset-2 hover:underline"
            >
              {useManualEntry || availableAssets.length === 0 ? "Use catalog" : "Manual entry"}
            </button>
          </div>
          {useManualEntry || availableAssets.length === 0 ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder={
                  selectedCollection ? `Defaults to ${shortAddress(selectedCollection)}` : "Asset contract"
                }
                value={manualAssetContract}
                onChange={(event) => setManualAssetContract(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Token ID"
                value={manualTokenId}
                onChange={(event) => setManualTokenId(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
              />
            </div>
          ) : (
            <select
              value={selectedAssetId}
              onChange={(event) => setSelectedAssetId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
            >
              {availableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} • #{asset.tokenId} ({asset.source}
                  {asset.live ? " live" : ""})
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-white/50">
            {availableAssets.length} assets discovered with metadata.
          </p>
        </div>
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 lg:col-span-2">
          <p className="text-xs uppercase tracking-widest text-white/50">Amount (18 decimals)</p>
          <input
            type="number"
            placeholder="Amount in trade token"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
          />
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest">
              Currency
            </span>
            {shortAddress(MARKETPLACE_LISTING_CURRENCY)}
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <label className="text-xs uppercase tracking-widest text-white/50">Quantity</label>
          <input
            type="number"
            min="1"
            placeholder="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <label className="text-xs uppercase tracking-widest text-white/50">Expiry (hrs)</label>
          <input
            type="number"
            min="1"
            value={expiryHours}
            onChange={(event) => setExpiryHours(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 text-xs text-white/60">
          <span>Trade currency allowance</span>
          {showApprovalButton && (
            <TransactionButton
              disabled={!account || totalPriceWei <= 0n}
              transaction={() => {
                if (!account) {
                  throw new Error("Connect your wallet to approve currency.");
                }
                if (!currencyContract) {
                  throw new Error("Missing ERC20 contract instance.");
                }
                return approve({
                  contract: currencyContract,
                  spender: contract.address as Address,
                  amountWei: totalPriceWei,
                });
              }}
              onTransactionConfirmed={() => {
                notifySuccess("Currency approved", `${approvalSymbol} ready for offers.`);
                refreshAllowance();
              }}
              onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
            >
              Approve
            </TransactionButton>
          )}
        </div>
      </div>
      {selectedAsset && !useManualEntry && (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {selectedAsset.image ? (
              <img
                src={resolveMediaUrl(selectedAsset.image) ?? selectedAsset.image}
                alt={selectedAsset.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-white/60">
                No preview
              </div>
            )}
          </div>
          <div className="space-y-1 text-sm text-white/70">
            <p className="text-base font-semibold text-white">{selectedAsset.name}</p>
            <p className="text-xs text-white/50">
              {selectedAsset.collectionName ?? shortAddress(selectedAsset.assetContractAddress)} • Token #{selectedAsset.tokenId}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-white/50">
              {selectedAsset.source} {selectedAsset.live ? "live" : "indexed"}
            </p>
            {selectedAsset.description && (
              <p className="text-xs text-white/60 line-clamp-2">{selectedAsset.description}</p>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <TransactionButton
          transaction={() => {
            if (!account) throw new Error("Connect your wallet to post offers.");
            if (!hasSufficientBalance) {
              throw new Error(`Need more ${approvalSymbol} to fund this offer.`);
            }
            if (needsApproval) {
              throw new Error(`Approve ${approvalSymbol} before submitting an offer.`);
            }
            return handleOffer();
          }}
          disabled={
            !account ||
            totalPriceWei <= 0n ||
            !hasSufficientBalance ||
            needsApproval ||
            !resolvedAssetContract ||
            !resolvedTokenId
          }
          onTransactionConfirmed={() => {
            notifySuccess("Offer submitted", "It will appear in the desk once indexed.");
            onRefetch();
            setAmount("");
            refreshAllowance();
          }}
          onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
        >
          Submit offer
        </TransactionButton>
      </div>
      <p className={`text-xs ${currencyStatusTone}`}>{currencyStatusMessage}</p>
      <p className="text-xs text-white/50">
        Offers settle in {shortAddress(MARKETPLACE_LISTING_CURRENCY)}. Use the dropdowns to avoid typoed
        contract addresses and keep metadata intact.
      </p>
    </div>
  );
}
