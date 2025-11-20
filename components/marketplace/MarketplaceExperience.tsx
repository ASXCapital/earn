"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { Address } from "viem";
import {
  Boxes,
  Clock3,
  Copy,
  ExternalLink,
  LayoutGrid,
  Megaphone,
  RefreshCcw,
  Rows,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";

import { Button } from "@/components/common/Button";
import {
  BackgroundGlow,
  EmptyState,
  HighlightChip,
  ProgressRow,
  SectionHeading,
  StatPill,
} from "@/components/marketplace/components/primitives";
import { ListingCard, ListingSkeleton } from "@/components/marketplace/components/ListingCard";
import { ListingComposer } from "@/components/marketplace/components/ListingComposer";
import { AdminPanel } from "@/components/marketplace/sections/AdminPanel";
import { ActivitySection } from "@/components/marketplace/sections/ActivitySection";
import { AuctionsSection } from "@/components/marketplace/sections/AuctionsSection";
import { OffersSection } from "@/components/marketplace/sections/OffersSection";
import { MARKETPLACE_CONTRACT } from "@/components/marketplace/constants";
import { useMarketplaceAdmin } from "@/components/marketplace/hooks/useMarketplaceAdmin";
import { useMarketplaceCatalog } from "@/components/marketplace/hooks/useMarketplaceCatalog";
import { useMarketplaceCollections } from "@/components/marketplace/hooks/useMarketplaceCollections";
import { useMarketplaceSync } from "@/components/marketplace/hooks/useMarketplaceSync";
import type { SortKey, ViewMode } from "@/components/marketplace/types";
import {
  computeStats,
  integerFormatter,
  isListingLive,
  numberFormatter,
  resolveMediaUrl,
  shortAddress,
  sortListings,
} from "@/components/marketplace/utils";
import { useToast } from "@/components/toast/ToastProvider";
import {
  MARKETPLACE_V3_ADDRESS,
  MARKETPLACE_V3_CHAIN_NAME,
  MARKETPLACE_V3_EXPLORER,
} from "@/marketplace/config";

export function MarketplaceExperience() {
  const { pushToast } = useToast();
  const account = useActiveAccount();
  const accountAddress = account?.address as Address | undefined;
  type MarketplaceTab = "listings" | "offers" | "activity";

  const [search, setSearch] = useState("");
  const [onlyLive, setOnlyLive] = useState(true);
  const [onlyMine, setOnlyMine] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("featured");
  const [viewMode, setViewMode] = useState<ViewMode>("mosaic");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<MarketplaceTab>("listings");

  const handleSyncError = useCallback(
    (_message?: string) => {
      pushToast({
        variant: "error",
        title: "Sync failed",
        description: "Please retry shortly. The RPC may be rate limiting.",
      });
    },
    [pushToast],
  );

  const {
    listings,
    auctions,
    offers,
    activity,
    loading,
    refreshing,
    error,
    lastUpdated,
    syncMarketplace,
  } = useMarketplaceSync(handleSyncError);

  const {
    collections,
    collectionsLoading,
    collectionsError,
    refreshCollections,
  } = useMarketplaceCollections();
  const { catalogAssets, collectionSummaries } = useMarketplaceCatalog({
    listings,
    auctions,
    offers,
    collections,
  });

  const collectionRail = useMemo(
    () =>
      collectionSummaries.length > 0
        ? collectionSummaries
        : collections.map((collection) => ({
            address: collection.address,
            name: collection.name,
            symbol: collection.symbol,
            image: collection.image ?? null,
            live: 0,
            total: 0,
          })),
    [collectionSummaries, collections],
  );

  const selectedCollectionSet = useMemo(
    () => new Set(selectedCollections.map((address) => address.toLowerCase())),
    [selectedCollections],
  );

  const toggleCollection = useCallback((address: string) => {
    const normalized = address.toLowerCase();
    setSelectedCollections((prev) => {
      if (prev.some((value) => value.toLowerCase() === normalized)) {
        return prev.filter((value) => value.toLowerCase() !== normalized);
      }
      return [...prev, normalized];
    });
  }, []);

  const { isAdmin, isCheckingAdmin, adminCheckError, verifyAdmin } =
    useMarketplaceAdmin(accountAddress);

  const stats = useMemo(
    () => computeStats(listings, auctions, offers),
    [listings, auctions, offers],
  );

  const filteredListings = useMemo(() => {
    const now = Date.now() / 1000;
    const query = search.trim().toLowerCase();
    return [...listings]
      .filter((listing) => {
        if (
          selectedCollectionSet.size > 0 &&
          !selectedCollectionSet.has(listing.assetContractAddress.toLowerCase())
        ) {
          return false;
        }
        if (onlyLive && !isListingLive(listing, now)) return false;
        if (onlyMine) {
          if (!accountAddress) return false;
          if (listing.creatorAddress.toLowerCase() !== accountAddress.toLowerCase()) {
            return false;
          }
        }
        if (!query) return true;
        const haystack = `${listing.asset?.metadata?.name ?? ""} ${listing.asset?.metadata?.description ?? ""} ${listing.assetContractAddress} ${listing.creatorAddress}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => sortListings(a, b, sortKey));
  }, [
    accountAddress,
    listings,
    onlyLive,
    onlyMine,
    search,
    selectedCollectionSet,
    sortKey,
  ]);

  const chainName = MARKETPLACE_V3_CHAIN_NAME ?? "BNB Chain";
  const chainNameLower = chainName.toLowerCase();
  const currencySymbol =
    stats.symbol || (chainNameLower.includes("testnet") ? "tBNB" : "BNB");

  const notifySuccess = useCallback(
    (title: string, description?: string) =>
      pushToast({ variant: "success", title, description }),
    [pushToast],
  );

  const notifyError = useCallback(
    (description: string) =>
      pushToast({ variant: "error", title: "Transaction failed", description }),
    [pushToast],
  );

  const copyValue = useCallback(
    async (label: string, value?: string) => {
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
    },
    [notifyError, notifySuccess],
  );

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return "Syncing with thirdweb";
    const delta = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (delta < 60) return `${delta}s ago`;
    if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
    return `${Math.floor(delta / 3600)}h ago`;
  }, [lastUpdated]);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-900/40 via-slate-950 to-black p-8">
        <BackgroundGlow />
        <div className="flex flex-col gap-10 xl:flex-row xl:items-center">
          <div className="space-y-6 xl:w-3/5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-100">
              <Sparkles size={16} />
              {MARKETPLACE_V3_CHAIN_NAME} thirdweb Marketplace V3
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                ASX Marketplace board — multi-collection drops & offers
              </h1>
              <p className="text-base text-white/70 md:text-lg">
                Blur-inspired desk with fast filters, compact media, role-gated controls, and
                collection-aware scopes. English auctions stay in preview until launch; listings and
                offers are live now.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#marketplace-grid"
                className="inline-flex items-center justify-center rounded-xl bg-white text-sm font-semibold tracking-wide text-black shadow-lg shadow-cyan-500/30 transition hover:-translate-y-[1px] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span className="px-6 py-3">Browse live drops</span>
              </Link>
              <Link
                href={`${MARKETPLACE_V3_EXPLORER}/address/${MARKETPLACE_V3_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
              >
                View contract
                <ExternalLink size={16} />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatPill
                label="Live listings"
                value={integerFormatter.format(stats.liveListings)}
                detail="ready to mint"
              />
              <StatPill
                label="Active auctions"
                value={integerFormatter.format(stats.liveAuctions)}
                detail="English auctions on-chain"
              />
              <StatPill
                label="Open offers"
                value={integerFormatter.format(stats.openOffers)}
                detail="bids awaiting acceptance"
              />
              <StatPill
                label={`Floor (${currencySymbol})`}
                value={
                  stats.floor !== null ? `${numberFormatter.format(stats.floor)} ${currencySymbol}` : ""
                }
                detail="current lowest ask"
              />
            </div>
          </div>
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm xl:w-2/5">
            <div className="space-y-4 text-sm text-white/80">
              <div className="flex items-center justify-between text-xs uppercase text-white/60">
                <span>Marketplace telemetry</span>
                <span>{lastUpdatedLabel}</span>
              </div>
              <div className="space-y-2">
                <ProgressRow
                  label="Gross listing volume"
                  value={`${numberFormatter.format(stats.totalListingsValue)} ${currencySymbol}`}
                  progress={Math.min(100, stats.totalListingsValue * 4)}
                />
                <ProgressRow
                  label="Auction demand"
                  value={`${stats.liveAuctions} live - ${stats.auctionsEndingSoon} ending soon`}
                  progress={Math.min(100, stats.liveAuctions * 8)}
                />
                <ProgressRow
                  label="Offer fill-rate"
                  value={`${stats.openOffers} open offers`}
                  progress={Math.min(100, stats.openOffers * 5)}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <HighlightChip icon={<ShieldCheck size={16} />} label="role-gated listers" />
                <HighlightChip icon={<Clock3 size={16} />} label="buffered auctions" />
                <HighlightChip icon={<TrendingUp size={16} />} label="multi-currency support" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              <Boxes size={16} />
              Collection scope
            </div>
            <button
              type="button"
              onClick={() => setSelectedCollections([])}
              className="text-xs uppercase tracking-widest text-white/60 underline-offset-4 transition hover:text-white hover:underline"
            >
              Clear filters
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedCollections([])}
              className={clsx(
                "flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition",
                selectedCollectionSet.size === 0
                  ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                  : "border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-xs text-white/60">
                  All
                </div>
                <div>
                  <p className="text-sm font-semibold">All collections</p>
                  <p className="text-xs text-white/60">
                    {collectionRail.length} tracked • {stats.liveListings} live
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-white/50">
                Includes every whitelisted or discovered collection, even if no listings are live.
              </p>
            </button>
            {collectionRail.map((collection) => {
              const active = selectedCollectionSet.has(collection.address.toLowerCase());
              const image = resolveMediaUrl(collection.image);
              return (
                <button
                  key={collection.address}
                  type="button"
                  onClick={() => toggleCollection(collection.address)}
                  className={clsx(
                    "flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition",
                    active
                      ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                      : "border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      {image ? (
                        <img
                          src={image}
                          alt={collection.name ?? collection.address}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] text-white/60">
                          NFT
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {collection.name ?? shortAddress(collection.address)}
                      </p>
                      <p className="text-xs text-white/60">
                        {collection.symbol ?? "NFT"} • {collection.live} live • {collection.total} total
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyValue("Collection address", collection.address);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 hover:text-white"
                    >
                      <Copy size={12} />
                      Copy address
                    </button>
                    <Link
                      href={`${MARKETPLACE_V3_EXPLORER}/address/${collection.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 hover:text-white"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Explorer
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="search"
                placeholder="Search artists, assets, contract addresses"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
            </div>
            <button
              type="button"
              onClick={() => setOnlyLive((prev) => !prev)}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold text-white transition",
                onlyLive
                  ? "border-cyan-400/60 bg-cyan-400/20"
                  : "border-white/10 bg-white/5 hover:border-white/30",
              )}
            >
              <ShieldCheck size={16} />
              {onlyLive ? "Showing live drops" : "Showing all drops"}
            </button>
            <button
              type="button"
              onClick={() => setOnlyMine((prev) => !prev)}
              disabled={!accountAddress}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                onlyMine
                  ? "border-cyan-400/60 bg-cyan-400/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white",
                !accountAddress && "opacity-40 cursor-not-allowed",
              )}
            >
              <Sparkles size={16} />
              {onlyMine ? "My listings" : "All creators"}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-widest text-white/60 transition hover:border-white/30 hover:text-white"
              onClick={() => syncMarketplace({ silent: true })}
              disabled={refreshing}
            >
              <RefreshCcw size={14} className={refreshing ? "animate-spin" : undefined} />
              {refreshing ? "Refreshing..." : "Sync now"}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-widest text-white/60">
              {viewMode === "mosaic" ? <LayoutGrid size={16} /> : <Rows size={16} />}
              <button
                type="button"
                onClick={() => setViewMode((prev) => (prev === "mosaic" ? "immersive" : "mosaic"))}
                className="text-white/80"
              >
                {viewMode === "mosaic" ? "Mosaic view" : "Immersive view"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["listings", "offers", "activity"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab as MarketplaceTab)}
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition",
                activeTab === tab
                  ? "bg-white text-black"
                  : "border border-white/10 text-white/60 hover:border-white/30 hover:text-white",
              )}
            >
              {tab === "listings" ? "Listings" : tab === "offers" ? "Offers" : "Activity"}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "listings" && (
        <>
          <section className="space-y-6">
            <SectionHeading
              title="Create a listing"
              description="List approved NFT collections against the marketplace trade currency."
              icon={<Megaphone size={18} />}
            />
            <ListingComposer
              collections={collections}
              collectionsLoading={collectionsLoading}
              collectionsError={collectionsError}
              onRefetch={() => syncMarketplace({ silent: true })}
              notifySuccess={notifySuccess}
              notifyError={notifyError}
            />
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["featured", "price-low", "price-high", "newest"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSortKey(option as SortKey)}
                  className={clsx(
                    "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition",
                    sortKey === option
                      ? "bg-white text-black"
                      : "border border-white/10 text-white/50 hover:border-white/30 hover:text-white",
                  )}
                >
                  {option === "featured"
                    ? "Curated"
                    : option === "price-low"
                      ? "Price low"
                      : option === "price-high"
                        ? "Price high"
                        : "Newest"}
                </button>
              ))}
            </div>
            {error && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}
            <div id="marketplace-grid">
              {loading ? (
                <ListingSkeleton viewMode={viewMode} />
              ) : filteredListings.length === 0 ? (
                <EmptyState onRefresh={() => syncMarketplace({ silent: true })} />
              ) : viewMode === "mosaic" ? (
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id.toString()}
                      listing={listing}
                      variant="mosaic"
                      contract={MARKETPLACE_CONTRACT}
                      onRefetch={() => syncMarketplace({ silent: true })}
                      notifySuccess={notifySuccess}
                      notifyError={notifyError}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id.toString()}
                      listing={listing}
                      variant="immersive"
                      contract={MARKETPLACE_CONTRACT}
                      onRefetch={() => syncMarketplace({ silent: true })}
                      notifySuccess={notifySuccess}
                      notifyError={notifyError}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <AuctionsSection
            auctions={auctions}
            currencySymbol={currencySymbol}
            contract={MARKETPLACE_CONTRACT}
            onRefetch={() => syncMarketplace({ silent: true })}
            notifySuccess={notifySuccess}
            notifyError={notifyError}
            comingSoon
          />
        </>
      )}

      {activeTab === "offers" && (
        <OffersSection
          offers={offers}
          contract={MARKETPLACE_CONTRACT}
          collections={collections}
          catalogAssets={catalogAssets}
          onRefetch={() => syncMarketplace({ silent: true })}
          notifySuccess={notifySuccess}
          notifyError={notifyError}
        />
      )}

      {activeTab === "activity" && <ActivitySection activity={activity} />}

      <div className="mt-10 flex flex-col items-end gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={!isAdmin}
          onClick={() => setIsAdminPanelOpen(true)}
          className="px-6 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {isAdmin ? "Open Admin Panel" : "Admin Panel (locked)"}
        </Button>
        {!isAdmin && (
          <p className="text-xs text-white/50">
            {isCheckingAdmin
              ? "Verifying admin access..."
              : adminCheckError
                ? `Admin check failed: ${adminCheckError}`
                : "Connect an admin wallet to unlock advanced controls."}
            {!isCheckingAdmin && accountAddress && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={verifyAdmin}
                  className="text-cyan-300 underline-offset-2 hover:underline"
                >
                  Retry check
                </button>
              </>
            )}
          </p>
        )}
      </div>

      {isAdmin && (
        <AdminPanel
          open={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          collections={collections}
          collectionsLoading={collectionsLoading}
          onRefreshCollections={refreshCollections}
          notifySuccess={notifySuccess}
          notifyError={notifyError}
        />
      )}
    </div>
  );
}
