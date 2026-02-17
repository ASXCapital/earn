import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { STAKING_POOLS } from '@/data/staking';
import { priceForSymbol } from '@/lib/pricing';
import { getStakingContract, getStakedBalance, getTotalSupply, getClaimableRewards, getRewardTokens, getRewardRate, getStakingToken, getErc20Decimals, getErc20Symbol, getErc20Balance, type StakingContractType } from '@/lib/staking';
import { bsc, core, getRpcHttpUrls } from '@/lib/thirdweb';
import type { PoolRawState, PoolComputedView, SupportedChainKey, UseStakingPoolsResult } from '@/types/staking';
import { useActiveAccount } from 'thirdweb/react';

// Fallback known ASX reward token addresses (only BSC needed for LP APR currently)
const ASX_REWARD_TOKEN: Record<SupportedChainKey, string | null> = {
    bsc: '0xebd3619642d78f0c98c84f6fa9a678653fb5a99b',
    core: null,
};
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

interface Options { debug?: boolean; chainKey: SupportedChainKey; prices: any; }

const DEBUG_LIMIT = 120; // ring buffer limit per pool

export function useStakingPools({ debug, chainKey, prices }: Options): UseStakingPoolsResult {
    const account = useActiveAccount();
    const [reloadNonce, setReloadNonce] = useState(0);
    const [autoRefreshedOnConnect, setAutoRefreshedOnConnect] = useState(false);
    const [states, setStates] = useState<Record<string, PoolRawState>>({});
    const pools = useMemo(() => STAKING_POOLS.filter(p => {
        if (p.chain !== chainKey) return false;
        if ((p as any).enabled === false) return false;
        return typeof p.address === 'string' && p.address.toLowerCase() !== ZERO_ADDRESS;
    }), [chainKey]);

    // auto refresh once on connect
    const poolKeys = pools.map(p => p.key).join(',');
    useEffect(() => {
        if (account?.address && !autoRefreshedOnConnect) {
            setAutoRefreshedOnConnect(true);
            setReloadNonce(n => n + 1);
        }
    }, [account?.address, autoRefreshedOnConnect]);

    // Always perform an initial load on first mount (independent of wallet connect)
    const didInitial = useRef(false);
    useEffect(() => {
        if (!didInitial.current) {
            didInitial.current = true;
            setReloadNonce(n => n + 1);
        }
    }, []);

    // sequential loader
    useEffect(() => {
        let cancelled = false;
        (async () => {
            for (const pool of pools) {
                setStates(s => ({ ...s, [pool.key]: { loading: true, debug: debug ? ['INIT'] : undefined } }));
                const push = (msg: string) => {
                    if (!debug) return;
                    setStates(s => {
                        const cur = s[pool.key];
                        if (!cur) return s;
                        const dbg = (cur.debug || []).concat(msg).slice(-DEBUG_LIMIT);
                        return { ...s, [pool.key]: { ...cur, debug: dbg } };
                    });
                };
                (async () => {
                    try {
                        push('BEGIN ' + new Date().toISOString());
                        const wallet = account?.address;
                        const contractType = ((pool as any).contractType as StakingContractType) || 'stakingRewards';
                        const contract = getStakingContract(pool.address, pool.chain as SupportedChainKey, contractType);
                        // helpers
                        const cache = new Map<string, any>();
                        const call = async <T,>(k: string, fn: () => Promise<T>): Promise<T> => { if (cache.has(k)) return cache.get(k); const v = await fn(); cache.set(k, v); return v; };
                        const retry = async <T,>(k: string, fn: () => Promise<T>, attempts = 3): Promise<T> => {
                            for (let i = 0; i < attempts; i++) { try { return await call(k, fn); } catch (e: any) { if (i === attempts - 1) throw e; await new Promise(r => setTimeout(r, 300 * (i + 1))); } }
                            return await call(k, fn);
                        };
                        // core reads
                        let totalStaked: bigint = 0n; let userStaked: bigint = 0n; let stakingToken: string | undefined;
                        try { const ts: any = await retry('totalSupply', () => getTotalSupply(contract, contractType)); totalStaked = typeof ts === 'bigint' ? ts : BigInt(ts?.[0] ?? ts ?? 0); push('totalStaked=' + totalStaked); } catch (e: any) { push('totalSupply err ' + (e?.message || e)); }
                        if (wallet) { try { const ub: any = await getStakedBalance(contract, wallet, contractType); userStaked = typeof ub === 'bigint' ? ub : BigInt(ub?.[0] ?? ub ?? 0); push('userStaked=' + userStaked); } catch (e: any) { push('userStaked err ' + (e?.message || e)); } }
                        let rewardTokens: string[] = [];
                        try { rewardTokens = await retry('rewardTokens', () => getRewardTokens(contract, contractType)); push('rewardTokens=' + rewardTokens.length); } catch { }
                        if (!rewardTokens.length) { const fb = ASX_REWARD_TOKEN[pool.chain as SupportedChainKey]; if (fb) { rewardTokens = [fb]; push('fallbackReward'); } }
                        try { const st: any = await retry('stakingToken', () => getStakingToken(contract, contractType)); stakingToken = String(Array.isArray(st) ? st[0] : st); push('stakingToken=' + stakingToken); } catch { }
                        let decimals = 18; let symbol = '';
                        if (stakingToken) { try { decimals = await getErc20Decimals(stakingToken, pool.chain as any); } catch { } try { symbol = await getErc20Symbol(stakingToken, pool.chain as any); } catch { } }
                        // wallet balance
                        let walletBalance: bigint | undefined;
                        if (stakingToken && wallet) { try { const bal: any = await getErc20Balance(stakingToken, wallet, pool.chain as SupportedChainKey); walletBalance = typeof bal === 'bigint' ? bal : BigInt(bal?.[0] ?? bal ?? 0); } catch { } }
                        // reward rates aggregate
                        let rewardRateTotal: bigint = 0n;
                        for (const rt of rewardTokens) { try { const r: any = await getRewardRate(contract, rt, contractType, pool.chain as SupportedChainKey); const val = typeof r === 'bigint' ? r : BigInt(r?.[1] ?? r?.rewardRate ?? r ?? 0); rewardRateTotal += val; } catch { } }
                        // claimable
                        let claimable: bigint | undefined;
                        if (wallet) {
                            try {
                                const list: any = await getClaimableRewards(contract, wallet, contractType);
                                if (typeof list === 'bigint') {
                                    claimable = list;
                                } else {
                                    let tot = 0n;
                                    if (Array.isArray(list)) {
                                        for (const item of list) {
                                            try {
                                                const amt = typeof item === 'object' ? (item.amount ?? item[1]) : (Array.isArray(item) ? item[1] : 0);
                                                tot += BigInt(amt || 0);
                                            } catch { }
                                        }
                                    }
                                    claimable = tot;
                                }
                            } catch { }
                        }
                        // LP meta (only if pool has >1 tokens)
                        let lpMeta: PoolRawState['lp'];
                        if (stakingToken && pool.tokens.length > 1) {
                            try { lpMeta = await manualLpMeta(stakingToken, pool.chain as SupportedChainKey); if (lpMeta) push('lpMeta ' + lpMeta.sym0 + '/' + lpMeta.sym1); } catch (e: any) { push('lpMeta err ' + (e?.message || e)); }
                        }
                        // derive tvl / apr if prices present
                        let tvlUsd: number | undefined; let aprPct: number | undefined;
                        if (prices && totalStaked > 0n) {
                            ({ tvlUsd, aprPct } = deriveTvlApr({
                                totalStaked, decimals, symbol, lp: lpMeta, rewardRateTotal, prices, chainKey
                            }));
                        }
                        if (!cancelled) {
                            setStates(s => ({ ...s, [pool.key]: { loading: false, symbol: symbol || undefined, decimals, stakingTokenAddress: stakingToken, totalStaked, userStaked, walletBalance, claimable, rewardRateTotal, tvlUsd, aprPct, lp: lpMeta, debug: s[pool.key]?.debug, lastUpdated: new Date().toISOString() } }));
                        }
                    } catch (e: any) {
                        if (!cancelled) setStates(s => ({ ...s, [pool.key]: { ...(s[pool.key] || { loading: false }), loading: false, error: e?.message || String(e) } }));
                    }
                })();
            }
        })();
        return () => { cancelled = true; };
    }, [poolKeys, chainKey, reloadNonce, account?.address, debug, prices, pools]);

    // recompute tvl+apr when prices change (lightweight)
    useEffect(() => {
        // Recompute APR/TVL whenever prices arrive OR underlying pool state updates.
        // (Fix: previously only ran on price change; if prices loaded before pool data finished, APR stayed empty until manual refresh.)
        if (!prices) return;
        setStates(s => {
            let changed = false; const next = { ...s };
            for (const k of Object.keys(s)) {
                const st = s[k]; if (!st) continue; // allow computing even if still loading; harmless
                if (!st.totalStaked || st.totalStaked === 0n) continue;
                const { tvlUsd, aprPct } = deriveTvlApr({ totalStaked: st.totalStaked, decimals: st.decimals || 18, symbol: st.symbol || '', lp: st.lp, rewardRateTotal: st.rewardRateTotal || 0n, prices, chainKey });
                const needUpdate = (tvlUsd !== undefined && tvlUsd !== st.tvlUsd) || (aprPct !== undefined && aprPct !== st.aprPct);
                if (needUpdate) { next[k] = { ...st, tvlUsd, aprPct }; changed = true; }
            }
            return changed ? next : s;
        });
    }, [prices, chainKey, states]);

    const refresh = useCallback(() => setReloadNonce(n => n + 1), []);

    const view: Record<string, PoolComputedView> = {};
    for (const pool of pools) {
        const st = states[pool.key];
        if (!st) continue;
        const decimals = st.decimals || 18;
        const formatToken = (v?: bigint, frac = 2) => {
            if (v === undefined) return '—';
            try { return (Number(v) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: frac }); } catch { return '—'; }
        };
        const totalStakedDisplay = st.totalStaked !== undefined ? formatToken(st.totalStaked, 2) : (st.loading ? '…' : '—');
        const userStakedDisplay = st.userStaked !== undefined ? formatToken(st.userStaked, 4) : (st.loading ? '…' : '—');
        // Exact (non-rounded) decimal string for full precision math-safe max actions
        let userStakedExact: string | undefined;
        if (st.userStaked !== undefined) {
            const denom = BigInt(10) ** BigInt(decimals);
            const intPart = st.userStaked / denom;
            const fracPart = st.userStaked % denom;
            if (fracPart === 0n) userStakedExact = intPart.toString();
            else {
                const fracStr = fracPart.toString().padStart(decimals, '0').replace(/0+$/, '');
                userStakedExact = intPart.toString() + '.' + fracStr;
            }
        }
        const walletBalanceDisplay = st.walletBalance !== undefined ? formatToken(st.walletBalance, 4) : (st.loading ? '…' : '—');
        const claimableDisplay = st.claimable !== undefined ? ((Number(st.claimable) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' $ASX') : (st.loading ? '…' : '—');
        const aprDisplay = st.aprPct !== undefined ? st.aprPct.toFixed(2) + '%' : (st.loading ? '…' : '—');
        const tvlDisplay = st.tvlUsd !== undefined ? ('$' + st.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })) : (st.loading ? '…' : '—');
        view[pool.key] = { loading: st.loading, error: st.error, symbol: st.symbol, decimals, stakingTokenAddress: st.stakingTokenAddress, totalStakedDisplay, userStakedDisplay, userStakedExact, walletBalanceDisplay, claimableDisplay, aprDisplay, tvlDisplay, tvlUsd: st.tvlUsd, aprPct: st.aprPct, lp: st.lp, debug: st.debug };
    }

    const loadingAny = Object.values(states).some(s => s.loading);

    return { states, view, refresh, loadingAny };
}

