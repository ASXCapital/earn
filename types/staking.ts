// Central staking-related TypeScript types (previously inline in the large staking page)

export type SupportedChainKey = 'bsc' | 'core';

export interface LpMeta {
    token0: string; token1: string;
    reserve0: string; reserve1: string;
    totalSupply: string;
    dec0: number; dec1: number;
    sym0: string; sym1: string;
}

export interface PoolRawState {
    loading: boolean;
    error?: string;
    // token meta
    symbol?: string;
    decimals?: number;
    stakingTokenAddress?: string;
    // raw on-chain numeric values (bigint serialised as string for JSON safety if ever persisted)
    totalStaked?: bigint; // total staked (raw token units)
    userStaked?: bigint; // user staked (raw token units)
    walletBalance?: bigint; // unstaked wallet balance
    claimable?: bigint; // total claimable reward (assumed ASX)
    rewardRateTotal?: bigint; // aggregated reward rate (wei / sec)
    // derived metrics
    tvlUsd?: number;
    aprPct?: number;
    // lp specific
    lp?: LpMeta;
    // instrumentation
    debug?: string[];
    lastUpdated?: string;
}

export interface PoolComputedView {
    loading: boolean;
    error?: string;
    symbol?: string;
    decimals?: number;
    stakingTokenAddress?: string;
    totalStakedDisplay: string;
    userStakedDisplay: string;
    userStakedExact?: string; // non-rounded exact decimal string (no thousands separators)
    walletBalanceDisplay: string;
    claimableDisplay: string;
    aprDisplay: string;
    tvlDisplay: string;
    tvlUsd?: number;
    aprPct?: number;
    lp?: LpMeta;
    debug?: string[];
}

export interface UseStakingPoolsResult {
    states: Record<string, PoolRawState>;
    view: Record<string, PoolComputedView>;
    refresh(): void;
    loadingAny: boolean;
}
