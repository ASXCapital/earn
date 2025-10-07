"use client";
import { useEffect, useState } from 'react';
import { getName, getSymbol } from './coreRpc';
import OwnedCount from './OwnedCount';
import InvestorOverview from './InvestorOverview';
import InvestorOverviewFJC from './InvestorOverviewFJC';
import { CollectionAddress } from './CollectionAddress';
import LegalTile from './LegalTile';
import type { CollectionConfig } from './types';
import dynamic from 'next/dynamic';

// Client-only NFT media loader (lazy to keep server render lean)
// @ts-ignore module resolution handled by Next
const NftMediaLoader = dynamic<{ contract: string; supply: number }>(
    () => import('./NftMediaLoader').then(m => ({ default: m.NftMediaLoader })),
    { ssr: false }
);

const COLLECTIONS: (CollectionConfig & { arr: number; marketplace?: string; supply: number })[] = [
    { address: '0x649edd9af91646348aa4ba197d71eb05b9546d5a', standard: 'ERC721', name: 'FJC', description: 'FJC NFT', arr: 0.075, marketplace: 'https://blockz.gg/collection/0x649edd9af91646348aa4ba197d71eb05b9546d5a/', supply: 3000 },
    { address: '0x8a747b5797b3164a64759a3d77f5a0f4e758283b', standard: 'ERC721', name: 'MVA', description: 'MVA NFT', arr: 0.084, marketplace: 'https://blockz.gg/collection/0x8a747b5797b3164a64759a3d77f5a0f4e758283b/', supply: 5000 },
];

async function fetchCollectionMeta(c: CollectionConfig & { supply: number; arr: number; marketplace?: string }) {
    // Only attempt name/symbol; supply is fixed.
    try {
        const [name, symbol] = await Promise.all([
            getName(c.address).catch(() => undefined),
            getSymbol(c.address).catch(() => undefined),
        ]);
        return { ...c, name: name || c.name, symbol: symbol || c.symbol } as any;
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
                            <MiniStat label="Marketplace" value={<MarketplaceLink url={(m as any).marketplace} />} />
                            <MiniStat label="Owned" value={<OwnedCount address={m.address} />} />
                            <MiniStat label="ASX Distributed" value={m.address.toLowerCase() === '0x649edd9af91646348aa4ba197d71eb05b9546d5a' ? '1,936.2' : '—'} />
                            <MiniStat label="Distributions" value={m.address.toLowerCase() === '0x649edd9af91646348aa4ba197d71eb05b9546d5a' ? '2' : '—'} />
                        </div>
                        {m.address.toLowerCase() === '0x8a747b5797b3164a64759a3d77f5a0f4e758283b' ? (
                            <InvestorOverview />
                        ) : (
                            <InvestorOverviewFJC />
                        )}
                        <div className="pt-2 border-t border-white/10 relative">
                            <NftMediaLoader contract={m.address} supply={m.supply} />
                        </div>
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
            <div className="text-2xs uppercase tracking-wide text-white/45">{label}</div>
            <div className="text-lg font-semibold text-white/90">{value}</div>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex flex-col gap-0.5 rounded-md bg-white/[0.04] border border-white/10 px-2 py-1">
            <span className="text-white/40 text-3xs tracking-wide uppercase">{label}</span>
            <span className="text-white/85 font-medium">{value}</span>
        </div>
    );
}

function MarketplaceLink({ url }: { url?: string }) {
    if (!url) return <span className="text-white/35">Add URL</span>;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-300 hover:text-white transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
            <span className="underline decoration-dotted">Open</span>
        </a>
    );
}
