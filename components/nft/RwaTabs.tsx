"use client";
import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { YieldIntro } from '@/components/nft/YieldIntro';

// Lazy load dashboard only when its tab is activated to cut initial payload
const NftDashboard = dynamic(() => import('@/components/nft/Dashboard'), {
    ssr: true,
    loading: () => (
        <div className="mt-8 animate-pulse space-y-4">
            <div className="h-8 w-40 rounded-md bg-white/10" />
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
    )
});

interface TabDef { key: string; label: string; }
const TABS: TabDef[] = [
    { key: 'mint', label: 'MINT' },
    { key: 'overview', label: 'Overivew' },
];

export function RwaTabs() {
    const [active, setActive] = useState<string>('mint');
    const onSelect = useCallback((k: string) => setActive(k), []);

    // Prefetch dashboard after first paint if user likely to click soon (small delay)
    useEffect(() => {
        const id = setTimeout(() => {
            if (active === 'mint') {
                // Trigger dynamic import in background
                import('@/components/nft/Dashboard');
            }
        }, 2000);
        return () => clearTimeout(id);
    }, [active]);

    return (
        <div className="space-y-8">
            <TabBar tabs={TABS} active={active} onSelect={onSelect} />
            <div>
                {active === 'mint' && (
                    <div className="space-y-10" key="mint">
                        <YieldIntro />
                    </div>
                )}
                {active === 'overview' && (
                    <div key="overview">
                        <NftDashboard />
                    </div>
                )}
            </div>
        </div>
    );
}

function TabBar({ tabs, active, onSelect }: { tabs: TabDef[]; active: string; onSelect: (k: string) => void }) {
    return (
        <div className="relative overflow-x-auto">
            <div role="tablist" className="flex gap-2 rounded-lg bg-white/[0.04] p-1 border border-white/10 backdrop-blur-sm">
                {tabs.map(t => {
                    const is = t.key === active;
                    return (
                        <button
                            key={t.key}
                            role="tab"
                            {...(is ? { 'aria-selected': 'true' } : {})}
                            data-state={is ? 'active' : 'inactive'}
                            onClick={() => onSelect(t.key)}
                            className={"relative px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 ring-teal-400/60 " +
                                (is ? 'bg-gradient-to-br from-teal-500/60 to-teal-600/60 text-white shadow shadow-teal-900/40' : 'text-white/60 hover:text-white hover:bg-white/10')}
                        >
                            {t.label}
                            {is && <span aria-hidden className="absolute inset-x-2 -bottom-[3px] h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default RwaTabs;
