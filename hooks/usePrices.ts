import { useEffect, useState } from 'react';
import { safeJson } from '@/lib/safeFetch';

// Polls /api/prices every 60s. Returns latest prices object (shape defined by backend route).
export function usePrices() {
    const [prices, setPrices] = useState<any>(null);
    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const json = await safeJson('/api/prices', { timeoutMs: 6000, retries: 2, cacheSeconds: 55 });
                if (active) setPrices(json);
            } catch {/* swallow to avoid UI spam */ }
        };
        load();
        const id = setInterval(load, 60_000);
        return () => { active = false; clearInterval(id); };
    }, []);
    return prices;
}