// manual LP metadata using raw RPC for reliability
// In-memory LP metadata cache to avoid spamming RPC (non-persistent per session)
const lpCache: Record<string, { ts: number; data: PoolRawState['lp'] }> = {};
async function manualLpMeta(address: string, chain: SupportedChainKey) {
    const cacheKey = chain + ':' + address.toLowerCase();
    const now = Date.now();
    const cached = lpCache[cacheKey];
    if (cached && (now - cached.ts) < 5 * 60_000) { // 5 min cache
        return cached.data;
    }
    const rpcs = getRpcHttpUrls(chain);
    let lastErr: any;
    for (let attempt = 0; attempt < rpcs.length * 2; attempt++) {
        const rpcUrl = rpcs[attempt % rpcs.length];
        try {
            const call = async (data: string) => {
                const body = { jsonrpc: '2.0', id: Date.now(), method: 'eth_call', params: [{ to: address, data }, 'latest'] };
                const { safeFetch } = await import('@/lib/safeFetch');
                const res = await safeFetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), timeoutMs: 7_000, retries: 1 } as any);
                const j = await res.json(); if (j.error) throw new Error(j.error.message || 'rpc error'); return j.result as string;
            };
            // Sequential rather than Promise.all to lower burst rate
            const hToken0 = await call('0x0dfe1681'); // token0()
            await sleep(40);
            const hToken1 = await call('0xd21220a7'); // token1()
            await sleep(40);
            const hReserves = await call('0x0902f1ac'); // getReserves()
            await sleep(40);
            const hSupply = await call('0x18160ddd'); // totalSupply()
            const parseAddr = (hex: string) => hex && hex.length >= 66 ? '0x' + hex.slice(-40) : '0x0000000000000000000000000000000000000000';
            const token0 = parseAddr(hToken0); const token1 = parseAddr(hToken1);
            let reserve0 = 0n, reserve1 = 0n; if (hReserves && hReserves !== '0x') { const clean = hReserves.replace(/^0x/, '').padEnd(192, '0'); reserve0 = BigInt('0x' + clean.slice(0, 64)); reserve1 = BigInt('0x' + clean.slice(64, 128)); }
            const totalSupply = hSupply && hSupply !== '0x' ? BigInt(hSupply) : 0n;
            const dec0 = await getErc20Decimals(token0, chain as any).catch(() => 18); const dec1 = await getErc20Decimals(token1, chain as any).catch(() => 18);
            const sym0 = await getErc20Symbol(token0, chain as any).catch(() => 'UNK'); const sym1 = await getErc20Symbol(token1, chain as any).catch(() => 'UNK');
            const data = { token0, token1, reserve0: reserve0.toString(), reserve1: reserve1.toString(), totalSupply: totalSupply.toString(), dec0, dec1, sym0, sym1 };
            lpCache[cacheKey] = { ts: now, data };
            return data;
        } catch (e: any) {
            lastErr = e;
            const msg = (e?.message || '').toLowerCase();
            // Backoff if rate limited
            await sleep(msg.includes('limit') || msg.includes('rate') ? 400 + attempt * 150 : 120);
            continue;
        }
    }
    throw lastErr || new Error('lp meta fetch failed');
}

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

