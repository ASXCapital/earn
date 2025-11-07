"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/common/Button';
import { LEGAL_BUNDLES } from './LegalTile';

type LegalBundleKey = keyof typeof LEGAL_BUNDLES;

interface MarketplaceLinkInfo {
    name: string;
    url: string;
    icon: string;
}

interface DistributionTx {
    label: string;
    tx: string;
}

type PropertyStatus = 'live' | 'pipeline';

interface NetworkMeta {
    label: string;
    icon?: string;
}

type NetworkStackSize = 'sm' | 'md';

interface MintTableRow {
    key: string;
    status: PropertyStatus;
    name: string;
    image: string;
    marketplaces: MarketplaceLinkInfo[];
    apr?: number;
    supply?: number | null;
    targetSupply?: number;
    symbol?: string;
    address?: string;
    networkLabel?: string;
    networkIcon?: string;
    networks?: NetworkMeta[];
    legalBundle?: LegalBundleKey;
    distributionTxs?: DistributionTx[];
    unit?: string;
    occupancy?: string;
    valuation?: string;
    maxRaise?: string;
    showUnitInfo?: boolean;
}

const MINT_TABLE_ROWS: MintTableRow[] = [
    {
        key: 'mva',
        status: 'live',
        name: 'Mountain View Apartments',
        symbol: 'MVA',
        address: '0x8a747b5797b3164a64759a3d77f5a0f4e758283b',
        image: '/images/nft/Mountain+View.webp',
        marketplaces: [
            {
                name: 'Blockz',
                url: 'https://blockz.gg/collection/0x8a747b5797b3164a64759a3d77f5a0f4e758283b/',
                icon: '/images/nft/BZ%20Cadre%20White.png',
            },
            {
                name: 'OKX',
                url: 'https://web3.okx.com/nft/collection/core/asx-mountain-view-apts',
                icon: '/images/nft/okx.webp',
            },
        ],
        apr: 0.072,
        supply: 3000,
        targetSupply: 3000,
        networkLabel: 'Core',
        networkIcon: '/images/nft/coreIcon.svg',
        networks: [
            { label: 'Core', icon: '/images/nft/coreIcon.svg' },
        ],
        legalBundle: 'ASXRWA002',
        distributionTxs: [
            { label: 'Distribution #1', tx: '0x460df738975ccfce048a2fa04589443c28fad4cef763ddf5cc8a53f001e88d97' },
            { label: 'Distribution #2', tx: '0x608b485aeae90cdfcb3b95c604a31b709708100c29710c160a00702b3bc892e7' },
        ],
        maxRaise: '$30,000',
    },
    {
        key: 'fjc',
        status: 'live',
        name: 'Franklin Jefferson Candlelight',
        symbol: 'FJC',
        address: '0x649edd9af91646348aa4ba197d71eb05b9546d5a',
        image: '/images/nft/FJC.webp',
        marketplaces: [
            {
                name: 'Blockz',
                url: 'https://blockz.gg/collection/0x649edd9af91646348aa4ba197d71eb05b9546d5a/',
                icon: '/images/nft/BZ%20Cadre%20White.png',
            },
            {
                name: 'OKX',
                url: 'https://web3.okx.com/nft/collection/core/asx-fjc-apts',
                icon: '/images/nft/okx.webp',
            },
        ],
        apr: 0.085,
        supply: 5000,
        targetSupply: 5000,
        networkLabel: 'Core',
        networkIcon: '/images/nft/coreIcon.svg',
        networks: [
            { label: 'Core', icon: '/images/nft/coreIcon.svg' },
        ],
        legalBundle: 'ASXRWA001',
        distributionTxs: [
            { label: 'Mint Refund', tx: '0xb297a8ac9fd4202e7b308a118624d5097a7c768ab2e7088309abbb7c94016369' },
            { label: 'Distribution #1', tx: '0x67ca14b93e139289570481e7978928e16f275e85211ecf0d46d416bac1dc12ca' },
            { label: 'Distribution #2', tx: '0x0d54db5f939f4d46a368502fdc7829cc9a62811bb7d546a620fb343d54667f69' },
            { label: 'Distribution #3', tx: '0x8360b962c4a38e2aa909949b5bb590c7599e325142cdb1a8b94cca0893f9f2b6' },
            { label: 'Distribution #4', tx: '0xbc091fe5b55b0812d546f3898a928c69425b5dee83b831724fe74cad88f314f5' },
        ],
        maxRaise: '$50,000',
    },
    {
        key: 'gwt',
        status: 'pipeline',
        name: 'Greens At Alvamar',
        image: '/images/nft/GWT.webp',
        marketplaces: [],
        apr: 0.064,
        occupancy: '98.68%',
        valuation: '$18.5M',
        maxRaise: '$100,000',
        showUnitInfo: false,
        networkLabel: 'BNB + Core',
        networkIcon: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png',
        networks: [
            { label: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png' },
            { label: 'Core', icon: '/images/nft/coreIcon.svg' },
        ],
    },
    {
        key: 'bvt',
        status: 'pipeline',
        name: 'Brookwood Village Townhomes',
        image: '/images/nft/BVT.webp',
        marketplaces: [],
        apr: 0.068,
        occupancy: '97.22%',
        valuation: '$35.5M',
        maxRaise: '$100,000',
        showUnitInfo: false,
        networkLabel: 'BNB + Core',
        networkIcon: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png',
        networks: [
            { label: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png' },
            { label: 'Core', icon: '/images/nft/coreIcon.svg' },
        ],
    },
];

const MINT_TABLE_TEMPLATE =
    'minmax(220px,1.3fr) minmax(120px,0.7fr) minmax(150px,0.9fr) minmax(150px,0.95fr) minmax(220px,1.1fr) minmax(150px,1fr) minmax(140px,0.9fr)';

const STAT_CAPTION_CLASS = 'text-[6px] uppercase tracking-[0.12em] text-white/45';

type DropdownPosition = {
    top: number;
    left: number;
    width: number;
};

export function YieldIntro() {
    const legalEntries = Object.entries(LEGAL_BUNDLES) as [LegalBundleKey, string[]][];
    const [mobileOpen, setMobileOpen] = useState<string | null>(null);

    return (
        <div className="space-y-10 px-3 sm:px-0">
            <LegalShowcase entries={legalEntries} />
            <section className="relative overflow-visible rounded-2xl border border-white/10 bg-[#0c111a]/80 p-4 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                <div className="pointer-events-none absolute -top-32 right-16 h-72 w-72 rounded-full bg-teal-500/20 blur-[140px]" />
                <div className="pointer-events-none absolute bottom-0 left-10 h-44 w-44 rounded-full bg-blue-500/15 blur-[120px]" />
                <div className="relative space-y-6">
                    <header className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2 max-w-2xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-teal-200">
                                BUY / Mint Launchpad
                            </span>


                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] uppercase tracking-[0.32em] text-white/55">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span>Issuer snapshot updated</span>
                        </div>
                    </header>
                    <div className="hidden xl:block">
                        <MintTable rows={MINT_TABLE_ROWS} />
                    </div>
                    <div className="xl:hidden">
                        <MobilePropertyList
                            rows={MINT_TABLE_ROWS}
                            openKey={mobileOpen}
                            onToggle={(key) => setMobileOpen((prev) => (prev === key ? null : key))}
                        />
                    </div>
                    <div className="text-xs text-white/45 max-w-4xl leading-relaxed">
                        Target figures are indicative and subject to change with occupancy, operating costs, timing and other variables. NFTs convey no equity,governance, redemption right or direct real estate ownership; economic value is derived solely from participation in the promisory note distribution mechanism. Review Terms &amp; Risk Factors before allocating capital.
                    </div>
                </div>
            </section>
        </div>
    );
}

function LegalShowcase({ entries }: { entries: [LegalBundleKey, string[]][] }) {
    const [openBundle, setOpenBundle] = useState<LegalBundleKey | null>(null);
    const [panelPos, setPanelPos] = useState<DropdownPosition | null>(null);
    const triggersRef = useRef<Record<string, HTMLDivElement | null>>({});
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const portalTarget = typeof document !== 'undefined' ? document.body : null;

    const updatePosition = useCallback(() => {
        if (!openBundle || typeof window === 'undefined') return;
        const bundleKey = String(openBundle);
        const trigger = triggersRef.current[bundleKey];
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const margin = 16;
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        const maxWidth = Math.max(window.innerWidth - margin * 2, 280);
        const width = Math.min(Math.max(rect.width, 320), maxWidth);
        const left = Math.min(Math.max(rect.left + scrollX, margin), scrollX + window.innerWidth - width - margin);
        const top = rect.bottom + scrollY + 12;
        setPanelPos({ top, left, width });
    }, [openBundle]);

    useLayoutEffect(() => {
        if (!openBundle) return;
        updatePosition();
    }, [openBundle, updatePosition]);

    useEffect(() => {
        if (!openBundle || typeof window === 'undefined') return undefined;
        const handler = () => updatePosition();
        window.addEventListener('resize', handler);
        window.addEventListener('scroll', handler, true);
        return () => {
            window.removeEventListener('resize', handler);
            window.removeEventListener('scroll', handler, true);
        };
    }, [openBundle, updatePosition]);

    useEffect(() => {
        if (!openBundle || typeof document === 'undefined') return undefined;
        const handle = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (overlayRef.current?.contains(target)) return;
            const bundleKey = String(openBundle);
            const trigger = triggersRef.current[bundleKey];
            if (trigger?.contains(target)) return;
            setOpenBundle(null);
        };
        document.addEventListener('mousedown', handle);
        document.addEventListener('touchstart', handle);
        return () => {
            document.removeEventListener('mousedown', handle);
            document.removeEventListener('touchstart', handle);
        };
    }, [openBundle]);

    useEffect(() => {
        if (!openBundle || typeof window === 'undefined') return undefined;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpenBundle(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [openBundle]);

    useEffect(() => {
        if (!openBundle) setPanelPos(null);
    }, [openBundle]);

    const activeEntry = openBundle ? entries.find(([bundle]) => bundle === openBundle) : undefined;
    const activeFiles = activeEntry ? activeEntry[1] : [];

    function toggleBundle(bundle: LegalBundleKey) {
        setOpenBundle(prev => (prev === bundle ? null : bundle));
    }

    return (
        <section className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-[#0c111a]/90 to-[#0c111a] p-4 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute -top-24 left-12 h-40 w-40 rounded-full bg-teal-500/30 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 right-10 h-44 w-44 rounded-full bg-blue-500/15 blur-[140px]" />
            <div className="relative space-y-5">
                <header className="space-y-2 max-w-3xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-teal-100">
                        Legal
                    </span>


                </header>
                <div className="grid gap-4 lg:grid-cols-2">
                    {entries.map(([bundle, files]) => {
                        const bundleKey = String(bundle);
                        const active = openBundle === bundle;
                        return (
                            <div
                                key={bundleKey}
                                id={`legal-${bundleKey.toLowerCase()}`}
                                ref={(node) => {
                                    if (node) {
                                        triggersRef.current[bundleKey] = node;
                                    } else {
                                        delete triggersRef.current[bundleKey];
                                    }
                                }}
                                className={`flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur transition ${active ? 'border-teal-400/60 shadow-[0_24px_60px_rgba(45,212,191,0.15)]' : 'hover:border-teal-400/40 hover:bg-white/[0.08]'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className={`${STAT_CAPTION_CLASS} text-white/45`}>Bundle</span>
                                        <div className="text-base font-medium text-white">{bundle}</div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <span className={`${STAT_CAPTION_CLASS} text-white/45`}>Documents</span>
                                        <div className="text-sm font-medium text-white/80">{files.length}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleBundle(bundle)}
                                        aria-expanded={active}
                                        className={`px-3 text-[8px] uppercase tracking-[0.18em] transition ${active
                                            ? 'border-teal-400/50 bg-teal-500/15 text-teal-100 hover:border-teal-300/60 hover:text-white'
                                            : 'border-white/15 bg-white/[0.05] text-white/75 hover:border-teal-400/50 hover:text-white'
                                            }`}
                                    >
                                        {active ? 'Hide Docs' : 'View Docs'}
                                    </Button>
                                    <span className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                                        {files.length} file{files.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {portalTarget && openBundle && panelPos && createPortal(
                <div className="fixed inset-0 z-[90] pointer-events-none">
                    <div
                        ref={overlayRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${openBundle} legal documents`}
                        className="pointer-events-auto overflow-hidden rounded-2xl border border-white/15 bg-[#0d1116]/96 p-4 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur text-xs text-white/70"
                        style={{
                            position: 'absolute',
                            top: panelPos.top,
                            left: panelPos.left,
                            width: panelPos.width,
                            maxWidth: 'min(520px, calc(100vw - 24px))',
                        }}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                            <div className="space-y-1">
                                <span className={`${STAT_CAPTION_CLASS} text-white/45`}>Bundle</span>
                                <div className="text-lg font-semibold text-white">{openBundle}</div>
                                <div className="text-[10px] uppercase tracking-[0.24em] text-teal-300">Verified documents</div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setOpenBundle(null)}
                                className="border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-white/60 hover:bg-white/10 hover:text-white"
                            >
                                Close
                            </Button>
                        </div>
                        <ul
                            className="mt-3 space-y-1.5 overflow-y-auto pr-1"
                            style={{ maxHeight: 'min(65vh, 420px)' }}
                        >
                            {activeFiles.map((file) => {
                                const bundleSegment = openBundle ? String(openBundle).toLowerCase() : '';
                                const path = `/legal/${bundleSegment}/${encodeURIComponent(file)}`;
                                return (
                                    <li key={file}>
                                        <a
                                            href={path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/35 px-2 py-1.5 transition hover:border-teal-400/40 hover:text-white"
                                        >
                                            <span className="truncate" title={file}>{file}</span>
                                            <span className="text-[10px] uppercase tracking-[0.24em] text-teal-300">View</span>
                                        </a>
                                    </li>
                                );
                            })}
                            {activeFiles.length === 0 && (
                                <li className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-center text-[11px] uppercase tracking-[0.24em] text-white/40">
                                    Documents will publish here
                                </li>
                            )}
                        </ul>
                    </div>
                </div>,
                portalTarget,
            )}
        </section>
    );
}

function MintTable({ rows }: { rows: MintTableRow[] }) {
    const [openDistribution, setOpenDistribution] = useState<string | null>(null);

    return (
        <div className="relative w-full">
            <div className="max-w-full overflow-x-auto overflow-y-visible">
                <div className="min-w-[960px] space-y-3">
                    <div className="grid px-3 text-[10px] uppercase tracking-[0.26em] text-white/55" style={{ gridTemplateColumns: MINT_TABLE_TEMPLATE }}>
                        <span>Property</span>
                        <span>Availability</span>
                        <span>Launch APR</span>
                        <span>Distributions</span>
                        <span>Marketplaces</span>
                        <span>Valuation</span>
                        <span>Network / Raise</span>
                    </div>
                    <div className="space-y-3">
                        {rows.map((row) => (
                            <MintTableRowComponent
                                key={row.key}
                                row={row}
                                isDistributionOpen={openDistribution === row.key}
                                onToggleDistribution={() => setOpenDistribution((prev) => (prev === row.key ? null : row.key))}
                                closeDistributions={() => setOpenDistribution(null)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MintTableRowComponent({
    row,
    isDistributionOpen,
    onToggleDistribution,
    closeDistributions,
}: {
    row: MintTableRow;
    isDistributionOpen: boolean;
    onToggleDistribution: () => void;
    closeDistributions: () => void;
}) {
    return (
        <div
            className={`relative grid items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2 shadow-[0_12px_26px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:bg-white/[0.035] ${isDistributionOpen ? 'z-30 bg-white/[0.045]' : ''
                }`}
            style={{ gridTemplateColumns: MINT_TABLE_TEMPLATE }}
        >
            <CollectionCell row={row} />
            <AvailabilityCell row={row} />
            <YieldOccupancyCell row={row} />
            <DistributionCell
                row={row}
                open={isDistributionOpen}
                onToggle={onToggleDistribution}
                onClose={closeDistributions}
            />
            <MarketplaceCell items={row.marketplaces} />
            <ValuationCell row={row} />
            <NetworkRaiseCell row={row} />
        </div>
    );
}

function CollectionCell({ row }: { row: MintTableRow }) {
    const showSymbol = row.status === 'live' && row.symbol;
    const showPipelineUnit = row.status === 'pipeline' && row.unit && row.showUnitInfo !== false;
    const secondary = showPipelineUnit ? `Unit #${row.unit}` : null;
    const showAddress = row.status === 'live' && !!row.address;
    const displayAddress = row.address ? formatAddressPreview(row.address) : '';
    const explorerUrl = showAddress ? getExplorerUrl(row) : null;
    const { copied, handleCopy } = useCopyToClipboard(row.address);

    return (
        <div className="flex items-center gap-2.5">
            <div className="relative">
                <div className="h-11 w-11 overflow-hidden rounded-lg bg-white/[0.06]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.image} alt={`${row.name} emblem`} className="h-full w-full object-cover" loading="lazy" />
                </div>
                {showSymbol && (
                    <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full border border-white/20 bg-black/60 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.22em] text-white/65">
                        {row.symbol}
                    </span>
                )}
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-white/85 leading-tight">{row.name}</span>
                {showAddress ? (
                    <div className="flex items-start gap-1.5 text-[9px] font-mono text-white/55">
                        {explorerUrl ? (
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="leading-tight text-white/60 underline-offset-4 hover:text-white"
                                title="View on explorer"
                            >
                                {displayAddress}
                            </a>
                        ) : (
                            <span className="leading-tight" title={row.address}>
                                {displayAddress}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`rounded-md p-0.5 transition ${copied ? 'text-teal-300' : 'text-white/45 hover:text-white'
                                }`}
                            aria-label={copied ? 'Copied address' : 'Copy contract address'}
                            title={copied ? 'Copied!' : 'Copy address'}
                        >
                            <CopyIcon copied={copied} />
                            <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                ) : (
                    secondary && <span className="text-[8px] uppercase tracking-[0.2em] text-white/38">{secondary}</span>
                )}
            </div>
        </div>
    );
}
function AvailabilityCell({ row }: { row: MintTableRow }) {
    return (
        <div className="flex flex-col gap-1">
            <AvailabilityButton row={row} className="w-full max-w-[115px]" />
            <AvailabilityCaption row={row} className="text-right text-[9px] text-white/55" />
        </div>
    );
}

function AvailabilityButton({ row, className = '' }: { row: MintTableRow; className?: string }) {
    if (row.status === 'live') {
        return (
            <Button
                disabled
                variant="outline"
                size="sm"
                className={`justify-center border-emerald-400/40 bg-emerald-500/10 text-[4px] uppercase tracking-[0.18em] text-emerald-200/75 ${className}`}
            >
                Sold Out
            </Button>
        );
    }
    return (
        <Button
            disabled
            variant="outline"
            size="sm"
            className={`justify-center border-white/16 bg-white/[0.045] text-[4px] uppercase tracking-[0.18em] text-white/55 ${className}`}
        >
            Coming Soon
        </Button>
    );
}

function AvailabilityCaption({ row, className = '' }: { row: MintTableRow; className?: string }) {
    if (row.status !== 'live') return null;
    const value = formatSupply(row.supply, row.targetSupply);
    return <span className={className}>{value}</span>;
}

function MarketplaceCell({ items }: { items: MarketplaceLinkInfo[] }) {
    if (!items || items.length === 0) {
        return <span className={STAT_CAPTION_CLASS}>TBA</span>;
    }
    return (
        <div className="flex flex-wrap items-center gap-2">
            {items.map((item) => (
                <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.icon} alt={`${item.name} logo`} className="h-4 w-4 rounded-sm object-contain" loading="lazy" />
                    <span>{item.name}</span>
                </a>
            ))}
        </div>
    );
}

function YieldOccupancyCell({ row }: { row: MintTableRow }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-white/85">{formatPercent(row.apr)}</span>

        </div>
    );
}
function DistributionCell({
    row,
    open,
    onToggle,
    onClose,
}: {
    row: MintTableRow;
    open: boolean;
    onToggle: () => void;
    onClose: () => void;
}) {
    const triggerRef = useRef<HTMLDivElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [panelPos, setPanelPos] = useState<DropdownPosition | null>(null);
    const portalTarget = typeof document !== 'undefined' ? document.body : null;

    const updatePosition = useCallback(() => {
        if (row.status !== 'live' || !open || typeof window === 'undefined' || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const margin = 16;
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        const maxWidth = Math.max(280, Math.min(420, window.innerWidth - margin * 2));
        const width = Math.min(Math.max(rect.width + 140, 280), maxWidth);
        const left = Math.min(Math.max(rect.left + scrollX - (width - rect.width) / 2, margin), scrollX + window.innerWidth - width - margin);
        const top = rect.bottom + scrollY + 12;
        setPanelPos({ top, left, width });
    }, [open, row.status]);

    useLayoutEffect(() => {
        if (row.status !== 'live' || !open) return;
        updatePosition();
    }, [open, row.status, updatePosition]);

    useEffect(() => {
        if (row.status !== 'live' || !open) {
            setPanelPos(null);
            return undefined;
        }
        const handler = () => updatePosition();
        window.addEventListener('resize', handler);
        window.addEventListener('scroll', handler, true);
        return () => {
            window.removeEventListener('resize', handler);
            window.removeEventListener('scroll', handler, true);
        };
    }, [open, row.status, updatePosition]);

    useEffect(() => {
        if (row.status !== 'live' || !open) return undefined;
        const handle = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (dropdownRef.current?.contains(target)) return;
            if (triggerRef.current?.contains(target)) return;
            onClose();
        };
        document.addEventListener('mousedown', handle);
        document.addEventListener('touchstart', handle);
        return () => {
            document.removeEventListener('mousedown', handle);
            document.removeEventListener('touchstart', handle);
        };
    }, [open, onClose, row.status]);

    useEffect(() => {
        if (row.status !== 'live' || !open) return undefined;
        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose, row.status]);

    if (row.status === 'pipeline') {
        const showUnitDetails = row.unit && row.showUnitInfo !== false;
        return (
            <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium text-white/85">
                    {showUnitDetails ? `Unit #${row.unit}` : 'TBA'}
                </span>
                <span className={`${STAT_CAPTION_CLASS} text-white/40`}>{showUnitDetails ? 'Stack' : 'Distributions'}</span>
            </div>
        );
    }

    const drops = row.distributionTxs?.length ?? 0;
    const hasDistributions = drops > 0;
    const dropdown =
        portalTarget && open && panelPos
            ? createPortal(
                <div className="fixed inset-0 z-[80] pointer-events-none">
                    <div
                        ref={dropdownRef}
                        className="pointer-events-auto overflow-hidden rounded-2xl border border-white/15 bg-[#0d1116]/96 p-4 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur text-xs text-white/75"
                        style={{
                            position: 'absolute',
                            top: panelPos.top,
                            left: panelPos.left,
                            width: panelPos.width,
                            maxWidth: 'min(420px, calc(100vw - 24px))',
                        }}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                            <div className="space-y-0.5">
                                <span className={`${STAT_CAPTION_CLASS} text-white/45`}>Distribution Ledger</span>
                                <div className="text-sm font-semibold text-white">{row.name}</div>
                                <div className="text-[10px] uppercase tracking-[0.24em] text-teal-300">
                                    {drops} drop{drops === 1 ? '' : 's'}
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={onClose}
                                className="border border-white/10 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.24em] text-white/60 hover:bg-white/10 hover:text-white"
                            >
                                Close
                            </Button>
                        </div>
                        {hasDistributions && row.distributionTxs ? (
                            <ul className="mt-3 max-h-60 space-y-1.5 overflow-y-auto pr-1 text-[11px] text-white/80">
                                {row.distributionTxs.map((tx) => (
                                    <li key={tx.tx}>
                                        <a
                                            href={`https://scan.coredao.org/tx/${tx.tx}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 transition hover:border-teal-400/40 hover:text-white"
                                        >
                                            <span>{tx.label}</span>
                                            <span className="text-[8px] uppercase tracking-[0.18em] text-teal-300">View</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="mt-3 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-center text-[11px] uppercase tracking-[0.24em] text-white/45">
                                No distributions yet
                            </div>
                        )}
                    </div>
                </div>,
                portalTarget,
            )
            : null;

    return (
        <>
            <div ref={triggerRef}>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-expanded={open}
                    onClick={onToggle}
                    className="border-white/15 bg-white/[0.045] px-3 text-[4px] uppercase tracking-[0.14em] text-white/70 hover:border-teal-400/35 hover:text-white"
                >
                    View ({drops})
                </Button>
            </div>
            {dropdown}
        </>
    );
}

function ValuationCell({ row }: { row: MintTableRow }) {
    const value = row.valuation ?? 'TBC';
    return <span className="text-[11px] font-medium text-white/85">{value}</span>;
}

function NetworkRaiseCell({ row }: { row: MintTableRow }) {
    const explorerUrl = getExplorerUrl(row);
    const fallbackNetworks = row.networkLabel || row.networkIcon ? [{ label: row.networkLabel ?? '—', icon: row.networkIcon }] : [];
    const networks = row.networks && row.networks.length > 0 ? row.networks : fallbackNetworks;
    const showNetwork = networks.length > 0;

    const networkLabelText = row.networkLabel || networks.map((network) => network.label).join(' • ') || '—';

    return (
        <div className="flex items-center gap-2">
            {showNetwork && (
                explorerUrl ? (
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 transition hover:text-white"
                        title="View contract on explorer"
                        aria-label="View contract on explorer"
                    >
                        <NetworkStack networks={networks} />
                    </a>
                ) : (
                    <NetworkStack networks={networks} />
                )
            )}
            <div className="flex flex-col gap-0.5">
                {showNetwork && (
                    <>
                        <span className="text-[11px] font-medium text-white/85">{networkLabelText}</span>

                    </>
                )}
                <span className="text-[11px] font-medium text-white/85">{row.maxRaise ?? '—'}</span>

            </div>
        </div>
    );
}

function MobilePropertyList({
    rows,
    openKey,
    onToggle,
}: {
    rows: MintTableRow[];
    openKey: string | null;
    onToggle: (key: string) => void;
}) {
    return (
        <div className="space-y-3">
            {rows.map((row) => {
                const open = openKey === row.key;
                const highlights = buildMobileHighlights(row);
                return (
                    <div key={row.key} className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_16px_40px_rgba(0,0,0,0.32)]">
                        <button
                            type="button"
                            onClick={() => onToggle(row.key)}
                            className="flex w-full items-center justify-between gap-4 px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.05]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={row.image} alt={`${row.name} emblem`} className="h-full w-full object-cover" loading="lazy" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[12px] font-medium text-white/85 leading-tight">{row.name}</span>
                                    <span className={STAT_CAPTION_CLASS}>{formatPercent(row.apr)}</span>
                                </div>
                            </div>
                            <svg
                                aria-hidden="true"
                                className={`h-3 w-3 shrink-0 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>
                        {open && (
                            <div className="space-y-3 border-t border-white/10 px-4 py-3 text-xs text-white/75">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {highlights.map((item) => (
                                        <div key={`${row.key}-${item.label}`} className="flex flex-col gap-0.5 rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2">
                                            <span className={STAT_CAPTION_CLASS}>{item.label}</span>
                                            <span className="text-[12px] font-medium text-white/85">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <AvailabilityButton row={row} className="w-full sm:w-auto" />
                                    <MobileContractSection row={row} />
                                </div>
                                {row.marketplaces.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {row.marketplaces.map((item) => (
                                            <a
                                                key={item.url}
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.icon} alt={`${item.name} logo`} className="h-4 w-4 rounded-sm object-contain" loading="lazy" />
                                                <span>{item.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {row.status === 'live' && row.distributionTxs && row.distributionTxs.length > 0 && (
                                    <div>
                                        <div className={`${STAT_CAPTION_CLASS} mb-1`}>Distribution ledger</div>
                                        <ul className="space-y-1.5">
                                            {row.distributionTxs.map((tx) => (
                                                <li key={tx.tx}>
                                                    <a
                                                        href={`https://scan.coredao.org/tx/${tx.tx}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-black/25 px-2 py-1 transition hover:border-teal-400/40 hover:text-white"
                                                    >
                                                        <span>{tx.label}</span>
                                                        <span className="text-[10px] uppercase tracking-[0.24em] text-teal-300">View</span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className={`flex flex-wrap items-center gap-3 ${STAT_CAPTION_CLASS}`}>
                                    {row.status === 'live' ? (
                                        <>
                                            <span>Network {row.networkLabel ?? 'Core'}</span>
                                            <span>Distributions {row.distributionTxs?.length ?? 0}</span>
                                        </>
                                    ) : (
                                        <span>Max raise {row.maxRaise ?? '—'}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function MobileContractSection({ row }: { row: MintTableRow }) {
    const hasAddress = row.status === 'live' && !!row.address;
    const fallbackNetworks = row.networkLabel || row.networkIcon ? [{ label: row.networkLabel ?? '—', icon: row.networkIcon }] : [];
    const networks = row.networks && row.networks.length > 0 ? row.networks : fallbackNetworks;
    const { copied, handleCopy } = useCopyToClipboard(row.address);
    if (!hasAddress && networks.length === 0) {
        return null;
    }
    const explorerUrl = hasAddress ? getExplorerUrl(row) : null;
    const displayAddress = row.address ? formatAddressPreview(row.address) : '';
    const networkLabelText = row.networkLabel || networks.map((network) => network.label).join(' • ') || '—';

    return (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            {hasAddress && (
                <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-white/65">
                    <span className="truncate" title={row.address}>
                        {displayAddress}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {explorerUrl && (
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-white/15 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white/60 transition hover:border-teal-400/40 hover:text-white"
                            >
                                View
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`rounded-md p-0.5 transition ${copied ? 'text-teal-300' : 'text-white/45 hover:text-white'}`}
                            aria-label={copied ? 'Copied address' : 'Copy contract address'}
                            title={copied ? 'Copied!' : 'Copy address'}
                        >
                            <CopyIcon copied={copied} />
                        </button>
                    </div>
                </div>
            )}
            {networks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <NetworkStack networks={networks} size="sm" />
                    <div className="flex flex-col text-[10px] text-white/65">
                        <span className="text-[11px] font-medium text-white/85">{networkLabelText}</span>
                        <span className={`${STAT_CAPTION_CLASS} text-white/40`}>Networks</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function useCopyToClipboard(value?: string) {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const handleCopy = useCallback(async () => {
        if (!value) return;
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            } else if (typeof document !== 'undefined') {
                const textarea = document.createElement('textarea');
                textarea.value = value;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), 1500);
        } catch (error) {
            console.error('Failed to copy value', error);
        }
    }, [value]);

    return { copied, handleCopy };
}

function buildMobileHighlights(row: MintTableRow) {
    if (row.status === 'live') {
        return [
            { label: 'Launch ARR', value: formatPercent(row.apr) },
            { label: 'Supply', value: formatSupply(row.supply, row.targetSupply) },
            { label: 'Distributions', value: `${row.distributionTxs?.length ?? 0}` },
            { label: 'Max Raise', value: row.maxRaise ?? '-' },
        ];
    }
    const highlights = [{ label: 'Launch APR', value: formatPercent(row.apr) }];
    if (row.unit && row.showUnitInfo !== false) {
        highlights.push({ label: 'Unit #', value: row.unit });
    }
    highlights.push(
        { label: 'Valuation', value: row.valuation ?? 'TBC' },
        { label: 'Max Raise', value: row.maxRaise ?? '-' },
    );
    return highlights;
}

function formatAddressPreview(address: string | undefined) {
    if (!address) return '';
    if (address.length <= 8) return address;
    const prefix = address.slice(0, 5);
    const suffix = address.slice(-3);
    return `${prefix}...${suffix}`;
}

function NetworkStack({ networks, size = 'md' }: { networks: NetworkMeta[]; size?: NetworkStackSize }) {
    if (!networks || networks.length === 0) return null;
    const wrapperClass =
        size === 'sm'
            ? 'flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]'
            : 'flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]';
    const overlapClass = size === 'sm' ? '-ml-2.5 ring-2 ring-[#0c111a]' : '-ml-3 ring-2 ring-[#0c111a]';
    const extraBadgeClass =
        size === 'sm'
            ? '-ml-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70'
            : '-ml-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70';
    const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

    return (
        <div className="flex items-center">
            {networks.slice(0, 2).map((network, index) => (
                <span key={`${network.label}-${index}`} className={`${wrapperClass} ${index > 0 ? overlapClass : ''}`} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {network.icon ? (
                        <img src={network.icon} alt={`${network.label} icon`} className={iconSize} loading="lazy" />
                    ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                            {network.label.slice(0, 3)}
                        </span>
                    )}
                </span>
            ))}
            {networks.length > 2 && <span className={extraBadgeClass}>+{networks.length - 2}</span>}
        </div>
    );
}

function getExplorerUrl(row: MintTableRow) {
    if (!row.address) return null;
    const network = row.networkLabel?.toLowerCase();
    if (network === 'core') {
        return `https://scan.coredao.org/address/${row.address}`;
    }
    if (network && (network.includes('bnb') || network.includes('binance') || network.includes('bsc'))) {
        return `https://bscscan.com/address/${row.address}`;
    }
    return `https://etherscan.io/address/${row.address}`;
}

function CopyIcon({ copied }: { copied: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3.5 w-3.5 ${copied ? 'text-teal-300' : 'text-current'}`}
            aria-hidden="true"
        >
            <path
                d="M9 9V5.5A1.5 1.5 0 0 1 10.5 4h7A1.5 1.5 0 0 1 19 5.5v7A1.5 1.5 0 0 1 17.5 14H14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect x="5" y="9" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function formatPercent(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '--';
    const pct = value * 100;
    return pct >= 10 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;
}

function formatSupply(current: number | null | undefined, target: number | null | undefined) {
    const cur = current != null ? formatNumber(current) : '--';
    if (!target) return cur;
    return `${cur} / ${formatNumber(target)}`;
}

function formatNumber(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '--';
    return value.toLocaleString();
}
