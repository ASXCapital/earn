"use client";

import { useEffect, useMemo, useState } from 'react';

// Static logo sources (prefer local for our own token to avoid network + rate limits)
// Using Coingecko asset CDN (static images) instead of API endpoints eliminates 429 issues.
// If a logo changes, bump the query string to bust cache.
const STATIC_LOGOS: Record<string, string> = {
  ASX: '/asx_white_square1200_transparent.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png',
  WBNB: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png',
  BTCB: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png', // use BTC icon for BTCB
  SOL: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png',
};

// In-memory cache for any future dynamic fetches (currently unused, but ready if we add more)
const logoCache: Map<string, string | null> = new Map(Object.entries(STATIC_LOGOS));

interface LogoProps {
  symbol: string | string[]; // accept single or pair for LP display
}

export function TokenLogo({ symbol }: LogoProps) {
  const symbols = useMemo(() => (Array.isArray(symbol) ? symbol : [symbol]), [symbol]);
  const [urls, setUrls] = useState<(string | null)[]>(() => symbols.map(s => logoCache.get(s.toUpperCase()) ?? null));
  const depKey = symbols.join(',').toUpperCase();

  // Update if symbol list changes (rare) pulling from cache/static only
  useEffect(() => {
    setUrls(symbols.map(s => logoCache.get(s.toUpperCase()) ?? null));
  }, [symbols, depKey]);

  if (symbols.length === 2) {
    return (
      <div className="flex items-center">
        {symbols.map((s, i) => {
          const u = urls[i];
          return (
            <div key={s + i} className={`w-8 h-8 rounded-full border border-black/30 overflow-hidden bg-black flex items-center justify-center ${i === 1 ? '-ml-3' : ''}`}>
              {u ? <img src={u} alt={s} className="w-full h-full object-contain" /> : <span className="text-3xs font-medium text-black/70">{s.slice(0, 4).toUpperCase()}</span>}
            </div>
          );
        })}
      </div>
    );
  }
  const u = urls[0];
  return (
    <div className="w-8 h-8 rounded-full border border-black/30 overflow-hidden flex items-center justify-center bg-black">
      {u ? <img src={u} alt={symbols[0]} className="w-full h-full object-contain" /> : <span className="text-3xs font-medium text-black/70">{symbols[0].slice(0, 4).toUpperCase()}</span>}
    </div>
  );
}
