import { useEffect, useState } from 'react';

// Polls /api/prices every 60s. Returns latest prices object (shape defined by backend route).
export function usePrices() {
    const [prices, setPrices] = useState<any>(null);
    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const res = await fetch('/api/prices');
                if (!res.ok) throw new Error('bad status ' + res.status);
                const json = await res.json();
                if (active) setPrices(json);
            } catch { /* silent */ }
        };
        load();
        const id = setInterval(load, 60_000);
        return () => { active = false; clearInterval(id); };
    }, []);
    return prices;
}
