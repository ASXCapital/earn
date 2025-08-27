import { TokenLogo } from '@/components/tokens/TokenLogo';
import { STAKING_POOLS } from '@/data/staking';
import type { PoolComputedView, SupportedChainKey } from '@/types/staking';
import { ReactNode, useState, useMemo } from 'react';
import { useStakingActions } from '@/hooks/useStakingActions';

export function PoolCard({ poolKey, view, chainKey, accountAddress, refresh, networkMismatch, onRequestSwitch }: { poolKey: string; view: PoolComputedView | undefined; chainKey: SupportedChainKey; accountAddress?: string; refresh?: () => void; networkMismatch?: boolean; onRequestSwitch?: () => void; }) {
    const pool = STAKING_POOLS.find(p => p.key === poolKey)!;
    const st = view;
    const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'rewards'>('stake');
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [copied, setCopied] = useState(false);
    const walletFloat = useMemo(() => safeParse(st?.walletBalanceDisplay), [st?.walletBalanceDisplay]);
    const stakedFloat = useMemo(() => safeParse(st?.userStakedDisplay), [st?.userStakedDisplay]);
    const claimableFloat = useMemo(() => safeParse(st?.claimableDisplay), [st?.claimableDisplay]);
    const { stake, unstake, claim, state, steps } = useStakingActions(refresh);
    const poolAddress = pool.address;
    const stakeState = state[poolAddress + ':stake'];
    const unstakeState = state[poolAddress + ':unstake'];
    const claimState = state[poolAddress + ':claim'];
    const stepsKey = poolAddress + ':' + (activeTab === 'rewards' ? 'claim' : activeTab);
    const currentSteps = steps[stepsKey];

    const statItems: { label: string; value: ReactNode; key: string }[] = [
        { label: 'APR', key: 'apr', value: st?.aprDisplay || '—' },
        { label: 'Pool Staked', key: 'pool', value: st?.totalStakedDisplay || '—' },
        { label: 'Your Stake', key: 'you', value: st?.userStakedDisplay || (accountAddress ? '…' : '—') },
        { label: 'Claimable', key: 'claim', value: st?.claimableDisplay || (accountAddress ? '…' : '—') },
        { label: 'Balance', key: 'bal', value: st?.walletBalanceDisplay || (accountAddress ? '…' : '—') },
        { label: 'TVL', key: 'tvl', value: st?.tvlDisplay || (st?.loading ? '…' : '—') },
    ];

    const pctFill = (kind: 'stake' | 'unstake', pct: number) => {
        const base = kind === 'stake' ? walletFloat : stakedFloat; if (base == null) return;
        const v = (base * pct).toFixed(6).replace(/\.0+$/, '');
        if (kind === 'stake') setStakeAmount(v); else setUnstakeAmount(v);
    };
    const maxStake = () => walletFloat != null && setStakeAmount(walletFloat.toString());
    const maxUnstake = () => stakedFloat != null && setUnstakeAmount(stakedFloat.toString());

    return (
        <div className="card p-6 flex flex-col gap-6" key={pool.key}>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-[220px]">
                    <TokenLogo symbol={pool.tokens.length > 1 ? [...pool.tokens] : pool.tokens[0]} />
                    <div className="leading-tight">
                        <h3 className="font-semibold tracking-tight text-sm md:text-base">{pool.label}</h3>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/40">
                            <span className="break-all" title={pool.address}>{short(pool.address)}</span>
                            <button
                                type="button"
                                aria-label="Copy contract address"
                                onClick={() => {
                                    const addr = pool.address;
                                    const doCopy = async () => {
                                        try {
                                            if (navigator?.clipboard?.writeText) {
                                                await navigator.clipboard.writeText(addr);
                                            } else {
                                                const ta = document.createElement('textarea');
                                                ta.value = addr; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                                            }
                                            setCopied(true); setTimeout(() => setCopied(false), 1600);
                                        } catch { /* ignore */ }
                                    };
                                    doCopy();
                                }}
                                className={`relative inline-flex items-center justify-center rounded-sm border border-white/15 hover:border-white/35 hover:text-white text-white/60 transition h-4 w-4 ${copied ? 'text-asx-cyan border-asx-cyan/70' : ''}`}
                            >
                                {/* copy icon */}
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                                </svg>
                                {copied && <span className="pointer-events-none select-none absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-asx-cyan">OK</span>}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs rounded bg-white/10 px-2 py-0.5 h-5 flex items-center">{chainKey.toUpperCase()}</span>
                </div>
            </div>

            {/* Stats (responsive, no overlap) */}
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
                {statItems.map(s => <StatBox key={s.key} label={s.label} value={s.value} />)}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                <TabButton active={activeTab === 'stake'} onClick={() => setActiveTab('stake')}>Stake</TabButton>
                <TabButton active={activeTab === 'unstake'} onClick={() => setActiveTab('unstake')}>Unstake</TabButton>
                <TabButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>Rewards</TabButton>
            </div>
            <div className="border-t border-white/10" />

            {/* Panels */}
            {activeTab === 'stake' && (
                <ActionPanel
                    title="Stake Tokens"
                    context={`Wallet Balance: ${st?.walletBalanceDisplay ?? '—'}`}
                    amount={stakeAmount}
                    setAmount={setStakeAmount}
                    symbol={st?.symbol}
                    disabled={!accountAddress || walletFloat == null || networkMismatch}
                    onMax={maxStake}
                    onPct={p => pctFill('stake', p)}
                />
            )}
            {activeTab === 'unstake' && (
                <ActionPanel
                    title="Unstake Tokens"
                    context={`Staked Balance: ${st?.userStakedDisplay ?? '—'}`}
                    amount={unstakeAmount}
                    setAmount={setUnstakeAmount}
                    symbol={st?.symbol}
                    disabled={!accountAddress || stakedFloat == null || networkMismatch}
                    onMax={maxUnstake}
                    onPct={p => pctFill('unstake', p)}
                />
            )}
            {activeTab === 'rewards' && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
                        <div className="space-y-1">
                            <p className="text-white/70">Claimable Rewards</p>
                            <p className="text-lg font-semibold text-white">{st?.claimableDisplay || '—'}</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">Claim sends accrued rewards to your wallet.</p>
                </div>
            )}
            {/* Steps & Footer Actions */}
            <div className="mt-auto flex flex-col gap-3">
                {currentSteps && currentSteps.length > 0 && (
                    <div className="rounded-md bg-white/[0.04] border border-white/10 p-3 flex flex-col gap-2">
                        <p className="text-[10px] uppercase tracking-wide text-white/40 font-semibold">Steps</p>
                        <div className="flex flex-col gap-1 text-[11px]">
                            {currentSteps.map((s, i) => (
                                <div key={s.id + i} className="flex items-center gap-2">
                                    <StatusDot status={s.status} />
                                    <span className="flex-1">{i + 1}. {s.label}</span>
                                    {s.txHash && <a href={txUrl(chainKey, s.txHash)} target="_blank" rel="noopener noreferrer" className="text-asx-cyan/80 hover:text-asx-cyan text-[10px]">Tx</a>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {networkMismatch && (
                    <div className="rounded bg-amber-500/10 border border-amber-500/30 p-2 text-[11px] text-amber-300 flex items-center justify-between gap-3">
                        <span>Wrong network. Switch to {chainKey === 'bsc' ? 'BNB Smart Chain' : 'Core'}.</span>
                        {onRequestSwitch && <button onClick={onRequestSwitch} className="px-2 py-1 rounded bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 text-[10px]">Switch</button>}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    {actionErrors({ stakeState, unstakeState, claimState }).map((e, i) => <p key={i} className="text-[10px] text-red-400">{e}</p>)}
                    {st?.error && <p className="text-[10px] text-red-400">{st.error}</p>}
                </div>
                <div className="pt-1">
                    <PrimaryActionBar
                        activeTab={activeTab}
                        stakeDisabled={!!(!accountAddress || walletFloat == null || !stakeAmount || stakeState?.pending || networkMismatch)}
                        unstakeDisabled={!!(!accountAddress || stakedFloat == null || !unstakeAmount || unstakeState?.pending || networkMismatch)}
                        claimDisabled={!!(!accountAddress || claimableFloat == null || claimableFloat <= 0 || claimState?.pending || networkMismatch)}
                        stakeLabel={stakeState?.pending ? 'Staking…' : 'Stake'}
                        unstakeLabel={unstakeState?.pending ? 'Unstaking…' : 'Unstake'}
                        claimLabel={claimState?.pending ? 'Claiming…' : 'Claim Rewards'}
                        onStake={() => stake(stakeAmount, st?.decimals || 18, st?.stakingTokenAddress, poolAddress, chainKey)}
                        onUnstake={() => unstake(unstakeAmount, st?.decimals || 18, poolAddress, chainKey)}
                        onClaim={() => claim(poolAddress, chainKey)}
                    />
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex flex-col justify-center gap-1 rounded-md bg-white/[0.035] border border-white/10 px-3 py-2 transition-colors hover:border-white/20">
            <span className="text-[10px] tracking-wide uppercase text-white/40 font-medium">{label}</span>
            <span className="text-[13px] font-semibold text-white/90 leading-none truncate" title={String(value)}>{value}</span>
        </div>
    );
}

function ActionBtn({ children, disabled, color, onClick }: { children: ReactNode; disabled?: boolean; color?: 'primary' | 'outline'; onClick?: () => void }) {
    const base = 'px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed';
    const styles = color === 'primary'
        ? 'bg-asx-cyan/90 hover:bg-asx-cyan text-black'
        : 'border border-white/20 text-white/90 hover:text-white hover:border-white/40';
    return <button className={`${base} ${styles}`} disabled={disabled} onClick={onClick}>{children}</button>;
}

function short(addr: string, chars = 4) { return addr ? addr.slice(0, 2 + chars) + '…' + addr.slice(-chars) : ''; }

function PercentRow({ onPick, disabled }: { onPick(pct: number): void; disabled?: boolean }) {
    const btn = 'px-2 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-[10px] tracking-wide uppercase disabled:opacity-40 disabled:cursor-not-allowed';
    const opts: [string, number][] = [['25%', 0.25], ['50%', 0.5], ['75%', 0.75], ['100%', 1]];
    return (
        <div className="flex gap-1.5 flex-wrap">
            {opts.map(o => <button key={o[0]} disabled={disabled} onClick={() => onPick(o[1])} className={btn}>{o[0]}</button>)}
        </div>
    );
}

function safeParse(val?: string): number | null {
    if (!val) return null;
    const clean = val.replace(/[^0-9.]/g, '');
    const n = parseFloat(clean);
    return Number.isFinite(n) ? n : null;
}

// Unified action panel (Stake / Unstake)
function ActionPanel({ title, context, amount, setAmount, symbol, disabled, onPct, onMax }: {
    title: string; context: string; amount: string; setAmount(v: string): void; symbol?: string; disabled?: boolean; onPct(p: number): void; onMax(): void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-white/90">{title}</h4>
                <span className="text-[11px] text-white/40" title={context}>{context}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus-within:border-asx-cyan/60">
                <input
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.0"
                    inputMode="decimal"
                    aria-label={`${title} amount`}
                    className="flex-1 bg-transparent outline-none text-sm"
                    disabled={disabled}
                />
                <button type="button" onClick={onMax} disabled={disabled} className="text-[10px] px-2 py-1 rounded bg-white/[0.08] hover:bg-white/[0.18] disabled:opacity-40 disabled:cursor-not-allowed tracking-wide uppercase">Max</button>
                <span className="text-[11px] text-white/40 select-none">{symbol || ''}</span>
            </div>
            <PercentRow disabled={disabled} onPick={onPct} />
        </div>
    );
}

function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick(): void }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition border ${active ? 'bg-asx-cyan/90 text-black border-asx-cyan/90' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'}`}
        >
            {children}
        </button>
    );
}

function StatusDot({ status }: { status: 'idle' | 'pending' | 'done' | 'error' }) {
    const base = 'h-2.5 w-2.5 rounded-full border';
    const color = status === 'done' ? 'bg-emerald-500 border-emerald-400' : status === 'pending' ? 'bg-amber-400 border-amber-300 animate-pulse' : status === 'error' ? 'bg-red-500 border-red-400' : 'bg-white/20 border-white/30';
    return <span className={`${base} ${color}`} />;
}

function txUrl(chain: SupportedChainKey, hash: string) {
    if (!hash) return '#';
    const map: Record<SupportedChainKey, string> = {
        bsc: 'https://bscscan.com/tx/',
        core: 'https://scan.coredao.org/tx/'
    };
    return (map[chain] || '') + hash;
}

function PrimaryActionBar({ activeTab, stakeDisabled, unstakeDisabled, claimDisabled, stakeLabel, unstakeLabel, claimLabel, onStake, onUnstake, onClaim }: {
    activeTab: 'stake' | 'unstake' | 'rewards';
    stakeDisabled: boolean; unstakeDisabled: boolean; claimDisabled: boolean;
    stakeLabel: string; unstakeLabel: string; claimLabel: string;
    onStake(): void; onUnstake(): void; onClaim(): void;
}) {
    let btn: ReactNode = null;
    if (activeTab === 'stake') btn = <ActionBtn disabled={stakeDisabled} color="primary" onClick={onStake}>{stakeLabel}</ActionBtn>;
    else if (activeTab === 'unstake') btn = <ActionBtn disabled={unstakeDisabled} color="outline" onClick={onUnstake}>{unstakeLabel}</ActionBtn>;
    else btn = <ActionBtn disabled={claimDisabled} color="primary" onClick={onClaim}>{claimLabel}</ActionBtn>;
    return <div className="flex">{btn}</div>;
}

function actionErrors({ stakeState, unstakeState, claimState }: any): string[] {
    const errs: string[] = [];
    if (stakeState?.error) errs.push('Stake error: ' + stakeState.error);
    if (unstakeState?.error) errs.push('Unstake error: ' + unstakeState.error);
    if (claimState?.error) errs.push('Claim error: ' + claimState.error);
    return errs;
}
