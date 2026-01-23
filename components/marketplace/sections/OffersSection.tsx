import { useEffect, useMemo, useState } from "react";
import { parseUnits, type Address } from "viem";
import { approve } from "thirdweb/extensions/erc20";
import {
  acceptOffer,
  cancelOffer,
  makeOffer,
  type Offer,
} from "thirdweb/extensions/marketplace";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { ArrowDownUp, HandCoins, Timer, Wallet } from "lucide-react";

import type { MarketplaceContract } from "@/components/marketplace/constants";
import { MARKETPLACE_LISTING_CURRENCY } from "@/components/marketplace/constants";
import { SectionHeading } from "@/components/marketplace/components/primitives";
import type { CollectionInfo } from "@/components/marketplace/types";
import {
  formatRelative,
  integerFormatter,
  isOfferLive,
  numberFormatter,
  safeNumber,
  shortAddress,
} from "@/components/marketplace/utils";
import { useCurrencyAllowance } from "@/components/marketplace/hooks/useCurrencyAllowance";

type OffersSectionProps = {
  offers: Offer[];
  contract: MarketplaceContract;
  collections: CollectionInfo[];
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

export function OffersSection({
  offers,
  contract,
  collections,
  onRefetch,
  notifySuccess,
  notifyError,
}: OffersSectionProps) {
  const account = useActiveAccount();
  const openOffers = offers.filter((offer) => isOfferLive(offer, Date.now() / 1000));
  const collectionLookup = useMemo(() => {
    const map = new Map<string, CollectionInfo>();
    collections.forEach((c) => map.set(c.address.toLowerCase(), c));
    return map;
  }, [collections]);

  const decoratedOffers = openOffers.map((offer) => {
    const info = collectionLookup.get(offer.assetContractAddress.toLowerCase());
    return {
      offer,
      name: info?.name ?? shortAddress(offer.assetContractAddress),
    };
  });

  const groupedOffers = useMemo(() => {
    const map = new Map<string, {
      key: string;
      collectionName: string;
      assetContract: string;
      tokenId: string;
      unitValue: number;
      symbol: string;
      offeror: string;
      expiresIn: string;
      totalValue: number;
      quantity: number;
      offers: Offer[];
    }>();

    decoratedOffers.forEach(({ offer, name }) => {
      const quantity = Number(offer.quantity ?? 1n);
      const totalValue = safeNumber(offer.currencyValue?.displayValue);
      const unitValue = quantity > 0 ? totalValue / quantity : totalValue;
      const symbol = offer.currencyValue?.symbol ?? "ERC20";
      const expiresIn = formatRelative(Number(offer.endTimeInSeconds) - Date.now() / 1000);
      const key = `${offer.assetContractAddress.toLowerCase()}_${offer.tokenId.toString()}_${offer.offerorAddress.toLowerCase()}_${unitValue}_${symbol}_${expiresIn}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          collectionName: name,
          assetContract: offer.assetContractAddress,
          tokenId: offer.tokenId.toString(),
          unitValue,
          symbol,
          offeror: offer.offerorAddress,
          expiresIn,
          totalValue,
          quantity,
          offers: [offer],
        });
      } else {
        const entry = map.get(key)!;
        entry.offers.push(offer);
        entry.quantity += quantity;
        entry.totalValue += totalValue;
      }
    });

    return Array.from(map.values());
  }, [decoratedOffers]);

  return (
    <section className="space-y-5">
      <SectionHeading
        title="Collection offers"
        description="Place or review floor offers that apply to any NFT in a collection."
        icon={<HandCoins size={18} />}
      />
      <OfferComposer
        contract={contract}
        collections={collections}
        onRefetch={onRefetch}
        notifySuccess={notifySuccess}
        notifyError={notifyError}
      />
      <div className="space-y-1 rounded-2xl border border-cyan-200/10 bg-gradient-to-b from-[#0b1322] via-[#0c1526] to-[#0a111c] p-3 shadow-[0_18px_60px_-42px_rgba(14,165,233,0.55)]">
        <div className="hidden items-center gap-3 rounded-lg border border-cyan-200/15 bg-white/[0.02] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-white/65 md:grid md:grid-cols-[minmax(0,1.1fr),140px,130px,120px,150px]">
          <span>Collection</span>
          <span>Bid</span>
          <span>Bidder</span>
          <span>Expires</span>
          <span className="text-right">Action</span>
        </div>
        {groupedOffers.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            No open collection offers. Seed the market with a floor bid above.
          </p>
        ) : (
          <div className="space-y-1">
            {groupedOffers.map((entry) => (
              <OfferCard
                key={entry.key}
                offerGroup={entry}
                contract={contract}
                onRefetch={onRefetch}
                notifySuccess={notifySuccess}
                notifyError={notifyError}
                isOwner={
                  !!account &&
                  account.address.toLowerCase() === entry.offeror.toLowerCase()
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type OfferCardProps = {
  offerGroup: {
    key: string;
    collectionName: string;
    assetContract: string;
    tokenId: string;
    unitValue: number;
    symbol: string;
    offeror: string;
    expiresIn: string;
    totalValue: number;
    quantity: number;
    offers: Offer[];
  };
  contract: MarketplaceContract;
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
  isOwner: boolean;
};

function OfferCard({
  offerGroup,
  contract,
  onRefetch,
  notifySuccess,
  notifyError,
  isOwner,
}: OfferCardProps) {
  const account = useActiveAccount();
  const amount = `${numberFormatter.format(offerGroup.unitValue)} ${offerGroup.symbol} each`;
  const totalLabel = `${numberFormatter.format(offerGroup.totalValue)} ${offerGroup.symbol} total`;
  const groupedQuantity = integerFormatter.format(offerGroup.quantity);
  const firstOffer = offerGroup.offers[0];
  const invalidTarget = offerGroup.tokenId === "0";

  return (
    <article className="group relative isolate rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[12px] text-white transition hover:border-cyan-200/40 hover:bg-white/[0.04]">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100">
        <div className="h-full w-full bg-gradient-to-r from-cyan-500/10 via-emerald-400/8 to-blue-500/10" />
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1.1fr),140px,130px,120px,150px] md:items-center">
        <div className="space-y-1">
          <p className="text-[13px] font-semibold leading-tight text-white">
            {offerGroup.collectionName}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 bg-white/5 px-1.5 py-[2px] font-mono text-[10px] text-white/80">
              {shortAddress(offerGroup.assetContract)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 bg-white/5 px-1.5 py-[2px] font-mono text-[10px] text-white/80">
              #{offerGroup.tokenId}
            </span>
            <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300/25 bg-emerald-500/10 px-1.5 py-[2px] text-[10px] font-semibold text-emerald-100">
              Qty {groupedQuantity}
            </span>
          </div>
        </div>

        <div className="space-y-0.5">
          <p className="text-[12px] font-semibold text-emerald-100">{amount}</p>
          <p className="text-[11px] text-white/60">{totalLabel}</p>
        </div>

        <div className="space-y-0.5">
          <p className="flex items-center gap-1 text-[11px] text-white/75">
            <Wallet size={12} /> {shortAddress(offerGroup.offeror)}
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="flex items-center gap-1 text-[11px] text-white/70">
            <Timer size={12} /> {offerGroup.expiresIn}
          </p>
          {invalidTarget && (
            <p className="text-[10px] text-amber-200/80">Offer missing target token; cannot accept.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <TransactionButton
            unstyled
            className="inline-flex items-center justify-center rounded-md border border-emerald-300/30 bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-blue-500/20 px-3 py-1.25 text-[11px] font-semibold text-emerald-50 transition hover:border-emerald-200/60 hover:from-emerald-500/30 hover:to-blue-500/25 focus:outline-none focus:ring-0"
            disabled={!account || invalidTarget}
            transaction={() =>
              acceptOffer({
                contract,
                offerId: firstOffer.id,
              })
            }
            onTransactionConfirmed={() => {
              notifySuccess("Offer accepted", `${totalLabel} transferred to your wallet.`);
              onRefetch();
            }}
            onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
          >
            Accept
          </TransactionButton>
          {isOwner && (
            <TransactionButton
              unstyled
              className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-1.25 text-[11px] font-semibold text-white transition hover:border-white/30 focus:outline-none focus:ring-0"
              transaction={() =>
                cancelOffer({
                  contract,
                  offerId: firstOffer.id,
                })
              }
              onTransactionConfirmed={() => {
                notifySuccess("Offer cancelled");
                onRefetch();
              }}
              onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
            >
              Cancel
            </TransactionButton>
          )}
        </div>
      </div>
    </article>
  );
}

type OfferComposerProps = {
  contract: MarketplaceContract;
  collections: CollectionInfo[];
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

function OfferComposer({
  contract,
  collections,
  onRefetch,
  notifySuccess,
  notifyError,
}: OfferComposerProps) {
  const account = useActiveAccount();
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [expiryHours, setExpiryHours] = useState("48");

  useEffect(() => {
    if (!selectedCollection && collections.length > 0) {
      setSelectedCollection(collections[0].address);
    }
  }, [collections, selectedCollection]);

  const perUnitWei = (() => {
    try {
      return amount ? parseUnits(amount, 18) : 0n;
    } catch {
      return 0n;
    }
  })();
  const totalPriceWei = perUnitWei;

  const allowanceState = useCurrencyAllowance({
    currencyAddress: MARKETPLACE_LISTING_CURRENCY as Address,
    accountAddress: account?.address as Address | undefined,
    spenderAddress: contract.address as Address,
    decimals: 18,
    requiredAmountWei: totalPriceWei,
  });

  const approvalSymbol = shortAddress(MARKETPLACE_LISTING_CURRENCY);
  const needsApproval = allowanceState.needsApproval;
  const hasSufficientBalance = allowanceState.hasSufficientBalance;
  const currencyContract = allowanceState.currencyContract;
  const refreshAllowance = allowanceState.refresh;

  const currencyStatusMessage = (() => {
    if (!account) return "Connect wallet to check offer funds.";
    if (allowanceState.loading) return "Checking allowance…";
    if (allowanceState.error) return "Allowance check unavailable.";
    if (!hasSufficientBalance) return `Need more ${approvalSymbol} to fund this offer.`;
    if (needsApproval) return `Approve ${approvalSymbol} before submitting.`;
    return `Ready to fund with ${approvalSymbol}.`;
  })();

  const handleOffer = () => {
    if (!selectedCollection) {
      throw new Error("Select a collection to target.");
    }
    if (perUnitWei <= 0n) {
      throw new Error("Enter a valid per-NFT offer amount.");
    }
    if (!tokenId) {
      throw new Error("Enter a target token ID.");
    }
    const expirationSeconds = BigInt(
      Math.floor(Date.now() / 1000 + Number(expiryHours || "24") * 3600),
    );
    const expirationDate = new Date(Number(expirationSeconds) * 1000);
    return makeOffer({
      contract,
      assetContractAddress: selectedCollection as Address,
      tokenId: BigInt(tokenId),
      quantity: 1n,
      currencyContractAddress: MARKETPLACE_LISTING_CURRENCY as Address,
      totalOfferWei: perUnitWei,
      offerExpiresAt: expirationDate,
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_16px_60px_-46px_rgba(0,0,0,0.85)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-white">Post a collection offer</p>
          <p className="text-[11px] text-white/60">Bid targets a specific token within the selected collection.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/60">
          <ArrowDownUp size={12} />
          Floor intent
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Collection</p>
          <select
            value={selectedCollection}
            onChange={(event) => setSelectedCollection(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
          >
            {collections.length === 0 ? (
              <option value="">No collections detected</option>
            ) : (
              collections.map((collection) => (
                <option key={collection.address} value={collection.address}>
                  {collection.name ?? shortAddress(collection.address)}
                </option>
              ))
            )}
          </select>
          <p className="text-[11px] text-white/50">Targets a specific token within this collection.</p>
        </div>

        <div className="space-y-1 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Offer amount</p>
          <input
            type="number"
            min="0"
            step="0.0001"
            placeholder="0.0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
          />
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-[2px] uppercase tracking-[0.12em]">
              Currency
            </span>
            {shortAddress(MARKETPLACE_LISTING_CURRENCY)}
          </div>
          <p className="text-[11px] text-white/50">Per NFT bid.</p>
        </div>

        <div className="space-y-1 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Expiry (hrs)</p>
          <input
            type="number"
            min="1"
            value={expiryHours}
            onChange={(event) => setExpiryHours(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
          />
          <p className="text-[11px] text-white/50">Defaults to 48 hours.</p>
        </div>

        <div className="space-y-1 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Token ID</p>
          <input
            type="number"
            min="0"
            step="1"
            value={tokenId}
            onChange={(event) => setTokenId(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
          />
          <p className="text-[11px] text-white/50">Specific token to sell into this bid.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-[12px] text-white/60">
          <p>
            {currencyStatusMessage}{" "}
            (Total spend: {numberFormatter.format(Number(amount || 0))}{" "}
            {shortAddress(MARKETPLACE_LISTING_CURRENCY)})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {needsApproval && currencyContract && perUnitWei > 0n && (
            <TransactionButton
              unstyled
              className="rounded-md border border-emerald-300/30 bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-blue-500/20 px-3 py-1.25 text-[12px] font-semibold text-emerald-50 transition hover:border-emerald-200/60 hover:from-emerald-500/30 hover:to-blue-500/25 focus:outline-none focus:ring-0"
              disabled={!account}
              transaction={() => {
                if (!account) {
                  throw new Error("Connect your wallet to approve currency.");
                }
                return approve({
                  contract: currencyContract,
                  spender: contract.address as Address,
                  amountWei: perUnitWei,
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
          <TransactionButton
            unstyled
            className="rounded-md border border-cyan-300/30 bg-gradient-to-r from-cyan-500/20 via-emerald-500/15 to-blue-500/20 px-4 py-1.5 text-[12px] font-semibold text-white transition hover:border-cyan-200/60 hover:from-cyan-500/30 hover:to-blue-500/30 focus:outline-none focus:ring-0"
            disabled={
              !account ||
              perUnitWei <= 0n ||
              !hasSufficientBalance ||
              needsApproval
            }
            transaction={() => {
              if (!account) throw new Error("Connect your wallet to post an offer.");
              if (!hasSufficientBalance) {
                throw new Error(`Need more ${approvalSymbol} to fund this offer.`);
              }
              if (needsApproval) {
                throw new Error(`Approve ${approvalSymbol} before submitting.`);
              }
              return handleOffer();
            }}
            onTransactionConfirmed={() => {
              notifySuccess("Offer submitted", "Collection floor bid is now live.");
              onRefetch();
              setAmount("");
            }}
            onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
          >
            Post single offer
          </TransactionButton>
        </div>
      </div>
    </div>
  );
}
