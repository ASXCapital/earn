"use client";
import { useState } from 'react';

export type EcosystemView = 'contracts' | 'prices' | 'updates';

interface Props {
  contracts: React.ReactNode;
  prices: React.ReactNode;
  updates: React.ReactNode;
  initial?: EcosystemView;
}

export function EcosystemSwitcher({ contracts, prices, updates, initial = 'prices' }: Props) {
  const [view, setView] = useState<EcosystemView>(initial);

  const tabs: { key: EcosystemView; label: string; desc?: string }[] = [
    { key: 'prices', label: 'ASX DEX Prices' },
    { key: 'contracts', label: 'Contracts' },
    { key: 'updates', label: 'Updates / News' }
  ];

  return (
    <div className="space-y-6">
      <nav className="inline-flex overflow-hidden rounded-md border border-white/10 bg-white/[0.04] backdrop-blur-sm ring-1 ring-inset ring-white/5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`px-4 py-2 text-[11px] font-semibold tracking-wide transition-colors border-r border-white/10 last:border-r-0 ${view === t.key
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div>
        {view === 'contracts' && contracts}
        {view === 'prices' && prices}
        {view === 'updates' && updates}
      </div>
    </div>
  );
}

// Updates preview will be provided server-side if needed for richer markup; keeping this file client-only for tab state.
