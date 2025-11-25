import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { approve } from "thirdweb/extensions/erc20";
import { buyFromListing, cancelListing, type DirectListing } from "thirdweb/extensions/marketplace";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { Copy, ExternalLink } from "lucide-react";

import { MARKETPLACE_V3_EXPLORER } from "@/marketplace/config";
import type { MarketplaceContract } from "@/components/marketplace/constants";
import { useCurrencyAllowance } from "@/components/marketplace/hooks/useCurrencyAllowance";
import { useSellerCollectionHoldings } from "@/components/marketplace/hooks/useSellerCollectionHoldings";
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
  onOpenDetail?: (listing: DirectListing) => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

export function ListingCard({
  listing,
  variant: _variant,
  contract,
  onRefetch,
  onOpenDetail,
  notifySuccess,
  notifyError,
}: ListingCardProps) {
  const account = useActiveAccount();
  const quantity = 1;
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
  const isCreator =
    !!account &&
    account.address?.toLowerCase() === listing.creatorAddress.toLowerCase();
  const {
    balance: sellerHoldings,
    loading: holdingsLoading,
    error: holdingsError,
  } = useSellerCollectionHoldings(
    listing.assetContractAddress,
    listing.creatorAddress as Address,
  );

  const {
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

  const handleCopy = async (label: string, value?: string | null) => {
    if (!value) {
      notifyError(`No ${label} to copy.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      notifySuccess(`${label} copied`);
    } catch {
      notifyError(`Unable to copy ${label}.`);
    }
  };

  return (
    <article
      className={clsx(
        "group relative grid w-full grid-cols-2 items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/[0.02] to-white/[0.05] px-3 py-2 text-sm text-white shadow-[0_8px_30px_-18px_rgba(0,0,0,0.75)] transition hover:-translate-y-[1px] hover:border-cyan-200/60 hover:shadow-[0_14px_42px_-16px_rgba(0,0,0,0.9)]",
        "md:grid-cols-[auto,200px,220px,140px]",
      )}
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail?.(listing)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetail?.(listing);
        }
      }}
    >
      <div className="absolute inset-0 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100">
        <div className="h-full w-full bg-gradient-to-r from-cyan-500/10 via-emerald-400/5 to-blue-500/5" />
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-white/15 via-white/5 to-white/0 p-[1.5px] shadow-inner shadow-black/60">
          <div className="relative h-12 w-12 overflow-hidden rounded-[10px] bg-black/60">
            {media ? (
              <Image
                src={media}
                alt={name}
                fill
                sizes="48px"
                className="object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-white/60">
                No preview
              </div>
            )}
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="line-clamp-1 text-xs font-semibold tracking-tight text-white/90">{name}</p>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-white/50">
            <span className="truncate">{shortAddress(listing.assetContractAddress)}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleCopy("Asset address", listing.assetContractAddress);
              }}
              className="rounded border border-white/10 p-1 text-white/50 transition hover:text-white"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-white">
            {numberFormatter.format(pricePerToken)} {symbol}
          </span>
        </div>
        {maxQuantity > 1 && (
          <div className="text-[10px] text-white/60">
            {integerFormatter.format(maxQuantity)} available
          </div>
        )}
      </div>

      <div className="text-xs text-white/70">
        <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.03] px-2.5 py-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">{shortAddress(listing.creatorAddress)}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleCopy("Wallet address", listing.creatorAddress);
              }}
              className="rounded border border-white/10 p-1 text-white/50 transition hover:text-white"
            >
              <Copy size={12} />
            </button>
          </div>
          <div className="text-[11px] text-white/60">
            {holdingsLoading
              ? "Checking holdings..."
              : sellerHoldings !== null
                ? `holds ${integerFormatter.format(sellerHoldings)}`
                : "Holdings unavailable"}
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-end gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        {!isCreator &&
          !isNativeCurrency &&
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
              Approve
            </TransactionButton>
          )}
        {isCreator ? (
          <TransactionButton
            disabled={!account}
            transaction={() => {
              if (!account) {
                throw new Error("Connect your wallet to manage this listing.");
              }
              return cancelListing({
                contract,
                listingId: listing.id,
              });
            }}
            onTransactionConfirmed={() => {
              notifySuccess(
                "Listing cancelled",
                `Listing #${listing.id.toString()} has been cancelled.`,
              );
              onRefetch?.();
            }}
            onError={(err) => {
              const message = err instanceof Error ? err.message : String(err);
              notifyError(message);
            }}
          >
            Cancel
          </TransactionButton>
        ) : (
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
            {account ? "Buy" : "Connect"}
          </TransactionButton>
        )}
      </div>
    </article>
  );
}

type ListingSkeletonProps = {
  viewMode: ViewMode;
};

type InfoRowProps = {
  label: string;
  children: React.ReactNode;
};

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-widest text-white/50">{label}</p>
      <div className="text-sm text-white/80">{children}</div>
    </div>
  );
}

export function ListingSkeleton({ viewMode }: ListingSkeletonProps) {
  const blocks = Array.from({ length: viewMode === "mosaic" ? 6 : 3 });
  if (viewMode === "mosaic") {
    return (
      <div className="space-y-2">
        {blocks.map((_, index) => (
          <div key={index} className="grid animate-pulse grid-cols-2 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:grid-cols-[auto,200px,220px,140px]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-md bg-white/10" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="h-3 w-16 rounded bg-white/10" />
              </div>
            </div>
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-3 w-10 rounded bg-white/10" />
            <div className="h-7 w-20 rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blocks.map((_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-2 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:grid-cols-[auto,200px,220px,140px]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-md bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="h-3 w-16 rounded bg-white/10" />
            </div>
          </div>
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-3 w-10 rounded bg-white/10" />
          <div className="h-7 w-20 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
