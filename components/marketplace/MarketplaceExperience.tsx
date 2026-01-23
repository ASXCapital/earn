"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { Address } from "viem";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Copy,
  ExternalLink,
  Megaphone,
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import type { DirectListing } from "thirdweb/extensions/marketplace";

import { Button } from "@/components/common/Button";
import {
  BackgroundGlow,
  EmptyState,
  ProgressRow,
  SectionHeading,
  StatPill,
} from "@/components/marketplace/components/primitives";
import { ListingCard, ListingSkeleton } from "@/components/marketplace/components/ListingCard";
import { ListingComposer } from "@/components/marketplace/components/ListingComposer";
import { AdminPanel } from "@/components/marketplace/sections/AdminPanel";
import { ActivitySection } from "@/components/marketplace/sections/ActivitySection";
import { OffersSection } from "@/components/marketplace/sections/OffersSection";
import { MARKETPLACE_CONTRACT } from "@/components/marketplace/constants";
import { useMarketplaceAdmin } from "@/components/marketplace/hooks/useMarketplaceAdmin";
import { useMarketplaceCatalog } from "@/components/marketplace/hooks/useMarketplaceCatalog";
import { useMarketplaceCollections } from "@/components/marketplace/hooks/useMarketplaceCollections";
import { useMarketplaceSync } from "@/components/marketplace/hooks/useMarketplaceSync";
import type { SortKey, ViewMode } from "@/components/marketplace/types";
import {
  computeStats,
  getListingState,
  integerFormatter,
  numberFormatter,
  resolveMediaUrl,
  safeNumber,
  shortAddress,
  sortListings,
} from "@/components/marketplace/utils";
import { useToast } from "@/components/toast/ToastProvider";
import {
  MARKETPLACE_V3_ADDRESS,
  MARKETPLACE_V3_CHAIN_NAME,
  MARKETPLACE_V3_EXPLORER,
} from "@/marketplace/config";

const TOTAL_SUPPLY = 8000;

