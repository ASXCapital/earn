"use client";

import { useEffect, useState, useRef } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { core } from '@/lib/thirdweb';

// Lightweight client-side RPC (no secret env needed)
const CORE_RPC = (core as any)?.rpcUrls?.default?.http?.[0] || 'https://rpc.ankr.com/core';

async function rpc(method: string, params: any[]) {
    const res = await fetch(CORE_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
    });
    const json = await res.json().catch(() => ({}));
    if (json.error) throw new Error(json.error.message || 'rpc error');
    return json.result;
}

async function fetchOwned(contract: string, owner: string): Promise<number> {
    const selector = '0x70a08231'; // balanceOf(address)
    const data = selector + owner.replace(/^0x/, '').padStart(64, '0');
    const result = await rpc('eth_call', [{ to: contract, data }, 'latest']);
    if (typeof result === 'string') return parseInt(result, 16) || 0;
    return 0;
}

async function fetchOwnedWithRetry(contract: string, owner: string, attempts = 3): Promise<number> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fetchOwned(contract, owner);
        } catch (e: any) {
            lastErr = e;
            await new Promise(r => setTimeout(r, 150 * (i + 1))); // incremental backoff
        }
    }
    throw lastErr;
}

export function OwnedCount({ address }: { address: string }) {
    const account = useActiveAccount();
    const [owned, setOwned] = useState<number | null>(null);
    const [error, setError] = useState(false);
    const timerRef = useRef<any>(null);

    // clear any timer on unmount
    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    useEffect(() => {
        if (!account) { setOwned(null); return; }
        let active = true;
        setError(false);
        // keep previous owned value while refetching for smoother UX
        (async () => {
            try {
                const v = await fetchOwnedWithRetry(address, account.address, 3);
                if (active) setOwned(v);
            } catch {
                if (active) {
                    setError(true);
                    // schedule a silent retry in 3s
                    timerRef.current = setTimeout(() => {
                        if (!active) return;
                        setError(false);
                        fetchOwnedWithRetry(address, account.address, 3)
                            .then(v => { if (active) setOwned(v); })
                            .catch(() => { /* leave error */ });
                    }, 3000);
                }
            }
        })();
        return () => { active = false; };
    }, [address, account]);

    if (!account) return <span className="text-white/40">—</span>;
    if (owned === null) return <span className="text-white/40 animate-pulse">…</span>;
    // If an error occurred but we have a cached value, still show it; if no value yet fallback to dash
    if (error && owned === null) return <span className="text-white/40">—</span>;
    return <span>{owned.toLocaleString()}</span>;
}

export default OwnedCount;