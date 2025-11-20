import Image from "next/image";
import { useState } from "react";
import { parseUnits, type Address } from "viem";
import { approve } from "thirdweb/extensions/erc20";
import { bidInAuction, buyoutAuction, type EnglishAuction } from "thirdweb/extensions/marketplace";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { Gavel } from "lucide-react";

import type { MarketplaceContract } from "@/components/marketplace/constants";
import {
  AnalyticsChip,
  SectionHeading,
} from "@/components/marketplace/components/primitives";
import {
  formatRelative,
  isAuctionLive,
  numberFormatter,
  resolveMediaUrl,
  safeNumber,
  shortAddress,
} from "@/components/marketplace/utils";
import { useCurrencyAllowance } from "@/components/marketplace/hooks/useCurrencyAllowance";

type AuctionsSectionProps = {
  auctions: EnglishAuction[];
  currencySymbol: string;
  contract: MarketplaceContract;
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
  comingSoon?: boolean;
};

export function AuctionsSection({
  auctions,
  currencySymbol,
  contract,
  onRefetch,
  notifySuccess,
  notifyError,
  comingSoon = false,
}: AuctionsSectionProps) {
  const isLocked = comingSoon;
  const liveAuctions = auctions.filter((auction) =>
    isAuctionLive(auction, Date.now() / 1000),
  );
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Live English auctions"
        description="Bid on curated ASX NFTs and RWA vault shares. All bids settle once the auction closes or the buyout is hit."
        icon={<Gavel size={18} />}
      />
      {liveAuctions.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70">
          {comingSoon
            ? "English auctions are being staged for launch. Listings will surface here once the module opens."
            : "Auctions synchronize automatically whenever creators list collateral. Check back shortly or switch to test listings on staging."}
        </p>
      ) : (
        <>
          {comingSoon && (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
              English auctions are coming soon. Browse inventory below; bidding and buyouts are
              temporarily disabled.
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            {liveAuctions.map((auction) => (
              <AuctionCard
                key={auction.id.toString()}
                auction={auction}
                contract={contract}
                currencySymbol={currencySymbol}
                onRefetch={onRefetch}
                notifySuccess={notifySuccess}
                notifyError={notifyError}
                disabled={isLocked}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

type AuctionCardProps = {
  auction: EnglishAuction;
  contract: MarketplaceContract;
  currencySymbol: string;
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
  disabled?: boolean;
};

function AuctionCard({
  auction,
  contract,
  currencySymbol,
  onRefetch,
  notifySuccess,
  notifyError,
  disabled = false,
}: AuctionCardProps) {
  const account = useActiveAccount();
  const [bidAmount, setBidAmount] = useState(
    safeNumber(auction.minimumBidCurrencyValue.displayValue).toString(),
  );
  const locked = disabled;

  const media = resolveMediaUrl(auction.asset?.metadata?.image as string | undefined);
  const name =
    auction.asset?.metadata?.name ||
    `Auction #${auction.id.toString()}  ${shortAddress(auction.assetContractAddress)}`;
  const endsIn = formatRelative(Number(auction.endTimeInSeconds) - Date.now() / 1000);
  const decimals = auction.minimumBidCurrencyValue.decimals || 18;
  const currencyAddress = auction.currencyContractAddress as Address | undefined;
  const bidAmountWei = (() => {
    try {
      return bidAmount ? parseUnits(bidAmount, decimals) : 0n;
    } catch {
      return 0n;
    }
  })();
  const buyoutWei = auction.buyoutBidAmount ?? 0n;
  const allowanceState = useCurrencyAllowance({
    currencyAddress,
    accountAddress: account?.address as Address | undefined,
    spenderAddress: contract.address as Address,
    decimals,
    requiredAmountWei: bidAmountWei,
  });
  const checkingCurrency = allowanceState.loading;
  const currencyError = allowanceState.error;
  const needsBidApproval = !locked && bidAmountWei > 0n && allowanceState.needsApproval;
  const needsBuyoutApproval =
    !locked && !allowanceState.isNativeCurrency && buyoutWei > allowanceState.allowanceWei;
  const hasBuyoutBalance =
    allowanceState.isNativeCurrency || allowanceState.balanceWei >= buyoutWei;
  const buyoutAvailable = safeNumber(auction.buyoutCurrencyValue.displayValue) > 0;
  const canBid =
    !locked &&
    !!account &&
    bidAmountWei > 0n &&
    allowanceState.hasSufficientBalance &&
    !needsBidApproval;
  const canBuyout =
    !locked &&
    !!account &&
    buyoutAvailable &&
    buyoutWei > 0n &&
    hasBuyoutBalance &&
    !needsBuyoutApproval;
  const approvalSymbol = auction.minimumBidCurrencyValue.symbol || currencySymbol;
  const walletBalanceLabel = (() => {
    if (!allowanceState.balanceFormatted) return null;
    const parsed = Number(allowanceState.balanceFormatted);
    if (!Number.isFinite(parsed)) return null;
    return `${numberFormatter.format(parsed)} ${approvalSymbol} in wallet`;
  })();
  const currencyStatusTone =
    !account || allowanceState.isNativeCurrency
      ? "text-white/60"
      : !allowanceState.hasSufficientBalance || needsBidApproval
        ? "text-amber-200/90"
        : "text-white/60";
  const currencyStatusMessage = (() => {
    if (locked) return "English auctions are coming soon.";
    if (allowanceState.isNativeCurrency) return null;
    if (!account) return "Connect wallet to check allowance.";
    if (checkingCurrency) return "Checking ERC20 allowance...";
    if (currencyError) return "Allowance check unavailable";
    if (!allowanceState.hasSufficientBalance) return `Need more ${approvalSymbol}`;
    if (needsBidApproval) return `Approve ${approvalSymbol} before bidding`;
    return walletBalanceLabel ?? `Requires ${approvalSymbol}`;
  })();
  const refreshAllowance = allowanceState.refresh;
  const currencyContract = allowanceState.currencyContract;
  const showBidApprovalButton =
    !locked &&
    !allowanceState.isNativeCurrency &&
    needsBidApproval &&
    bidAmountWei > 0n;
  const showBuyoutApprovalButton =
    !locked && buyoutAvailable && needsBuyoutApproval && buyoutWei > 0n;

  const handleBid = () => {
    if (locked) {
      throw new Error("English auctions are launching soon. Bidding is disabled.");
    }
    if (bidAmountWei <= 0n) {
      throw new Error("Enter a valid bid amount.");
    }
    return bidInAuction({
      contract,
      auctionId: auction.id,
      bidAmountWei,
    });
  };

  return (
    <article
      className={`flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm ${locked ? "opacity-75" : ""}`}
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="relative aspect-square w-full max-w-[220px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0">
          {media ? (
            <Image src={media} alt={name} fill sizes="220px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
              Preview coming soon
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
            Ends in {endsIn}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-semibold text-white">{name}</p>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs uppercase tracking-widest text-white/60">
              #{auction.id.toString()}
            </span>
          </div>
          <p className="text-sm text-white/60 line-clamp-3">
            {auction.asset?.metadata?.description ||
              "Time-buffered settlement with bid escalators for fair price discovery."}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <AnalyticsChip
              label="Minimum bid"
              value={`${numberFormatter.format(
                safeNumber(auction.minimumBidCurrencyValue.displayValue),
              )} ${auction.minimumBidCurrencyValue.symbol || currencySymbol}`}
            />
            <AnalyticsChip
              label="Buyout"
              value={
                safeNumber(auction.buyoutCurrencyValue.displayValue) > 0
                  ? `${numberFormatter.format(
                      safeNumber(auction.buyoutCurrencyValue.displayValue),
                    )} ${auction.buyoutCurrencyValue.symbol || currencySymbol}`
                  : "Disabled"
              }
            />
            <AnalyticsChip
              label="Time buffer"
              value={`${Number(auction.timeBufferInSeconds)}s`}
            />
          </div>
        </div>
      </div>
      {locked && (
        <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-3 py-2 text-xs text-white/70">
          English auctions are in preview mode. Bidding and buyouts are disabled until launch.
        </div>
      )}
      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${locked ? "pointer-events-none" : ""}`}
      >
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <p className="text-xs uppercase tracking-widest text-white/40">Your bid</p>
              <div className="flex items-center gap-2">
                <input
                type="number"
                min="0"
                step="0.0001"
                value={bidAmount}
                onChange={(event) => setBidAmount(event.target.value)}
                disabled={locked}
                className="w-28 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white focus:border-cyan-300/60 focus:outline-none"
              />
                <span className="text-xs uppercase tracking-widest text-white/50">
                  {approvalSymbol}
                </span>
              </div>
            </div>
            {showBidApprovalButton && currencyContract && (
              <TransactionButton
                disabled={!account || bidAmountWei <= 0n}
                transaction={() => {
                  if (!account) {
                    throw new Error("Connect your wallet to approve currency.");
                  }
                  if (!currencyContract) {
                    throw new Error("Missing ERC20 contract instance.");
                  }
                  if (bidAmountWei <= 0n) {
                    throw new Error("Enter a bid amount before approving.");
                  }
                  return approve({
                    contract: currencyContract,
                    spender: contract.address as Address,
                    amountWei: bidAmountWei,
                  });
                }}
                onTransactionConfirmed={() => {
                  notifySuccess("Currency approved", `${approvalSymbol} ready for bidding.`);
                  refreshAllowance();
                }}
                onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
              >
                Approve {approvalSymbol}
              </TransactionButton>
            )}
          </div>
          {!allowanceState.isNativeCurrency && currencyStatusMessage && (
            <p className={`text-xs ${currencyStatusTone}`}>{currencyStatusMessage}</p>
          )}
        </div>
        <TransactionButton
          transaction={() => {
            if (!account) {
              throw new Error("Connect your wallet to place a bid.");
            }
            if (bidAmountWei <= 0n) {
              throw new Error("Enter a valid bid amount.");
            }
            if (!allowanceState.hasSufficientBalance) {
              throw new Error(`Need more ${approvalSymbol} to submit this bid.`);
            }
            if (needsBidApproval) {
              throw new Error(`Approve ${approvalSymbol} before bidding.`);
            }
            return handleBid();
          }}
          disabled={!canBid}
          onTransactionConfirmed={() => {
            notifySuccess("Bid placed", `You're now in the race for ${name}.`);
            refreshAllowance();
            onRefetch();
          }}
          onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
        >
          Place bid
        </TransactionButton>
      </div>
      {buyoutAvailable && !locked && (
        <div className="flex flex-col gap-2 sm:w-fit">
          {showBuyoutApprovalButton && currencyContract && (
            <TransactionButton
              disabled={!account || buyoutWei <= 0n}
              transaction={() => {
                if (!account) {
                  throw new Error("Connect your wallet to approve currency.");
                }
                if (!currencyContract) {
                  throw new Error("Missing ERC20 contract instance.");
                }
                if (buyoutWei <= 0n) {
                  throw new Error("Buyout amount unavailable.");
                }
                return approve({
                  contract: currencyContract,
                  spender: contract.address as Address,
                  amountWei: buyoutWei,
                });
              }}
              onTransactionConfirmed={() => {
                notifySuccess("Currency approved", `${approvalSymbol} ready for buyout.`);
                refreshAllowance();
              }}
              onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
            >
              Approve buyout
            </TransactionButton>
          )}
          <TransactionButton
            transaction={() => {
              if (!account) {
                throw new Error("Connect your wallet to buy out this auction.");
              }
              if (!hasBuyoutBalance) {
                throw new Error(`Need more ${approvalSymbol} to buy out this auction.`);
              }
              if (needsBuyoutApproval) {
                throw new Error(`Approve ${approvalSymbol} for the buyout amount first.`);
              }
              return buyoutAuction({
                contract,
                auctionId: auction.id,
              });
            }}
            disabled={!canBuyout}
            onTransactionConfirmed={() => {
              notifySuccess("Auction bought out", `${name} has been settled instantly.`);
              refreshAllowance();
              onRefetch();
            }}
            onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
          >
            Buyout instantly
          </TransactionButton>
        </div>
      )}
    </article>
  );
}
