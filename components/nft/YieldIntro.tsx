"use client";

import { useState, useMemo, useRef, useCallback } from 'react';
import LegalTile from './LegalTile';

// Simple deterministic projection (non-compounded vs compounded annually/monthly)
interface Point { year: number; value: number; }

// Projection model:
// Non-compound: value_t = principal + payout * t (principal plus cumulative distributions kept in cash)
// Compound: each year's payout buys additional fractional NFTs at constant floor price F.
// NFTs_t = (1 + payout/F)^t ; value_t = F * (1 + payout/F)^t
function project({ floorPrice, payout, years, compound }: { floorPrice: number; payout: number; years: number; compound: boolean; }): Point[] {
    const pts: Point[] = [];
    for (let y = 0; y <= years; y++) {
        let value: number;
        if (compound) {
            const growth = Math.pow(1 + (payout / floorPrice), y);
            value = floorPrice * growth;
        } else {
            value = floorPrice + payout * y; // principal + cumulative distributions
        }
        pts.push({ year: y, value });
    }
    return pts;
}

export function YieldIntro() {
    const [floor, setFloor] = useState(7.5); // default assumed purchase price
    const [compound, setCompound] = useState(true);
    const [years, setYears] = useState(10);
    const [qty, setQty] = useState(1);

    const aprLow = (0.75 / floor) * 100;
    const aprHigh = (0.85 / floor) * 100;

    const ptsLow = useMemo(() => project({ floorPrice: floor * qty, payout: 0.75 * qty, years, compound }), [floor, years, compound, qty]);
    const ptsHigh = useMemo(() => project({ floorPrice: floor * qty, payout: 0.85 * qty, years, compound }), [floor, years, compound, qty]);

    // Chart scaling (normalize min->0, max->100) so small differences still visible.
    const maxY = Math.max(ptsHigh[ptsHigh.length - 1].value, ptsLow[ptsLow.length - 1].value, floor);
    const minY = Math.min(floor, ptsLow[0].value);
    const rangeY = Math.max(0.0001, maxY - minY);
    const yPct = (v: number) => 100 - ((v - minY) / rangeY) * 100; // invert for SVG
    const pathFor = (pts: Point[]) => pts.map((p, i) => `${(p.year / years) * 100},${yPct(p.value).toFixed(3)}`).join(' ');

    // Tooltip state
    const [hoverYear, setHoverYear] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const onMove = useCallback((e: React.MouseEvent) => {
        const el = svgRef.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left; const rel = x / rect.width; const yr = Math.round(rel * years);
        if (yr >= 0 && yr <= years) setHoverYear(yr);
    }, [years]);
    const onLeave = useCallback(() => setHoverYear(null), []);

    const hoverLow = hoverYear != null ? ptsLow.find(p => p.year === hoverYear) : null;
    const hoverHigh = hoverYear != null ? ptsHigh.find(p => p.year === hoverYear) : null;

    return (
        <div className="space-y-10">
            {/* HERO */}
            <section className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-6 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_25%_25%,white,transparent)]" />
                <div className="relative space-y-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug">ASX RWA NFTs provide exposure to US multifamily rental income</h2>
                        <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl leading-relaxed">A professionally structured, on‑chain instrument offering pro‑rata access to a targeted annual cash distribution sourced from net apartment rental operations—delivered via a secured loan & promissory note framework.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-4 items-stretch">
                        <HeroStat label="Total ASX Distributed" value="1,999.13" image="/images/nft/B2.png" />
                        <HeroStat label="Distributions Made" value="2" image="/images/nft/Vinyl.png" />
                        <HeroStat label="Aggregate Supply" value="8,000" image="/images/nft/Garden.png" />
                        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 flex items-stretch"><LegalTile compact /></div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <DistMenu
                            code="ASXRWA001"
                            items={[
                                { label: 'Mint Refund', tx: '0xb297a8ac9fd4202e7b308a118624d5097a7c768ab2e7088309abbb7c94016369' },
                                { label: 'Distribution #1', tx: '0x67ca14b93e139289570481e7978928e16f275e85211ecf0d46d416bac1dc12ca' },
                                { label: 'Distribution #2', tx: '0x0d54db5f939f4d46a368502fdc7829cc9a62811bb7d546a620fb343d54667f69' },
                            ]}
                        />
                        <DistMenu
                            code="ASXRWA002"
                            items={[
                                // Placeholder entries – update when distributions occur
                                { label: 'No distributions yet', tx: '' },
                            ]}
                        />
                    </div>
                    <div className="text-[12px] text-white/45 max-w-4xl leading-relaxed">
                        Target figures are indicative and subject to change with occupancy, operating costs, timing and other variables. NFTs convey no equity, governance, redemption right or direct real estate ownership; economic value is derived solely from participation in the distribution mechanism. Review Terms & Risk Factors before allocating capital.
                    </div>
                </div>
            </section>

            {/* INTERACTIVE MODEL */}
            <section className="card p-6 space-y-6">
                <header className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-tight">Interactive Distribution & Compounding Model</h3>
                    <p className="text-xs text-white/55 max-w-xl">Adjust assumptions to view illustrative cumulative value paths (low / high target bands) with or without reinvestment. Not a projection.</p>
                </header>
                {/* Controls */}
                <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                        <div className="flex-1 min-w-[260px] space-y-4">
                            <div>
                                <label className="text-[11px] uppercase tracking-wide text-white/50 font-medium">Assumed Purchase Price (Floor)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="range" min={2} max={20} step={0.5} value={floor} onChange={e => setFloor(parseFloat(e.target.value))} className="w-full" aria-label="Assumed purchase price" />
                                    <span className="w-16 text-right text-sm tabular-nums">${floor.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-[11px] uppercase tracking-wide text-white/50 font-medium"># NFTs</label>
                                    <input type="number" min={1} max={5000} value={qty} onChange={e => setQty(Math.min(5000, Math.max(1, parseInt(e.target.value) || 1)))} className="w-24 bg-white/5 rounded px-2 py-1 text-sm" title="Number of NFTs" aria-label="Number of NFTs" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-[11px] uppercase tracking-wide text-white/50 font-medium">Years</label>
                                    <input type="number" min={1} max={15} value={years} onChange={e => setYears(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))} className="w-20 bg-white/5 rounded px-2 py-1 text-sm" title="Projection years" aria-label="Projection years" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-[11px] uppercase tracking-wide text-white/50 font-medium">Compound</label>
                                    <button onClick={() => setCompound(v => !v)} className={"px-3 py-1 rounded-md text-sm font-medium border transition-colors " + (compound ? 'bg-teal-600/60 border-teal-500 text-white' : 'bg-white/5 border-white/15 text-white/70 hover:text-white')}>{compound ? 'ON' : 'OFF'}</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 min-w-[320px]">
                            <InlineStat label="Ref. Entry" value={`$${floor.toFixed(2)}`} />
                            <InlineStat label="Band" value="$0.75–$0.85" />
                            <InlineStat label="Yield" value={`${aprLow.toFixed(1)}%–${aprHigh.toFixed(1)}%`} />
                            <InlineStat label="Mode" value={compound ? 'Compounding' : 'Simple'} />
                            <InlineStat label="Years" value={years} />
                            <InlineStat label="NFTs" value={qty} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Metric label="APR Range" value={`${aprLow.toFixed(1)}% – ${aprHigh.toFixed(1)}%`} />
                        <Metric label="Annual $ / NFT" value="$0.75 – $0.85" />
                        <Metric label="Annual $ (Total)" value={`$${(0.75 * qty).toFixed(2)} – $${(0.85 * qty).toFixed(2)}`} />
                        <Metric label="Projection (Low)" value={`$${ptsLow[ptsLow.length - 1].value.toFixed(2)}`} />
                        <Metric label="Projection (High)" value={`$${ptsHigh[ptsHigh.length - 1].value.toFixed(2)}`} />
                    </div>
                </div>
                <div className="h-56 relative">
                    <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full select-none"
                        onMouseMove={onMove} onMouseLeave={onLeave} role="img" aria-label="Projected value over time (low/high scenarios)">
                        <defs>
                            <linearGradient id="gLow" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.6} />
                                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gHigh" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {Array.from({ length: years + 1 }).map((_, i) => (
                            <line key={'v' + i} x1={(i / years) * 100} x2={(i / years) * 100} y1={0} y2={100} stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
                        ))}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <line key={'h' + i} x1={0} x2={100} y1={(i / 4) * 100} y2={(i / 4) * 100} stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
                        ))}
                        <polyline fill="none" stroke="#0ea5e9" strokeWidth={1.6} vectorEffect="non-scaling-stroke" points={pathFor(ptsLow)} />
                        <polyline fill="none" stroke="#10b981" strokeWidth={1.6} vectorEffect="non-scaling-stroke" points={pathFor(ptsHigh)} />
                        {Array.from({ length: years + 1 }).map((_, i) => (
                            <text key={i} x={(i / years) * 100} y={100} dy={-1} fontSize={4} textAnchor="middle" fill="rgba(255,255,255,0.5)">{i}</text>
                        ))}
                        {hoverYear != null && (
                            <g>
                                <line x1={(hoverYear / years) * 100} x2={(hoverYear / years) * 100} y1={0} y2={100} stroke="rgba(255,255,255,0.25)" strokeWidth={0.6} />
                                {hoverLow && <circle cx={(hoverYear / years) * 100} cy={yPct(hoverLow.value)} r={1.8} fill="#0ea5e9" stroke="#fff" strokeWidth={0.4} />}
                                {hoverHigh && <circle cx={(hoverYear / years) * 100} cy={yPct(hoverHigh.value)} r={1.8} fill="#10b981" stroke="#fff" strokeWidth={0.4} />}
                            </g>
                        )}
                    </svg>
                    <div className="absolute top-2 right-2 flex gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-cyan-300"><span className="w-2 h-2 bg-cyan-400 rounded-full" />Low</span>
                        <span className="flex items-center gap-1 text-emerald-300"><span className="w-2 h-2 bg-emerald-400 rounded-full" />High</span>
                    </div>
                </div>
                <p className="text-[11px] leading-relaxed text-white/40">Illustrative only. Constant target band; reinvestment assumes purchases at input price. Does not model slippage, premiums/discounts, tax or execution costs. Refer to Terms & Risk Factors.</p>
            </section>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-md bg-white/[0.04] border border-white/10 p-3 flex flex-col gap-1 min-w-[150px] flex-[1_1_160px]">
            <div className="text-[10px] uppercase tracking-wide text-white/45 font-medium">{label}</div>
            <div className="text-sm font-semibold text-white/90 tabular-nums">{value}</div>
        </div>
    );
}

