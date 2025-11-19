import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { isAddress, type Address } from "viem";
import { grantRole, hasRole, revokeRole } from "thirdweb/extensions/permissions";
import { setPlatformFeeInfo } from "thirdweb/extensions/common";
import { TransactionButton } from "thirdweb/react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/common/Button";
import { MARKETPLACE_CONTRACT } from "@/components/marketplace/constants";
import { SectionHeading } from "@/components/marketplace/components/primitives";
import type { CollectionInfo } from "@/components/marketplace/types";
import { fetchRoleMembersFromChain } from "@/components/marketplace/services/roles";
import { resolveMediaUrl, shortAddress } from "@/components/marketplace/utils";

type AdminPanelProps = {
  open: boolean;
  onClose: () => void;
  collections: CollectionInfo[];
  collectionsLoading: boolean;
  onRefreshCollections: () => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (message: string) => void;
};

export function AdminPanel({
  open,
  onClose,
  collections,
  collectionsLoading,
  onRefreshCollections,
  notifySuccess,
  notifyError,
}: AdminPanelProps) {
  const [newCollectionAddress, setNewCollectionAddress] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [platformFeeRecipient, setPlatformFeeRecipient] = useState("");
  const [platformFeeBps, setPlatformFeeBps] = useState("100");
  const [newListerAddress, setNewListerAddress] = useState("");
  const [selectedLister, setSelectedLister] = useState("");
  const [listers, setListers] = useState<string[]>([]);
  const [listersLoading, setListersLoading] = useState(true);
  const [listersError, setListersError] = useState<string | null>(null);

  const fetchListers = useCallback(async () => {
    if (!open) return;
    setListersLoading(true);
    setListersError(null);
    try {
      const members = await fetchRoleMembersFromChain("lister");
      setListers(members);
      setSelectedLister(members[0] ?? "");
    } catch (err) {
      setListers([]);
      setSelectedLister("");
      setListersError(
        err instanceof Error ? err.message : "Unable to load lister roles. Try again later.",
      );
    } finally {
      setListersLoading(false);
    }
  }, [open]);

  useEffect(() => {
    fetchListers();
  }, [fetchListers]);

  if (!open) return null;

  const resolvedSelectedCollection =
    selectedCollection || (collections.length > 0 ? collections[0].address : "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close admin panel backdrop"
      />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0a0a14] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Marketplace Admin Panel</h3>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="mt-2 text-sm text-white/60">
          Grant or revoke ASSET_ROLE, adjust platform fees, and refresh marketplace metadata without
          leaving the app.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Whitelist collection</p>
            <p className="text-xs text-white/60">Grant ASSET_ROLE so a collection can trade.</p>
            <input
              type="text"
              value={newCollectionAddress}
              onChange={(event) => setNewCollectionAddress(event.target.value)}
              placeholder="0x..."
              className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
            />
            <TransactionButton
              className="mt-3"
              transaction={() => {
                if (!newCollectionAddress || !isAddress(newCollectionAddress)) {
                  throw new Error("Enter a valid contract address.");
                }
                return grantRole({
                  contract: MARKETPLACE_CONTRACT,
                  role: "asset",
                  targetAccountAddress: newCollectionAddress as Address,
                });
              }}
              onTransactionConfirmed={() => {
                notifySuccess("Collection whitelisted", shortAddress(newCollectionAddress));
                setNewCollectionAddress("");
                onRefreshCollections();
              }}
              onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
            >
              Grant ASSET_ROLE
            </TransactionButton>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Remove collection</p>
            <p className="text-xs text-white/60">Revoke ASSET_ROLE to block listings/bids.</p>
            {collectionsLoading ? (
              <p className="mt-3 text-sm text-white/60">Loading collections…</p>
            ) : collections.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">No collections to remove.</p>
            ) : (
              <>
                <select
                  value={resolvedSelectedCollection}
                  onChange={(event) => setSelectedCollection(event.target.value)}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                >
                  {collections.map((collection) => (
                    <option key={collection.address} value={collection.address}>
                      {collection.name ?? shortAddress(collection.address)}
                    </option>
                  ))}
                </select>
                <TransactionButton
                  className="mt-3"
                  disabled={!resolvedSelectedCollection}
                  transaction={async () => {
                    if (!resolvedSelectedCollection) {
                      throw new Error("Select a collection to revoke.");
                    }
                    const hasAssetRole = await hasRole({
                      contract: MARKETPLACE_CONTRACT,
                      role: "asset",
                      targetAccountAddress: resolvedSelectedCollection as Address,
                    });
                    if (!hasAssetRole) {
                      throw new Error("This collection no longer holds ASSET_ROLE.");
                    }
                    return revokeRole({
                      contract: MARKETPLACE_CONTRACT,
                      role: "asset",
                      targetAccountAddress: resolvedSelectedCollection as Address,
                    });
                  }}
                  onTransactionConfirmed={() => {
                    notifySuccess("Collection revoked", shortAddress(resolvedSelectedCollection));
                    onRefreshCollections();
                  }}
                  onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
                >
                  Revoke ASSET_ROLE
                </TransactionButton>
              </>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Allow lister</p>
            <p className="text-xs text-white/60">Grant LISTER_ROLE so a wallet can create listings.</p>
            <input
              type="text"
              value={newListerAddress}
              onChange={(event) => setNewListerAddress(event.target.value)}
              placeholder="Wallet address"
              className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
            />
            <TransactionButton
              className="mt-3"
              transaction={async () => {
                if (!newListerAddress || !isAddress(newListerAddress)) {
                  throw new Error("Enter a valid wallet address.");
                }
                const alreadyLister = await hasRole({
                  contract: MARKETPLACE_CONTRACT,
                  role: "lister",
                  targetAccountAddress: newListerAddress as Address,
                });
                if (alreadyLister) {
                  throw new Error("Wallet already holds LISTER_ROLE.");
                }
                return grantRole({
                  contract: MARKETPLACE_CONTRACT,
                  role: "lister",
                  targetAccountAddress: newListerAddress as Address,
                });
              }}
              onTransactionConfirmed={() => {
                notifySuccess("Lister role granted", shortAddress(newListerAddress));
                setNewListerAddress("");
                fetchListers();
              }}
              onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
            >
              Grant LISTER_ROLE
            </TransactionButton>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Remove lister</p>
                <p className="text-xs text-white/60">
                  Revoke LISTER_ROLE to block that wallet from creating listings.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={fetchListers}>
                Refresh
              </Button>
            </div>
            {listersLoading ? (
              <p className="mt-3 text-sm text-white/60">Loading listers…</p>
            ) : listers.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">
                No wallets currently hold LISTER_ROLE.
              </p>
            ) : (
              <>
                <select
                  value={selectedLister}
                  onChange={(event) => setSelectedLister(event.target.value)}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                >
                  {listers.map((address) => (
                    <option key={address} value={address}>
                      {shortAddress(address)}
                    </option>
                  ))}
                </select>
                <TransactionButton
                  className="mt-3"
                  disabled={!selectedLister}
                  transaction={async () => {
                    if (!selectedLister) {
                      throw new Error("Select a wallet to revoke.");
                    }
                    const hasListerRole = await hasRole({
                      contract: MARKETPLACE_CONTRACT,
                      role: "lister",
                      targetAccountAddress: selectedLister as Address,
                    });
                    if (!hasListerRole) {
                      throw new Error("Wallet no longer holds LISTER_ROLE.");
                    }
                    return revokeRole({
                      contract: MARKETPLACE_CONTRACT,
                      role: "lister",
                      targetAccountAddress: selectedLister as Address,
                    });
                  }}
                  onTransactionConfirmed={() => {
                    notifySuccess("Lister role revoked", shortAddress(selectedLister));
                    fetchListers();
                  }}
                  onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
                >
                  Revoke LISTER_ROLE
                </TransactionButton>
              </>
            )}
            {listersError && <p className="mt-3 text-xs text-red-300">{listersError}</p>}
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Platform fee</p>
          <p className="text-xs text-white/60">Configure fee recipient and basis points.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={platformFeeRecipient}
              onChange={(event) => setPlatformFeeRecipient(event.target.value)}
              placeholder="Recipient address"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
            />
            <input
              type="number"
              min="0"
              max="10000"
              value={platformFeeBps}
              onChange={(event) => setPlatformFeeBps(event.target.value)}
              placeholder="Fee (bps)"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
            />
          </div>
          <TransactionButton
            className="mt-3"
            transaction={() => {
              if (!platformFeeRecipient || !isAddress(platformFeeRecipient)) {
                throw new Error("Enter a valid recipient address.");
              }
              const fee = Number(platformFeeBps || "0");
              if (Number.isNaN(fee) || fee < 0 || fee > 10000) {
                throw new Error("Enter a fee between 0 and 10000 bps.");
              }
              return setPlatformFeeInfo({
                contract: MARKETPLACE_CONTRACT,
                platformFeeRecipient: platformFeeRecipient as Address,
                platformFeeBps: BigInt(fee),
              });
            }}
            onTransactionConfirmed={() => {
              notifySuccess("Platform fee updated");
            }}
            onError={(err) => notifyError(err instanceof Error ? err.message : String(err))}
          >
            Update platform fee
          </TransactionButton>
        </div>
        <div className="mt-4 text-right text-xs text-white/50">
          Need to see new collections?{" "}
          <button
            type="button"
            onClick={onRefreshCollections}
            className="text-cyan-300 underline-offset-2 hover:underline"
          >
            Refresh whitelist
          </button>
        </div>
      </div>
    </div>
  );
}

type WhitelistedCollectionsProps = {
  collections: CollectionInfo[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function WhitelistedCollections({
  collections,
  loading,
  error,
  onRefresh,
}: WhitelistedCollectionsProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeading
          title="Whitelisted collections"
          description="Only ASSET_ROLE collections can interact with the marketplace."
          icon={<ShieldCheck size={18} />}
        />
        <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
          Refresh list
        </Button>
      </div>
      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`collection-skeleton-${index}`}
              className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="mb-4 h-10 rounded-xl bg-white/10" />
              <div className="h-3 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70">
          No collections are whitelisted yet. Grant the ASSET_ROLE via the contracts grantRole
          function.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.address}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                {collection.image ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10">
                    <Image
                      src={resolveMediaUrl(collection.image) ?? collection.image}
                      alt={collection.name ?? collection.address}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-xs text-white/60">
                    NFT
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-white">
                    {collection.name ?? shortAddress(collection.address)}
                  </p>
                  <p className="text-xs text-white/50">
                    {collection.symbol || "ERC721/1155"} • {shortAddress(collection.address)}
                  </p>
                </div>
              </div>
              {collection.description && (
                <p className="mt-3 text-sm text-white/60 line-clamp-3">
                  {collection.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
