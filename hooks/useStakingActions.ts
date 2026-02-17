import { useCallback, useState } from 'react';
import { getStakingContract, stakeTokens, withdrawTokens, claimRewards, approveErc20, getErc20Allowance, type StakingContractType } from '@/lib/staking';
import type { SupportedChainKey } from '@/types/staking';
import { useActiveAccount } from 'thirdweb/react';

interface ActionState { pending: boolean; error?: string; hash?: string; }
interface Step { id: string; label: string; status: 'idle' | 'pending' | 'done' | 'error'; txHash?: string; }
interface ActionsHook {
    stake(amount: string, decimals: number, stakingToken: string | undefined, poolAddress: string, chain: SupportedChainKey, contractType?: StakingContractType): Promise<void>;
    unstake(amount: string, decimals: number, poolAddress: string, chain: SupportedChainKey, contractType?: StakingContractType): Promise<void>;
    claim(poolAddress: string, chain: SupportedChainKey, contractType?: StakingContractType): Promise<void>;
    compound(amount: string, decimals: number, stakingToken: string | undefined, poolAddress: string, chain: SupportedChainKey, contractType?: StakingContractType): Promise<void>;
    compoundClaimable(claimableAmount: string, decimals: number, stakingToken: string | undefined, poolAddress: string, chain: SupportedChainKey, contractType?: StakingContractType): Promise<void>;
    state: Record<string, ActionState>;
    steps: Record<string, Step[]>;
    reset(key: string): void;
}

const big = (v: string, decimals: number): bigint => {
    if (!v) return 0n; const [i, f = ''] = v.split('.'); const frac = (f.padEnd(decimals, '0')).slice(0, decimals); return BigInt(i || '0') * BigInt(10) ** BigInt(decimals) + BigInt(frac || '0');
};