function HeroStat({ label, value, image }: { label: string; value: React.ReactNode; image?: string }) {
    return (
        <div className={"relative rounded-lg border border-white/10 bg-white/[0.045] px-4 py-2 min-w-[150px] " + (image ? 'pr-16' : '')}>
            <div className="flex flex-col leading-tight gap-0.5">
                <span className="text-[10px] uppercase tracking-wide text-white/55 font-medium">{label}</span>
                <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
            </div>
            {image && (
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="w-14 h-14 object-contain rounded-md shadow shadow-black/40" loading="lazy" />
                </div>
            )}
        </div>
    );
}

// Distribution dropdown menu component
function DistMenu({ code, items }: { code: string; items: { label: string; tx: string }[] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-lg border border-white/10 bg-white/[0.035] overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2 text-left text-sm font-medium tracking-wide hover:bg-white/5 transition-colors"
                aria-controls={`dist-${code}`}
            >
                <span className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-teal-600/20 text-teal-300 text-[11px] font-semibold">{code.slice(-3)}</span>
                    {code} Distributions
                </span>
                <svg className={"h-4 w-4 text-white/60 transition-transform " + (open ? 'rotate-180' : '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {open && (
                <ul id={`dist-${code}`} className="divide-y divide-white/5 text-sm" aria-label={`${code} distribution transactions`}>
                    {items.map((it, idx) => (
                        <li key={idx} className="flex">
                            {it.tx ? (
                                <a href={`https://scan.coredao.org/tx/${it.tx}`} target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-2 hover:bg-white/5 flex items-center justify-between gap-3">
                                    <span className="text-white/75">{it.label}</span>
                                    <span className="text-[10px] uppercase tracking-wide text-teal-300">View Tx</span>
                                </a>
                            ) : (
                                <div className="flex-1 px-4 py-2 text-white/40">{it.label}</div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function InlineStat({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wide text-white/40">{label}</span>
            <span className="text-xs font-medium text-white/85 tabular-nums">{value}</span>
        </div>
    );
}