function deriveTvlApr(args: { totalStaked: bigint; decimals: number; symbol: string; lp?: PoolRawState['lp']; rewardRateTotal: bigint; prices: any; chainKey: SupportedChainKey; }): { tvlUsd?: number; aprPct?: number } {
    const { totalStaked, decimals, symbol, lp, rewardRateTotal, prices, chainKey } = args;
    let tvlUsd: number | undefined;
    if (lp) {
        // LP valuation: total pool USD * share represented by staked LP tokens (here we assume entire staking token supply equals LP token supply staked? Actually staking contract holds a portion given by totalStaked / lp.totalSupply)
        try {
            const p0 = priceForSymbol(lp.sym0, prices, chainKey); const p1 = priceForSymbol(lp.sym1, prices, chainKey);
            const amt0 = Number(lp.reserve0) / 10 ** lp.dec0; const amt1 = Number(lp.reserve1) / 10 ** lp.dec1;
            let poolUsd = 0; if (p0 != null) poolUsd += amt0 * p0; if (p1 != null) poolUsd += amt1 * p1; if (poolUsd > 0 && ((p0 == null) !== (p1 == null))) poolUsd *= 2;
            if (poolUsd > 0) {
                const share = Number(totalStaked) / Number(BigInt(lp.totalSupply));
                tvlUsd = poolUsd * share;
            }
        } catch { /* ignore */ }
    } else if (symbol) {
        const price = priceForSymbol(symbol, prices, chainKey);
        if (price != null) {
            const amount = Number(totalStaked) / 10 ** decimals;
            tvlUsd = amount * price;
        }
    }
    let aprPct: number | undefined;
    if (tvlUsd && tvlUsd > 0 && rewardRateTotal > 0n) {
        const asxPrice = priceForSymbol('ASX', prices, chainKey);
        if (asxPrice) {
            const perSec = Number(rewardRateTotal) / 1e18;
            const annualUsd = perSec * 31_536_000 * asxPrice;
            aprPct = (annualUsd / tvlUsd) * 100;
        }
    }
    return { tvlUsd, aprPct };
}
