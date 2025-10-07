"use client";

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { useActiveAccount, useActiveWallet, useActiveWalletChain } from 'thirdweb/react';
import { bsc, core } from '@/lib/thirdweb';
import { usePrices } from '@/hooks/usePrices';
import { useStakingPools } from '@/hooks/useStakingPools';
import { STAKING_POOLS } from '@/data/staking';
import { PoolCard } from '@/components/staking/PoolCard';
import type { SupportedChainKey } from '@/types/staking';

export default function Page() {
  const [chainKey, setChainKey] = useState<SupportedChainKey>('bsc');
  // Removed debug mode
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();
  const prices = usePrices();
  const { view, refresh } = useStakingPools({ chainKey, prices, debug: false });
  const pools = STAKING_POOLS.filter(p => p.chain === chainKey);

  const expectedChainId = chainKey === 'bsc' ? 56 : 1116;
  const networkMismatch = !!account?.address && (!!activeChain && activeChain.id !== expectedChainId);
  const targetChain = chainKey === 'bsc' ? bsc : core;

  async function switchToTarget() {
    try { await wallet?.switchChain(targetChain as any); } catch (e) { /* eslint-disable no-console */ console.error('switchChain error', e); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Staking</h1>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <ChainButton label="BSC" active={chainKey === 'bsc'} onClick={() => setChainKey('bsc')} />
        <ChainButton label="CORE" active={chainKey === 'core'} onClick={() => setChainKey('core')} />
        <Button onClick={refresh} size="sm" variant="ghost" className="px-2 text-xs bg-white/10 hover:bg-white/20">Refresh</Button>
        {account?.address && <span className="text-2xs text-white/50">Addr: {short(account.address, 6)}</span>}
      </div>
      {networkMismatch && (
        <div className="flex items-center flex-wrap gap-3 text-xs bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 rounded">
          <span>Wrong network: connected to {activeChain?.name || activeChain?.id}, need {chainKey === 'bsc' ? 'BNB Smart Chain' : 'Core'}.</span>
          <Button onClick={switchToTarget} size="sm" variant="ghost" className="px-2 py-1 bg-red-500/30 hover:bg-red-500/40 text-red-100">Switch Network</Button>
        </div>
      )}
      {/* Debug controls removed */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {pools.map(p => (
          <PoolCard
            key={p.key}
            poolKey={p.key}
            view={view[p.key]}
            chainKey={chainKey}
            accountAddress={account?.address}
            refresh={refresh}
            networkMismatch={networkMismatch}
            onRequestSwitch={switchToTarget}
          />
        ))}
      </div>
    </div>
  );
}

function ChainButton({ label, active, onClick }: { label: string; active: boolean; onClick(): void }) {
  return (
    <Button onClick={onClick} size="sm" variant="ghost" className={`px-3 py-1.5 border rounded-lg ${active ? 'border-asx-cyan text-white' : 'border-white/10 text-white/70 hover:text-white'}`}>{label}</Button>
  );
}

function short(addr: string, chars = 4) { return addr ? addr.slice(0, 2 + chars) + '…' + addr.slice(-chars) : ''; }