export function useStakingActions(refresh?: () => void): ActionsHook {
    const account = useActiveAccount();
    const [state, setState] = useState<Record<string, ActionState>>({});
    const [steps, setSteps] = useState<Record<string, Step[]>>({});
    const start = (k: string) => setState(s => ({ ...s, [k]: { pending: true } }));
    const fail = (k: string, e: any) => setState(s => ({ ...s, [k]: { pending: false, error: e?.message || String(e) } }));
    const done = (k: string, hash?: string) => setState(s => ({ ...s, [k]: { pending: false, hash } }));
    const reset = (k: string) => setState(s => { const n = { ...s }; delete n[k]; return n; });

    const withRefresh = async (fn: () => Promise<any>) => { try { const res = await fn(); setTimeout(() => refresh?.(), 900); return res; } catch (e) { throw e; } };

    const ensureAllowance = async (token: string, spender: string, needed: bigint, chain: SupportedChainKey, stepKey: string): Promise<boolean> => {
        if (!account?.address) return true;
        try {
            const curRaw: any = await getErc20Allowance(token, account.address, spender, chain).catch(() => 0n);
            let cur = typeof curRaw === 'bigint' ? curRaw : BigInt(curRaw || 0);
            if (cur >= needed) return true; // already sufficient
            setSteps(s => ({ ...s, [stepKey]: (s[stepKey] || []).map(st => st.id === 'approve' ? { ...st, status: 'pending' } : st) }));
            const max = 2n ** 255n; // large allowance
            const tx: any = await approveErc20(token, spender, max, chain, account);
            const txHash = tx?.transactionHash || tx?.hash;
            // Poll quickly (every 1s up to 20s) until allowance observed
            const maxAttempts = 20;
            for (let i = 0; i < maxAttempts; i++) {
                await new Promise(r => setTimeout(r, 1000));
                try {
                    const now: any = await getErc20Allowance(token, account.address, spender, chain).catch(() => 0n);
                    cur = typeof now === 'bigint' ? now : BigInt(now || 0);
                    if (cur >= needed) {
                        setSteps(s => ({ ...s, [stepKey]: (s[stepKey] || []).map(st => st.id === 'approve' ? { ...st, status: 'done', txHash } : st) }));
                        return true;
                    }
                } catch { /* ignore */ }
            }
            // Timed out — mark done but report not ready; caller can retry stake/poll
            setSteps(s => ({ ...s, [stepKey]: (s[stepKey] || []).map(st => st.id === 'approve' ? { ...st, status: 'done', txHash } : st) }));
            return false;
        } catch (e) { throw e; }
    };

    const stake = useCallback(async (amount: string, decimals: number, stakingToken: string | undefined, poolAddress: string, chain: SupportedChainKey, contractType: StakingContractType = 'stakingRewards') => {
        if (!account) return; const key = poolAddress + ':stake'; start(key);
        try {
            const amt = big(amount, decimals); if (amt <= 0) throw new Error('Amount must be > 0');
            setSteps(s => ({
                ...s, [key]: [
                    ...(stakingToken ? [{ id: 'approve', label: 'Approve', status: 'idle' as const }] : []),
                    { id: 'stake', label: 'Stake', status: 'idle' }
                ]
            }));
            const contract = getStakingContract(poolAddress, chain, contractType);
            if (stakingToken) {
                const ready = await ensureAllowance(stakingToken, poolAddress, amt, chain, key);
                if (!ready) {
                    // Fallback lightweight poll before proceeding
                    for (let i = 0; i < 5; i++) {
                        await new Promise(r => setTimeout(r, 1500));
                        try {
                            const now: any = await getErc20Allowance(stakingToken, account.address, poolAddress, chain).catch(() => 0n);
                            const cur = typeof now === 'bigint' ? now : BigInt(now || 0);
                            if (cur >= amt) break;
                        } catch { /* ignore */ }
                    }
                }
            }
            setSteps(s => ({ ...s, [key]: (s[key] || []).map(st => st.id === 'stake' ? { ...st, status: 'pending' } : st) }));
            const r: any = await withRefresh(() => stakeTokens(contract, amt, account, contractType));
            setSteps(s => ({ ...s, [key]: (s[key] || []).map(st => st.id === 'stake' ? { ...st, status: 'done', txHash: r?.transactionHash || r?.hash } : st) }));
            done(key, r?.transactionHash || r?.hash);
        } catch (e: any) {
            const msg = e?.message || String(e || '');
            // If allowance race, attempt one automatic retry after short wait
            if (/insufficient allowance/i.test(msg) && stakingToken) {
                try {
                    await new Promise(r => setTimeout(r, 2500));
                    const now: any = await getErc20Allowance(stakingToken, account.address, poolAddress, chain).catch(() => 0n);
                    const cur = typeof now === 'bigint' ? now : BigInt(now || 0);
                    if (cur > 0n) {
                        setSteps(s => ({ ...s, [key]: (s[key] || []).map(st => st.id === 'stake' ? { ...st, status: 'pending' } : st) }));
                    const contract = getStakingContract(poolAddress, chain, contractType);
                    const r2: any = await withRefresh(() => stakeTokens(contract, big(amount, decimals), account, contractType));
                        setSteps(s => ({ ...s, [key]: (s[key] || []).map(st => st.id === 'stake' ? { ...st, status: 'done', txHash: r2?.transactionHash || r2?.hash } : st) }));
                        done(key, r2?.transactionHash || r2?.hash);
                        return;
                    }
                } catch { /* ignore retry failures */ }
            }
            fail(key, e);
            setSteps(s => ({ ...s, [key]: (s[key] || []).map(st => st.status === 'pending' ? { ...st, status: 'error' } : st) }));
        }
    }, [account]);

    const unstake = useCallback(async (amount: string, decimals: number, poolAddress: string, chain: SupportedChainKey, contractType: StakingContractType = 'stakingRewards') => {
        if (!account) return; const key = poolAddress + ':unstake'; start(key);
        try {
            const amt = big(amount, decimals); if (amt <= 0) throw new Error('Amount must be > 0');
            setSteps(s => ({ ...s, [key]: [{ id: 'unstake', label: 'Unstake', status: 'pending' }] }));
            const contract = getStakingContract(poolAddress, chain, contractType);
            const r: any = await withRefresh(() => withdrawTokens(contract, amt, account, contractType));
            setSteps(s => ({ ...s, [key]: [{ id: 'unstake', label: 'Unstake', status: 'done', txHash: r?.transactionHash || r?.hash }] }));
            done(key, r?.transactionHash || r?.hash);
        } catch (e) { fail(key, e); setSteps(s => ({ ...s, [key]: [{ id: 'unstake', label: 'Unstake', status: 'error' }] })); }
    }, [account]);

    const claim = useCallback(async (poolAddress: string, chain: SupportedChainKey, contractType: StakingContractType = 'stakingRewards') => {
        if (!account) return; const key = poolAddress + ':claim'; start(key);
        try {
            setSteps(s => ({ ...s, [key]: [{ id: 'claim', label: 'Claim', status: 'pending' }] }));
            const contract = getStakingContract(poolAddress, chain, contractType);
            const r: any = await withRefresh(() => claimRewards(contract, account, contractType));
            setSteps(s => ({ ...s, [key]: [{ id: 'claim', label: 'Claim', status: 'done', txHash: r?.transactionHash || r?.hash }] }));
            done(key, r?.transactionHash || r?.hash);
        } catch (e) { fail(key, e); setSteps(s => ({ ...s, [key]: [{ id: 'claim', label: 'Claim', status: 'error' }] })); }
    }, [account]);

    const compound = useCallback(async (amount: string, decimals: number, stakingToken: string | undefined, poolAddress: string, chain: SupportedChainKey, contractType: StakingContractType = 'stakingRewards') => {
        if (!account) return; const key = poolAddress + ':compound'; start(key);
        try {
            const contract = getStakingContract(poolAddress, chain, contractType);
            // First claim
            await claim(poolAddress, chain, contractType);
            const amt = big(amount, decimals); if (amt > 0n) {
                if (stakingToken) await ensureAllowance(stakingToken, poolAddress, amt, chain, key);
                const r: any = await withRefresh(() => stakeTokens(contract, amt, account, contractType));
                done(key, r?.transactionHash || r?.hash);
            } else {
                done(key);
            }
        } catch (e) { fail(key, e); }
    }, [account, claim]);

    const compoundClaimable = useCallback(async (claimableAmount: string, decimals: number, stakingToken: string | undefined, poolAddress: string, chain: SupportedChainKey, contractType: StakingContractType = 'stakingRewards') => {
        if (!account) return; const key = poolAddress + ':compound'; start(key);
        try {
            const contract = getStakingContract(poolAddress, chain, contractType);
            // claim rewards
            const rClaim: any = await withRefresh(() => claimRewards(contract, account, contractType));
            // parse amount
            const amt = big(claimableAmount, decimals);
            if (amt > 0n) {
                setSteps(s => ({
                    ...s, [key]: [
                        ...(stakingToken ? [{ id: 'approve', label: 'Approve', status: 'idle' as const }] : []),
                        { id: 'claim', label: 'Claim', status: 'done', txHash: rClaim?.transactionHash || rClaim?.hash },
                        { id: 'stake', label: 'Stake', status: 'idle' }
                    ]
                }));
                if (stakingToken) await ensureAllowance(stakingToken, poolAddress, amt, chain, key);
                setSteps(s => ({ ...s, [key]: (s[key] || []).map(st => st.id === 'stake' ? { ...st, status: 'pending' } : st) }));
                const rStake: any = await withRefresh(() => stakeTokens(contract, amt, account, contractType));
                setSteps(s => ({ ...s, [key]: (s[key] || []).map(st => st.id === 'stake' ? { ...st, status: 'done', txHash: rStake?.transactionHash || rStake?.hash } : st) }));
                done(key, rStake?.transactionHash || rStake?.hash || rClaim?.transactionHash);
            } else {
                done(key, rClaim?.transactionHash || rClaim?.hash);
            }
        } catch (e) { fail(key, e); setSteps(s => ({ ...s, [key]: (s[key] || []).map(st => st.status === 'pending' ? { ...st, status: 'error' } : st) })); }
    }, [account]);

    return { stake, unstake, claim, compound, compoundClaimable, state, steps, reset };
}
