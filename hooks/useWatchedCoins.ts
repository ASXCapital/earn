"use client";
import { useEffect, useState, useCallback } from 'react';
import type { WatchedCoinMeta } from '@/data/coins';
import { safeJson } from '@/lib/safeFetch';

export interface UseCoinsResult { coins: WatchedCoinMeta[] | null; error: string | null; loading: boolean; refresh: () => void }

export function useWatchedCoins(lazy = true): UseCoinsResult {
  const [coins, setCoins] = useState<WatchedCoinMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce(n => n + 1), []);
  useEffect(() => {
    if (lazy === false || nonce > 0 || coins === null) {
      let cancelled = false;
      (async () => {
        try {
          setError(null);
          const json = await safeJson<{ coins: WatchedCoinMeta[]; error?: string }>("/api/coins", { timeoutMs: 5000, retries: 1, cacheSeconds: 300 });
          if (!cancelled) setCoins(json.coins || []);
        } catch (e: any) {
          if (!cancelled) setError(e?.message || 'failed');
        }
      })();
      return () => { cancelled = true; };
    }
  }, [nonce, lazy, coins]);
  return { coins, error, loading: coins === null && error === null, refresh };
}
