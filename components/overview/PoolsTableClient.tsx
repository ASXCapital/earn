"use client";
import React from 'react';
import type { PoolRowProps } from './PoolsTableTypes';

function formatNumber(n?: number, opts: Intl.NumberFormatOptions = {}) {
    if (n == null || isNaN(n)) return "-";
    const frac = n < 0.01 ? 6 : n < 1 ? 4 : 4;
    return Intl.NumberFormat("en-US", { maximumFractionDigits: frac, minimumFractionDigits: n < 1 ? Math.min(4, frac) : 2, ...opts }).format(n);
}
function formatUSD(n?: number) {
    if (n == null || isNaN(n)) return "-";
    const max = n < 1 ? 2 : 0;
    return Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: max, minimumFractionDigits: 0 }).format(n);
}

export type SortKey = 'pair' | 'price' | 'liquidity';
function sortRows(rows: PoolRowProps[], key: SortKey, dir: 'asc' | 'desc'): PoolRowProps[] {
    const mul = dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
        if (key === 'pair') {
            const ap = `${a.baseSymbol}/${a.quoteSymbol}`.localeCompare(`${b.baseSymbol}/${b.quoteSymbol}`);
            return ap * mul;
        }
        if (key === 'price') {
            const av = a.price ?? -Infinity; const bv = b.price ?? -Infinity;
            if (av === bv) return 0; return av < bv ? -1 * mul : 1 * mul;
        }
        const al = a.reserveUSD ?? -Infinity; const bl = b.reserveUSD ?? -Infinity;
        if (al === bl) return 0; return al < bl ? -1 * mul : 1 * mul;
    });
}

function HeaderButton({ label, active, dir }: { label: string; active: boolean; dir: 'asc' | 'desc'; }) {
    return (
        <span className={"inline-flex items-center gap-1 select-none cursor-pointer " + (active ? 'text-white' : 'text-white/50 hover:text-white/80')}>
            {label}
            <span className="text-[10px] leading-none">{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
        </span>
    );
}

export default function PoolsTableClient({ initialRows, updatedAt }: { initialRows: PoolRowProps[]; updatedAt: string; }) {
    const [sortKey, setSortKey] = React.useState<SortKey>('liquidity');
    const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
    const rows = React.useMemo(() => sortRows(initialRows, sortKey, sortDir), [initialRows, sortKey, sortDir]);
    function toggle(k: SortKey) {
        setSortKey(prev => {
            if (prev === k) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                return prev;
            }
            setSortDir(k === 'pair' ? 'asc' : 'desc');
            return k;
        });
    }
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold tracking-tight">Markets</h2>

            </div>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
                <table className="min-w-full text-sm">
                    <thead className="text-xs uppercase tracking-wide text-white/50 sticky top-0 backdrop-blur bg-black/30">
                        <tr className="text-left">
                            <th className="px-3 py-2 font-medium" onClick={() => toggle('pair')}><HeaderButton label="Pair" active={sortKey === 'pair'} dir={sortDir} /></th>
                            <th className="px-3 py-2 font-medium">DEX</th>
                            <th className="px-3 py-2 font-medium">Net</th>
                            <th className="px-3 py-2 font-medium" onClick={() => toggle('price')}><HeaderButton label="Price (USD)" active={sortKey === 'price'} dir={sortDir} /></th>
                            <th className="px-3 py-2 font-medium" onClick={() => toggle('liquidity')}><HeaderButton label="Liquidity" active={sortKey === 'liquidity'} dir={sortDir} /></th>
                            <th className="px-3 py-2 font-medium">Src</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr><td colSpan={6} className="px-3 py-8 text-center text-white/40">No ASX pools found.</td></tr>
                        )}
                        {rows.map(r => (
                            <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.04] transition-colors">
                                <td className="px-3 py-2 font-mono whitespace-nowrap">{r.baseSymbol}/{r.quoteSymbol}</td>
                                <td className="px-3 py-2">{r.dex || '-'}</td>
                                <td className="px-3 py-2 text-xs"><span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-medium">{r.network}</span></td>
                                <td className="px-3 py-2 font-mono tabular-nums">{formatNumber(r.price)}</td>
                                <td className="px-3 py-2 font-mono tabular-nums">{formatUSD(r.reserveUSD)}</td>
                                <td className="px-3 py-2 text-[10px] text-white/40" title={r.derivation || ''}>{r.derivation ? r.derivation.replace(/_.+/, '') : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap gap-4 items-center text-xs text-white/40">
                <span>Data: CoinGecko Onchain (BSC + CORE) ~30s cache. Sub-$100 liq hidden.</span>
                <span>Updated {new Date(updatedAt).toLocaleTimeString()}</span>
                <span>Sort: {sortKey} {sortDir}</span>
            </div>
        </div>
    );
}