export function MarketplaceExperience() {
  const { pushToast } = useToast();
  const account = useActiveAccount();
  const accountAddress = account?.address as Address | undefined;
  type MarketplaceTab = "listings" | "offers" | "activity";

  const [sortKey, setSortKey] = useState<SortKey>("collection-asc");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<MarketplaceTab>("listings");
  const [selectedListing, setSelectedListing] = useState<DirectListing | null>(null);
  const viewMode: ViewMode = "mosaic";
  const comingSoonFlag = process.env.NEXT_PUBLIC_MARKETPLACE_COMING_SOON;
  const isComingSoon = comingSoonFlag ? comingSoonFlag.toLowerCase() !== "false" : true;

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
    grossVolume,
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
    return [...listings]
      .filter((listing) => getListingState(listing).state !== "closed")
      .filter((listing) => {
        if (
          selectedCollectionSet.size > 0 &&
          !selectedCollectionSet.has(listing.assetContractAddress.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => sortListings(a, b, sortKey));
  }, [listings, selectedCollectionSet, sortKey]);

  const supplyListedPercent = useMemo(() => {
    if (!TOTAL_SUPPLY) return 0;
    return Math.min(100, Math.max(0, (stats.liveListings / TOTAL_SUPPLY) * 100));
  }, [stats.liveListings]);

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

  const toggleSort = useCallback(
    (column: "collection" | "price" | "seller") => {
      setSortKey((prev) => {
        const asc = `${column}-asc` as SortKey;
        const desc = `${column}-desc` as SortKey;
        return prev === asc ? desc : asc;
      });
    },
    [],
  );

  const sortIcon = useCallback(
    (column: "collection" | "price" | "seller") => {
      const asc = `${column}-asc`;
      const desc = `${column}-desc`;
      if (sortKey === asc) return <ArrowUp size={12} />;
      if (sortKey === desc) return <ArrowDown size={12} />;
      return <ArrowUpDown size={12} />;
    },
    [sortKey],
  );

  if (isComingSoon) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#060b12] via-[#0b1220] to-[#0c1628] px-6 py-10 text-center shadow-[0_20px_70px_-50px_rgba(34,211,238,0.4)] md:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-65">
          <div className="absolute -left-14 top-6 h-40 w-40 rounded-full bg-cyan-400/20 blur-[120px]" />
          <div className="absolute -right-16 bottom-2 h-48 w-48 rounded-full bg-emerald-300/15 blur-[140px]" />
          <div className="absolute inset-x-12 top-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_60%)]" />
        </div>
        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/60">
            Coming Late Jan
          </span>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">ASX Marketplace</h1>
          <p className="text-sm leading-relaxed text-white/65 md:text-base">
            A curated trading desk for ASX real-world asset NFTs with clean listing, sweep, and
            settlement flows.
          </p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">
            Listings • Offers • Auctions
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/10 bg-gradient-to-br from-[#050910] via-[#0b1220] to-[#0d1326] p-6 md:p-8 shadow-[0_28px_120px_-60px_rgba(14,165,233,0.55)]">
        <BackgroundGlow />
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute inset-y-0 right-0 w-[52%] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_46%)]" />
          <div className="absolute inset-y-0 left-0 w-[40%] bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_52%)]" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.25fr,0.95fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/70">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold uppercase tracking-[0.12em] text-white/70">
                <Sparkles size={15} />
                {MARKETPLACE_V3_CHAIN_NAME} thirdweb Marketplace V3
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/60">
                Synced {lastUpdatedLabel}
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold leading-tight text-white md:text-[34px]">
                ASX Marketplace
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
                A refined desk to explore, list, and collect ASX real-world asset NFTs with clean
                controls and on-chain clarity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="#market"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_16px_42px_-30px_rgba(34,211,238,0.8)] transition hover:-translate-y-[1px] hover:shadow-[0_22px_60px_-36px_rgba(34,211,238,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                Browse listings
              </Link>
              <Link
                href="#portfolio"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:text-white"
              >
                Open ASX desk
              </Link>
              <Link
                href={`${MARKETPLACE_V3_EXPLORER}/address/${MARKETPLACE_V3_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                View contract
                <ExternalLink size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
              <StatPill
                label="Live listings"
                value={integerFormatter.format(stats.liveListings)}
              />
              <StatPill
                label="Open offers"
                value={integerFormatter.format(stats.openOffers)}
              />
              <StatPill
                label="Listed value"
                value={`${numberFormatter.format(stats.totalListingsValue)} ${currencySymbol}`}
              />
              <StatPill
                label={`Floor (${currencySymbol})`}
                value={
                  stats.floor !== null ? `${numberFormatter.format(stats.floor)} ${currencySymbol}` : ""
                }
              />
              <StatPill
                label="Gross traded volume"
                value={`${numberFormatter.format(grossVolume)} ${currencySymbol}`}
              />
            </div>
          </div>
          <div className="w-full space-y-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3 text-sm text-white/80">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">Market pulse</p>
                <p className="text-base font-semibold text-white">Live health</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/60">
                {chainName}
              </span>
            </div>
            <div className="space-y-3">
              <ProgressRow
                label="Gross traded volume"
                value={`${numberFormatter.format(grossVolume)} ${currencySymbol}`}
                progress={Math.min(100, grossVolume * 4)}
              />
              <ProgressRow
                label="% of supply listed"
                value={`${numberFormatter.format(supplyListedPercent)}% of ${numberFormatter.format(TOTAL_SUPPLY)} supply`}
                progress={supplyListedPercent}
              />
              <ProgressRow label="Best APR" value="Coming soon" progress={0} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/50">Open offers</p>
                <p className="text-base font-semibold text-white">
                  {integerFormatter.format(stats.openOffers)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/50">Last sync</p>
                <p className="text-base font-semibold text-white">{lastUpdatedLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="market" className="grid gap-5 xl:grid-cols-[300px,1fr]">
        <aside className="space-y-4 rounded-3xl border border-cyan-200/10 bg-gradient-to-b from-[#0b1322] via-[#0c1526] to-[#0a111c] p-4 shadow-[0_18px_60px_-42px_rgba(14,165,233,0.55)]">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <Boxes size={16} />
                Collections
              </div>
              <p className="text-xs text-white/60">ASX-curated feed only</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCollections([])}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 underline-offset-4 transition hover:text-white hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 shadow-inner shadow-black/40">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-white/60">
              <span>Feed status</span>
              <span className="text-white/80">{lastUpdatedLabel}</span>
            </div>
            <p className="text-sm text-white/70">
              ASX-curated inventory only. Connect a wallet if you need to manage listings on-chain.
            </p>
          </div>
          <div className="max-h-[720px] space-y-1.5 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setSelectedCollections([])}
              className={clsx(
                "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition shadow-sm",
                selectedCollectionSet.size === 0
                  ? "border-cyan-300/50 bg-cyan-500/10 text-white shadow-[0_12px_42px_-28px_rgba(34,211,238,0.6)]"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25 hover:text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xs text-white/60">
                  All
                </div>
                <div>
                  <p className="text-sm font-semibold">All collections</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                    {collectionRail.length} tracked | {stats.liveListings} live
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-white/60">Everything indexed</div>
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
                    "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition shadow-sm",
                    active
                      ? "border-cyan-300/60 bg-cyan-500/10 text-white shadow-[0_12px_42px_-28px_rgba(34,211,238,0.6)]"
                      : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black/40">
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
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                        {collection.symbol ?? "NFT"} | {collection.live} live | {collection.total} indexed
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px] text-white/60">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyValue("Collection address", collection.address);
                      }}
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-200/20 bg-white/5 px-2 py-1 text-white/75 transition hover:border-cyan-200/40 hover:text-white"
                >
                  <Copy size={12} />
                  Copy
                </button>
                <Link
                  href={`${MARKETPLACE_V3_EXPLORER}/address/${collection.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-200/20 bg-white/5 px-2 py-1 text-white/75 transition hover:border-cyan-200/40 hover:text-white"
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
        </aside>

        <div className="space-y-4">
          <div className="space-y-2.5 rounded-2xl border border-cyan-200/10 bg-gradient-to-br from-[#0c1728] via-[#0e1c32] to-[#0a111c] p-3 shadow-[0_20px_80px_-50px_rgba(34,211,238,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Marketplace</p>
                <p className="text-sm text-white/70">{filteredListings.length} ASX items curated</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-cyan-200/20 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-cyan-200/50 hover:text-white"
                  onClick={() => syncMarketplace({ silent: true })}
                  disabled={refreshing}
                >
                  <RefreshCcw size={14} className={refreshing ? "animate-spin" : undefined} />
                  {refreshing ? "Refreshing..." : "Sync now"}
                </button>
                <Link
                  href="#portfolio"
                  className="inline-flex items-center gap-2 rounded-md border border-cyan-200/20 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-[1px] hover:border-cyan-200/50"
                >
                  <Megaphone size={14} />
                  ASX desk
                </Link>
              </div>
            </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {(["listings", "offers", "activity"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={clsx(
                      "rounded-md px-3.5 py-1.5 text-sm font-semibold transition border",
                      activeTab === tab
                        ? "border-cyan-200/40 bg-white text-slate-900 shadow-[0_10px_30px_-18px_rgba(34,211,238,0.6)]"
                        : "border-cyan-200/15 text-white/65 hover:border-cyan-200/40 hover:text-white",
                    )}
                  >
                    {tab === "listings" ? "Listings" : tab === "offers" ? "Offers" : "Activity"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/60">Last updated {lastUpdatedLabel}</span>
            </div>
          </div>

          {activeTab === "listings" ? (
            <div className="space-y-3.5">
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
                ) : (
                  <div className="space-y-1">
                    <div className="hidden rounded-lg border border-cyan-200/15 bg-gradient-to-r from-[#0c1424] via-[#0f1a30] to-[#0c1424] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-white/65 shadow-[0_10px_40px_-30px_rgba(34,211,238,0.6)] md:grid md:grid-cols-[minmax(0,1.1fr),150px,165px,140px]">
                      <button
                        type="button"
                        onClick={() => toggleSort("collection")}
                        className="flex items-center gap-1 text-left font-semibold text-white/70 transition hover:text-white focus:outline-none"
                      >
                        Collection
                        {sortIcon("collection")}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSort("price")}
                        className="flex items-center gap-1 text-left font-semibold text-white/70 transition hover:text-white focus:outline-none"
                      >
                        Price
                        {sortIcon("price")}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSort("seller")}
                        className="flex items-center gap-1 text-left font-semibold text-white/70 transition hover:text-white focus:outline-none"
                      >
                        Seller
                        {sortIcon("seller")}
                      </button>
                      <span className="text-center">Action</span>
                    </div>
                    <div className="space-y-0">
                      {filteredListings.map((listing) => (
                        <ListingCard
                          key={listing.id.toString()}
                          listing={listing}
                          variant={viewMode}
                          contract={MARKETPLACE_CONTRACT}
                          onRefetch={() => syncMarketplace({ silent: true })}
                          onOpenDetail={(item) => setSelectedListing(item)}
                          notifySuccess={notifySuccess}
                          notifyError={notifyError}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "offers" ? (
            <OffersSection
              offers={offers}
              contract={MARKETPLACE_CONTRACT}
              collections={collections}
              onRefetch={() => syncMarketplace({ silent: true })}
              notifySuccess={notifySuccess}
              notifyError={notifyError}
            />
          ) : (
            <ActivitySection activity={activity} />
          )}
        </div>
      </section>

      <section
        id="portfolio"
        className="space-y-3.5 rounded-2xl border border-white/12 bg-[#0b1018] p-3.5 shadow-[0_20px_80px_-46px_rgba(0,0,0,0.85)]"
      >
        <SectionHeading
          title="ASX desk"
          description="Send NFTs to another wallet, list individual pieces, or bulk list directly from ASX-held collections."
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

      <div className="flex flex-col items-end gap-2">
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
          <p className="text-xs text-white/60">
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

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          currencySymbol={currencySymbol}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}

type ListingDetailModalProps = {
  listing: DirectListing;
  onClose: () => void;
  currencySymbol: string;
};

function ListingDetailModal({ listing, onClose, currencySymbol }: ListingDetailModalProps) {
  const media = resolveMediaUrl(listing.asset?.metadata?.image as string | undefined);
  const name =
    listing.asset?.metadata?.name ||
    `Token #${listing.tokenId.toString()} ${shortAddress(listing.assetContractAddress)}`;
  const description = listing.asset?.metadata?.description;
  const attributes =
    Array.isArray((listing.asset?.metadata as any)?.attributes) &&
    (listing.asset?.metadata as any)?.attributes.length > 0
      ? (listing.asset?.metadata as any).attributes
      : [];
  const state = getListingState(listing);
  const pricePerToken = safeNumber(listing.currencyValuePerToken.displayValue);
  const quantity = Number(listing.quantity ?? 1n);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a1018] shadow-[0_28px_120px_-48px_rgba(0,0,0,0.9)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">Listing preview</p>
            <p className="text-lg font-semibold text-white">{name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 p-2 text-white/70 transition hover:border-white/40 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:grid-cols-[1.05fr,1fr]">
          <div className="space-y-2.5">
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {media ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-white/60">
                  No preview available
                </div>
              )}
            </div>
            {description ? (
              <p className="text-sm leading-relaxed text-white/70 line-clamp-4">{description}</p>
            ) : null}
          </div>

          <div className="space-y-3 text-sm text-white/80">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                    state.state === "live"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : state.state === "scheduled"
                        ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white/70",
                  )}
                >
                  {state.label}
                </span>
                <span className="text-[11px] text-white/60">{state.detail}</span>
              </div>
              <div className="mt-3 text-2xl font-semibold text-white">
                {numberFormatter.format(pricePerToken)} {listing.currencyValuePerToken.symbol || currencySymbol}
              </div>
              <div className="text-xs text-white/60">
                {integerFormatter.format(quantity)} available from {shortAddress(listing.creatorAddress)}
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Contract</p>
                <p className="text-sm font-semibold text-white">{shortAddress(listing.assetContractAddress)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Listing ID</p>
                <p className="text-sm font-semibold text-white">{listing.id.toString()}</p>
              </div>
            </div>

            {attributes && attributes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Traits</p>
                <div className="flex flex-wrap gap-2">
                  {attributes.map((attr: any, index: number) => (
                    <div
                      key={`${attr?.trait_type ?? "trait"}-${index}`}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80"
                    >
                      <span className="font-semibold">{attr?.trait_type || "Trait"}:</span>{" "}
                      <span className="text-white/70">{String(attr?.value ?? "N/A")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
