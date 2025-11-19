import { useState } from "react";
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
import {
  formatRelative,
  isOfferLive,
  integerFormatter,
  numberFormatter,
  safeNumber,
  shortAddress,
} from "@/components/marketplace/utils";
import { useCurrencyAllowance } from "@/components/marketplace/hooks/useCurrencyAllowance";

type OffersSectionProps = {
  offers: Offer[];
  contract: MarketplaceContract;
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

export function OffersSection({
  offers,
  contract,
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
  onRefetch: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

function OfferComposer({
  contract,
  onRefetch,
  notifySuccess,
  notifyError,
}: OfferComposerProps) {
  const account = useActiveAccount();
  const [assetContract, setAssetContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [amount, setAmount] = useState("");
  const [expiryHours, setExpiryHours] = useState("48");
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
    if (!assetContract || !tokenId || !amount) {
      throw new Error("Fill in asset, token ID, and amount.");
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
    const expiration = BigInt(
      Math.floor(Date.now() / 1000 + Number(expiryHours || "24") * 3600),
    );
    return makeOffer({
      contract,
      params: {
        assetContract: assetContract as Address,
        tokenId: BigInt(tokenId),
        quantity: quantityBigInt,
        currency: MARKETPLACE_LISTING_CURRENCY as Address,
        totalPrice: totalPriceWei,
        expirationTimestamp: expiration,
      },
    });
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-semibold text-white">Post a new offer</p>
      <div className="grid gap-3 lg:grid-cols-5">
        <input
          type="text"
          placeholder="Asset contract"
          value={assetContract}
          onChange={(event) => setAssetContract(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
        />
        <input
          type="number"
          placeholder="Token ID"
          value={tokenId}
          onChange={(event) => setTokenId(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
        />
        <input
          type="number"
          min="1"
          placeholder="Quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
        />
        <input
          type="text"
          value={MARKETPLACE_LISTING_CURRENCY}
          disabled
          title="Marketplace trade token"
          className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white/70"
        />
        <input
          type="number"
          placeholder="Amount (18 decimals)"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-widest text-white/50">Expiry (hrs)</label>
          <input
            type="number"
            min="1"
            value={expiryHours}
            onChange={(event) => setExpiryHours(event.target.value)}
            className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
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
              Approve currency
            </TransactionButton>
          )}
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
              !account || totalPriceWei <= 0n || !hasSufficientBalance || needsApproval
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
      </div>
      <p className={`text-xs ${currencyStatusTone}`}>{currencyStatusMessage}</p>
      <p className="text-xs text-white/50">
        Offers settle in {shortAddress(MARKETPLACE_LISTING_CURRENCY)}. Approve the allowance once and
        reuse it for future offers.
      </p>
    </div>
  );
}
