import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { approve } from "thirdweb/extensions/erc20";
import { buyFromListing, type DirectListing } from "thirdweb/extensions/marketplace";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { ExternalLink } from "lucide-react";

import { MARKETPLACE_V3_EXPLORER } from "@/marketplace/config";
import type { MarketplaceContract } from "@/components/marketplace/constants";
import { useCurrencyAllowance } from "@/components/marketplace/hooks/useCurrencyAllowance";
import type { ViewMode } from "@/components/marketplace/types";
import {
  getListingState,
  integerFormatter,
  numberFormatter,
  resolveMediaUrl,
  safeNumber,
  shortAddress,
} from "@/components/marketplace/utils";

export type ListingCardProps = {
  listing: DirectListing;
  variant: ViewMode;
  contract: MarketplaceContract;
  onRefetch?: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

export function ListingCard({
  listing,
  variant,
  contract,
  onRefetch,
  notifySuccess,
  notifyError,
}: ListingCardProps) {
  const account = useActiveAccount();
  const [quantity, setQuantity] = useState(1);
  const [manualApprovalWei, setManualApprovalWei] = useState<bigint>(0n);
  const media = resolveMediaUrl(listing.asset?.metadata?.image as string | undefined);
  const name =
    listing.asset?.metadata?.name ||
    `Token #${listing.tokenId.toString()}  ${shortAddress(listing.assetContractAddress)}`;
  const pricePerToken = safeNumber(listing.currencyValuePerToken.displayValue);
  const symbol = listing.currencyValuePerToken.symbol || "tBNB";
  const maxQuantity = Math.max(1, Number(listing.quantity || 1n));
  const state = getListingState(listing);
  const totalLabel =
    quantity > 1
      ? `${numberFormatter.format(pricePerToken * quantity)} ${symbol}`
      : `${numberFormatter.format(pricePerToken)} ${symbol}`;

  const currencyContractAddress = listing.currencyContractAddress as Address | undefined;
  const pricePerTokenWei = listing.currencyValuePerToken.value ?? 0n;
  const totalCostWei = pricePerTokenWei * BigInt(quantity || 1);

  const {
    balanceFormatted,
    hasSufficientAllowance,
    hasSufficientBalance,
    isNativeCurrency,
    loading: checkingCurrency,
    error: currencyError,
    currencyContract,
    refresh: refreshCurrencyState,
    checksFailed,
  } = useCurrencyAllowance({
    currencyAddress: currencyContractAddress,
    accountAddress: account?.address as Address | undefined,
    spenderAddress: contract.address as Address,
    decimals: listing.currencyValuePerToken.decimals ?? 18,
    requiredAmountWei: totalCostWei,
  });

  useEffect(() => {
    setManualApprovalWei(0n);
  }, [listing.id, currencyContractAddress, account?.address]);

  const manualApprovalSatisfied = manualApprovalWei >= totalCostWei;
  const currencyCheckUnavailable = Boolean(currencyError) || checksFailed;
  const balanceCheckPassed = isNativeCurrency || hasSufficientBalance;
  const allowanceCheckPassed = isNativeCurrency || hasSufficientAllowance;
  const showBalanceWarning = !currencyCheckUnavailable && !balanceCheckPassed;
  const showAllowanceWarning =
    !currencyCheckUnavailable && !allowanceCheckPassed && !manualApprovalSatisfied;
  const effectiveBalanceReady = balanceCheckPassed || currencyCheckUnavailable;
  const effectiveAllowanceReady =
    allowanceCheckPassed || manualApprovalSatisfied || currencyCheckUnavailable;
  const canCollect = state.state === "live" && effectiveBalanceReady && effectiveAllowanceReady;

  const walletBalanceLabel = (() => {
    if (balanceFormatted === null) return null;
    const parsed = Number(balanceFormatted);
    if (!Number.isFinite(parsed)) return null;
    return `${numberFormatter.format(parsed)} ${symbol} in wallet`;
  })();
  const currencyStatusTone =
    account && (showBalanceWarning || showAllowanceWarning || currencyCheckUnavailable)
      ? "text-amber-200/90"
      : "text-white/60";

  const handleQtyChange = (value: number) => {
    if (Number.isNaN(value)) return;
    const bounded = Math.min(Math.max(1, value), maxQuantity);
    setQuantity(bounded);
  };

  return (
    <article
      className={clsx(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition hover:border-white/30",
        variant === "immersive" ? "flex flex-col gap-5 sm:flex-row" : "space-y-5",
      )}
    >
      <div
        className={clsx(
          "relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5",
          variant === "immersive" ? "aspect-square w-full max-w-[220px] flex-shrink-0" : "aspect-video w-full",
        )}
      >
        {media ? (
          <Image src={media} alt={name} fill sizes="320px" className="rounded-2xl object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-slate-800/40 text-sm text-white/70">
            Preview coming soon
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
          {state.label}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-white">{name}</p>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs uppercase tracking-widest text-white/60">
              #{listing.id.toString()}
            </span>
          </div>
          <p className="text-sm text-white/60 line-clamp-2">
            {listing.asset?.metadata?.description ||
              "Collector-grade exposure backed by ASX RWA vaults."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
          <span>Creator {shortAddress(listing.creatorAddress)}</span>
          <span aria-hidden></span>
          <span>{integerFormatter.format(maxQuantity)} available</span>
          <span aria-hidden></span>
          <span>{state.detail}</span>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50">Asking price</p>
            <p className="text-2xl font-semibold text-white">{totalLabel}</p>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            {maxQuantity > 1 && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                <span className="text-xs uppercase tracking-widest">Qty</span>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(event) => handleQtyChange(Number(event.target.value))}
                  className="w-16 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-center text-white focus:border-cyan-300/60 focus:outline-none"
                />
              </div>
            )}
            {!isNativeCurrency &&
              !manualApprovalSatisfied &&
              (!hasSufficientAllowance || currencyCheckUnavailable) && (
                <TransactionButton
                  disabled={!account || !currencyContract || checkingCurrency}
                  transaction={() => {
                    if (!account) {
                      throw new Error("Connect your wallet to continue.");
                    }
                    if (!currencyContract) {
                      throw new Error("Missing ERC20 contract instance.");
                    }
                    return approve({
                      contract: currencyContract,
                      spender: contract.address as Address,
                      amountWei: totalCostWei,
                    });
                  }}
                  onTransactionConfirmed={() => {
                    notifySuccess("Currency approved", `${symbol} ready for checkout.`);
                    setManualApprovalWei((prev) =>
                      totalCostWei > prev ? totalCostWei : prev,
                    );
                    refreshCurrencyState();
                  }}
                  onError={(err) => {
                    const message = err instanceof Error ? err.message : String(err);
                    notifyError(message);
                  }}
                >
                  Approve {symbol}
                </TransactionButton>
              )}
            <TransactionButton
              disabled={!account || !canCollect}
              transaction={() => {
                if (!account) {
                  throw new Error("Connect your wallet to continue.");
                }
                if (!effectiveBalanceReady) {
                  if (showBalanceWarning) {
                    throw new Error(`You need at least ${totalLabel} in ${symbol}.`);
                  }
                  throw new Error("Unable to verify your balance. Please retry in a moment.");
                }
                if (!effectiveAllowanceReady) {
                  if (showAllowanceWarning) {
                    throw new Error(`Approve ${symbol} before collecting this listing.`);
                  }
                  throw new Error(
                    "Unable to verify your allowance. Approve the currency manually or refresh.",
                  );
                }
                return buyFromListing({
                  contract,
                  listingId: listing.id,
                  quantity: BigInt(quantity),
                  recipient: account.address as Address,
                });
              }}
              onTransactionConfirmed={() => {
                notifySuccess("Listing collected", `${name} transferred to your wallet.`);
                onRefetch?.();
              }}
              onError={(err) => {
                const message = err instanceof Error ? err.message : String(err);
                if (message.includes("!BAL20")) {
                  notifyError(
                    `Insufficient ${symbol}. Top up your balance before collecting this listing.`,
                  );
                  return;
                }
                notifyError(message);
              }}
            >
              {account ? (state.state === "live" ? "Collect now" : "Unavailable") : "Connect wallet"}
            </TransactionButton>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
          <Link
            href={`${MARKETPLACE_V3_EXPLORER}/token/${listing.assetContractAddress}?a=${listing.tokenId.toString()}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-white"
          >
            Token explorer
            <ExternalLink size={14} />
          </Link>
          <span aria-hidden></span>
          <span>Contract {shortAddress(listing.assetContractAddress)}</span>
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
            <span className="uppercase tracking-widest text-white/40">Currency</span>
            <span className="text-white/80">{symbol}</span>
            <span>{isNativeCurrency ? "Native gas" : shortAddress(currencyContractAddress ?? "")}</span>
          </div>
          {!isNativeCurrency && (
            <span
              className={clsx(
                "flex items-center gap-1 text-[11px]",
                currencyStatusTone,
              )}
            >
              {checkingCurrency
                ? "Checking ERC20 allowance..."
                : currencyCheckUnavailable
                  ? "Balance or allowance unavailable. You can still try collecting after approval."
                  : !account
                    ? "Connect wallet to check allowance"
                    : showBalanceWarning
                      ? `Add more ${symbol} to continue`
                      : showAllowanceWarning
                        ? `Approve ${symbol} to continue`
                        : walletBalanceLabel || `Requires ${symbol}`}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

type ListingSkeletonProps = {
  viewMode: ViewMode;
};

export function ListingSkeleton({ viewMode }: ListingSkeletonProps) {
  const blocks = Array.from({ length: viewMode === "mosaic" ? 6 : 3 });
  if (viewMode === "mosaic") {
    return (
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {blocks.map((_, index) => (
          <div
            key={index}
            className="animate-pulse space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div className="aspect-video rounded-2xl bg-white/10" />
            <div className="h-5 rounded bg-white/10" />
            <div className="h-4 rounded bg-white/5" />
            <div className="h-10 rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 sm:flex-row"
        >
          <div className="aspect-square w-full max-w-[220px] rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-4">
            <div className="h-5 rounded bg-white/10" />
            <div className="h-4 rounded bg-white/5" />
            <div className="h-10 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
