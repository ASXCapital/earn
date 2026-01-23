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
  const nftAddress = listing.asset?.tokenAddress || listing.assetContractAddress;

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

  const actionButtonBase =
    "relative inline-flex min-w-[120px] items-center justify-center rounded-lg px-3 py-1 text-[11px] font-semibold tracking-tight transition backdrop-blur-sm focus:outline-none focus:ring-0 disabled:opacity-45 disabled:cursor-not-allowed";
  const approveTheme =
    "border border-emerald-300/40 bg-gradient-to-r from-emerald-500/30 via-teal-400/20 to-cyan-400/25 text-emerald-50 shadow-[0_12px_35px_-18px_rgba(16,185,129,0.8)] hover:border-emerald-200/70 hover:from-emerald-400/35 hover:to-cyan-300/35";
  const buyTheme =
    "border border-emerald-300/35 bg-gradient-to-r from-emerald-500/25 via-cyan-500/18 to-sky-500/25 text-emerald-50 shadow-[0_12px_35px_-18px_rgba(14,165,233,0.7)] hover:border-emerald-200/60 hover:from-emerald-400/35 hover:to-sky-400/35";
  const connectTheme =
    "border border-cyan-300/45 bg-gradient-to-r from-cyan-500/28 via-blue-500/24 to-indigo-500/28 text-white shadow-[0_12px_35px_-18px_rgba(59,130,246,0.75)] hover:border-cyan-200/65 hover:from-cyan-400/35 hover:to-indigo-400/35";
  const cancelTheme =
    "border border-white/15 bg-white/8 text-white shadow-[0_10px_30px_-20px_rgba(255,255,255,0.65)] hover:border-white/30";

  return (
    <article
      className={clsx(
        "group relative grid w-full grid-cols-1 items-center gap-1 overflow-hidden border-b border-white/10 bg-white/[0.01] px-3 py-2 text-[11px] text-white transition hover:bg-white/[0.03] first:border-t first:rounded-t-md last:rounded-b-md",
        "md:grid-cols-[minmax(0,1.1fr),150px,165px,140px]",
      )}
    >
      <div className="absolute inset-0 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100">
        <div className="h-full w-full bg-gradient-to-r from-cyan-500/10 via-emerald-400/5 to-blue-500/5" />
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => onOpenDetail?.(listing)}
          className="rounded-xl bg-gradient-to-br from-white/12 via-white/5 to-white/0 p-[1.5px] shadow-inner shadow-black/60 transition hover:from-white/20 hover:via-white/8 hover:to-white/5 focus:outline-none"
        >
          <div className="relative h-11 w-11 overflow-hidden rounded-[9px] bg-black/60">
            {media ? (
              <Image
                src={media}
                alt={name}
                fill
                sizes="44px"
                className="object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-white/60">
                No preview
              </div>
            )}
          </div>
        </button>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenDetail?.(listing)}
              className="line-clamp-1 text-left text-[13px] font-semibold tracking-tight text-white hover:text-white/90 focus:outline-none"
            >
              {name}
            </button>
            {state.state !== "live" && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-[0.12em]",
                  state.state === "scheduled"
                    ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-white/70",
                )}
              >
                {state.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <span className="rounded-sm border border-white/10 bg-white/5 px-1.5 py-[1px] text-[10px] font-medium text-white/80 font-mono">
              {shortAddress(nftAddress)}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleCopy("NFT address", nftAddress);
              }}
              className="rounded border border-white/10 p-1 text-white/50 transition hover:border-white/30 hover:text-white"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1 self-center text-center md:text-left">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-semibold text-white">
            {numberFormatter.format(pricePerToken)} {symbol}
          </span>
          {maxQuantity > 1 && (
            <span className="text-[11px] text-white/60">
              Stock {integerFormatter.format(maxQuantity)}
            </span>
          )}
        </div>
        {state.state !== "live" && state.detail && (
          <p className="text-[11px] text-white/50">{state.detail}</p>
        )}
      </div>

      <div className="space-y-1 text-[11px] text-white/80">
        <div className="flex items-center gap-1.5">
          <span className="rounded-sm border border-white/10 bg-white/5 px-1.5 py-[1px] text-[10px] font-medium text-white/80 font-mono">
            {shortAddress(listing.creatorAddress)}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleCopy("Wallet address", listing.creatorAddress);
            }}
            className="rounded border border-white/10 p-1 text-white/50 transition hover:border-white/30 hover:text-white"
          >
            <Copy size={12} />
          </button>
        </div>
        <div className="text-[11px] text-white/60">
          {holdingsLoading
            ? "Checking holdings..."
            : sellerHoldings !== null
              ? `Holds ${integerFormatter.format(sellerHoldings)}`
              : "Holdings unavailable"}
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-1.5 self-center text-center"
        onClick={(event) => event.stopPropagation()}
      >
        {!!account &&
          !isCreator &&
          !isNativeCurrency &&
          !manualApprovalSatisfied &&
          (!hasSufficientAllowance || currencyCheckUnavailable) && (
            <TransactionButton
              unstyled
              disabled={!account || !currencyContract || checkingCurrency}
              className={clsx(actionButtonBase, approveTheme)}
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
            unstyled
            disabled={!account}
            className={clsx(actionButtonBase, cancelTheme)}
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
            unstyled
            disabled={!account || !canCollect}
            className={clsx(
              account
                ? clsx(actionButtonBase, buyTheme)
                : clsx(actionButtonBase, connectTheme),
            )}
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
          <div key={index} className="grid animate-pulse grid-cols-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:grid-cols-[minmax(0,1.1fr),150px,165px,140px]">
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
        <div key={index} className="grid animate-pulse grid-cols-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:grid-cols-[minmax(0,1.1fr),150px,165px,140px]">
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
