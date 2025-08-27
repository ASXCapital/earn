"use client";

import { useEffect, useState } from 'react';

const CORE_CHAIN_ID = 1116;
const RPC_URL = process.env.NEXT_PUBLIC_CORE_RPC || process.env.CORE_RPC_1 || 'https://rpc.ankr.com/core';

function formatBalance(weiHex: string): string {
  try {
    const wei = BigInt(weiHex);
    const ether = Number(wei) / 1e18; // safe enough for display (not for precise math) when balance < ~9e15 CORE
    if (ether === 0) return '0';
    if (ether < 0.0001) return '<0.0001';
    return ether.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch { return '—'; }
}

export function CoreBalance() {
  const [chainId, setChainId] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Detect provider, chain, and account
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const eth: any = (window as any).ethereum;
    if (!eth) return;
    const handleChain = (cid: string) => setChainId(parseInt(cid, 16));
    const handleAccounts = (accs: string[]) => setAddress(accs?.[0] || null);
    eth.request({ method: 'eth_chainId' }).then(handleChain).catch(() => { });
    eth.request({ method: 'eth_accounts' }).then(handleAccounts).catch(() => { });
    eth.on?.('chainChanged', handleChain);
    eth.on?.('accountsChanged', handleAccounts);
    return () => {
      eth.removeListener?.('chainChanged', handleChain);
      eth.removeListener?.('accountsChanged', handleAccounts);
    };
  }, []);

  // Fetch CORE balance when on CORE and address present
  useEffect(() => {
    let cancelled = false;
    async function fetchBal() {
      if (chainId !== CORE_CHAIN_ID || !address) { setBalance(''); return; }
      setLoading(true);
      try {
        const res = await fetch(RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'eth_getBalance', params: [address, 'latest'] }) });
        const json = await res.json();
        if (!cancelled && json.result) setBalance(formatBalance(json.result));
      } catch {
        if (!cancelled) setBalance('—');
      } finally { if (!cancelled) setLoading(false); }
    }
    fetchBal();
    const iv = setInterval(fetchBal, 15000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [chainId, address]);

  if (!address || chainId !== CORE_CHAIN_ID) return null;

  return (
    <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 bg-white/5 text-xs text-white/70">
      <span className="text-white/40">CORE</span>
      <span className="font-medium text-white/90">{loading && !balance ? '…' : balance}</span>
    </div>
  );
}
