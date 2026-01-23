"use client";
import { useEffect, useState, type ReactNode } from 'react';
import { getName, getSymbol } from './coreRpc';
import InvestorOverview from './InvestorOverview';
import InvestorOverviewFJC from './InvestorOverviewFJC';
import { CollectionAddress } from './CollectionAddress';
import { RwaHero } from './RwaHero';
import type { CollectionConfig } from './types';

type MarketplaceLinkInfo = {
    name: string;
    url: string;
    icon: string;
};

const COLLECTIONS: (CollectionConfig & { arr: number; supply: number; marketplaces: MarketplaceLinkInfo[] })[] = [
    {
        address: '0x649edd9af91646348aa4ba197d71eb05b9546d5a',
        standard: 'ERC721',
        name: 'Franklin Jefferson Candlelight',
        symbol: 'FJC',
        description: 'Franklin Jefferson Candlelight NFT',
        arr: 0.075,
        supply: 3000,
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
    },
    {
        address: '0x8a747b5797b3164a64759a3d77f5a0f4e758283b',
        standard: 'ERC721',
        name: 'Mountain View Apartments',
        symbol: 'MVA',
        description: 'Mountain View Apartments NFT',
        arr: 0.084,
        supply: 5000,
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
    },
];

function normalizeName(value: string | undefined, fallback: string | undefined) {
    const trimmed = value?.trim();
    if (!trimmed) return fallback;
    const sanitized = trimmed.replace(/\u2026/g, '...');
    const lower = sanitized.toLowerCase();
    if (lower === 'loading' || lower === 'loading...') return fallback;
    return trimmed;
}

async function fetchCollectionMeta(c: CollectionConfig & { supply: number; arr: number; marketplaces: MarketplaceLinkInfo[] }) {
    // Only attempt name/symbol; supply is fixed.
    try {
        const [name, symbol] = await Promise.all([
            getName(c.address).catch(() => undefined),
            getSymbol(c.address).catch(() => undefined),
        ]);
        return {
            ...c,
            name: normalizeName(name, c.name),
            symbol: typeof symbol === 'string' && symbol.trim().length ? symbol.trim() : c.symbol,
        } as typeof c;
    } catch { return { ...c } as any; }
}

function formatNumber(v: any): string {
    if (v === undefined || v === null || v === '') return '—';
    const num = Number(v);
    if (Number.isNaN(num)) return String(v);
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toLocaleString();
}

export default function NftDashboard() {
    const [metas, setMetas] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await Promise.all(COLLECTIONS.map(fetchCollectionMeta));
                if (!cancelled) setMetas(data);
            } catch (e: any) {
                if (!cancelled) { setError(e?.message || 'Failed to load collections'); setMetas([]); }
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const loading = metas === null;

    return (
        <div className="space-y-8">
            <RwaHero />
            <div className="grid gap-6 lg:grid-cols-2">
                {loading && (
                    <div className="col-span-full animate-pulse space-y-4">
                        <div className="h-6 w-48 bg-white/10 rounded" />
                        <div className="grid gap-6 lg:grid-cols-2">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="card p-6 space-y-4">
                                    <div className="h-5 w-32 bg-white/10 rounded" />
                                    <div className="grid grid-cols-3 gap-3">
                                        {Array.from({ length: 6 }).map((_, j) => <div key={j} className="h-10 bg-white/5 rounded" />)}
                                    </div>
                                    <div className="h-32 bg-white/5 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {!loading && metas && metas.length > 0 && metas.map(m => (
                    <div key={m.address} className="card p-5 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-medium tracking-tight">{m.name || 'Collection'} <span className="text-white/40 text-xs align-middle">{m.symbol}</span></h3>
                                <CollectionAddress address={m.address} />
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-white/60">Standard</div>
                                <div className="text-base font-medium text-teal-300">{m.standard}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <MiniStat label="Total Supply" value={m.supply.toLocaleString()} />
                            <MiniStat label="ARR" value={(m.arr * 100).toFixed(1) + '%'} />
                            <MiniStat label="Marketplaces" value={<MarketplaceLinks items={(m as any).marketplaces} />} />
                            <MiniStat label="ASX Distributed" value={m.address.toLowerCase() === '0x649edd9af91646348aa4ba197d71eb05b9546d5a' ? '11,957.55' : '10,495.43'} />
                            <MiniStat label="Distributions" value={m.address.toLowerCase() === '0x649edd9af91646348aa4ba197d71eb05b9546d5a' ? '5' : '7'} />
                        </div>
                        {m.address.toLowerCase() === '0x8a747b5797b3164a64759a3d77f5a0f4e758283b' ? (
                            <InvestorOverview />
                        ) : (
                            <InvestorOverviewFJC />
                        )}
                    </div>
                ))}
                {!loading && metas && metas.length === 0 && !error && (
                    <div className="col-span-full card p-6 text-sm text-white/60">No collections.</div>
                )}
                {!loading && error && (
                    <div className="col-span-full card p-6 text-sm text-red-400">{error}</div>
                )}
            </div>
        </div>
    );
}

function StatTile({ label, value }: { label: string; value: any }) {
    return (
        <div className="card p-4 flex flex-col gap-1">
            <div className="text-2xs tracking-tight text-white/50">{label}</div>
            <div className="text-lg font-medium text-white/90">{value}</div>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex flex-col gap-0.5 rounded-md bg-white/[0.04] border border-white/10 px-2 py-1">
            <span className="text-white/40 text-3xs tracking-tight">{label}</span>
            <ValueContainer>{value}</ValueContainer>
        </div>
    );
}

function ValueContainer({ children }: { children: ReactNode }) {
    if (typeof children === 'string' || typeof children === 'number') {
        return <span className="text-white/85 font-medium">{children}</span>;
    }
    return <div className="text-white/85 font-medium flex flex-col gap-1">{children}</div>;
}

function MarketplaceLinks({ items }: { items?: MarketplaceLinkInfo[] }) {
    if (!items || items.length === 0) return <span className="text-white/35">Add URL</span>;
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {items.map((item) => (
                <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-white/80 transition hover:border-teal-400/50 hover:text-white"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.icon} alt={`${item.name} logo`} className="h-4 w-4 rounded-sm object-contain" loading="lazy" />
                    <span>{item.name}</span>
                </a>
            ))}
        </div>
    );
}
