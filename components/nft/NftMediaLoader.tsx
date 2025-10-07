"use client";
import { useState, useCallback, useMemo } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { core } from '@/lib/thirdweb';
import { safeJson } from '@/lib/safeFetch';

// Simple ERC721 tokenOfOwnerByIndex pagination (fallback scanning if enumerable not supported is out of scope)
// We assume the collections implement ERC721Enumerable; otherwise we show a notice.

export interface NftMediaLoaderProps { contract: string; supply?: number }
interface OwnedToken { id: string; }

const CORE_RPC = (core as any)?.rpcUrls?.default?.http?.[0] || 'https://rpc.ankr.com/core';

async function rpc(method: string, params: any[]) {
  const res = await fetch(CORE_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }) });
  const j = await res.json().catch(() => ({}));
  if (j.error) throw new Error(j.error.message || 'rpc');
  return j.result;
}

async function getBalance(contract: string, owner: string): Promise<number> {
  const data = '0x70a08231' + owner.replace(/^0x/, '').padStart(64, '0');
  const r = await rpc('eth_call', [{ to: contract, data }, 'latest']);
  return typeof r === 'string' ? parseInt(r, 16) || 0 : 0;
}

// JSON-RPC batch helper: send many eth_call ownerOf in one HTTP request.
async function batchOwnerOf(contract: string, tokenIds: number[]): Promise<(string | null)[]> {
  if (tokenIds.length === 0) return [];
  const requests = tokenIds.map((id, i) => {
    const selector = '0x6352211e';
    const idHex = id.toString(16).padStart(64, '0');
    const data = selector + idHex;
    return { jsonrpc: '2.0', id: Date.now() + i, method: 'eth_call', params: [{ to: contract, data }, 'latest'] };
  });
  try {
    const res = await fetch(CORE_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requests) });
    const arr = await res.json().catch(() => []);
    if (!Array.isArray(arr)) return tokenIds.map(() => null);
    return arr.map(r => {
      const v = r?.result;
      if (typeof v === 'string' && v.length >= 66) return '0x' + v.slice(-40).toLowerCase();
      return null;
    });
  } catch {
    return tokenIds.map(() => null);
  }
}

// Generic single uint256 view caller by 4-byte selector (returns 0 on failure)
async function callUint(contract: string, selector: string): Promise<number> {
  try {
    const r = await rpc('eth_call', [{ to: contract, data: selector }, 'latest']);
    if (typeof r === 'string') return parseInt(r, 16) || 0;
  } catch { }
  return 0;
}

// Removed heavy log scanning; deterministic bounded scan instead.
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
async function enumerateByLogs(contract: string, owner: string, expected: number, setProgress: (s: string) => void): Promise<string[]> {
  try {
    const latestHex = await rpc('eth_blockNumber', []);
    if (typeof latestHex !== 'string') return [];
    const latest = parseInt(latestHex, 16) || 0;
    const ownerTopic = '0x' + owner.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    let from = Math.max(0, latest - 400_000); // start with recent window
    const allIncoming: string[] = []; const allOutgoing: string[] = [];
    let expanded = 0;
    while (from >= 0 && expanded < 12) { // expand up to 12 windows (~4.8M blocks)
      const paramsBase = { address: contract, fromBlock: '0x' + from.toString(16), toBlock: '0x' + latest.toString(16) };
      const [incoming, outgoing] = await Promise.all([
        rpc('eth_getLogs', [{ ...paramsBase, topics: [TRANSFER_TOPIC, null, ownerTopic] }]).catch(() => []),
        rpc('eth_getLogs', [{ ...paramsBase, topics: [TRANSFER_TOPIC, ownerTopic] }]).catch(() => []),
      ]);
      if (Array.isArray(incoming)) for (const l of incoming) { const t = l.topics?.[3]; if (t && t.length >= 66) allIncoming.push(BigInt(t).toString()); }
      if (Array.isArray(outgoing)) for (const l of outgoing) { const t = l.topics?.[3]; if (t && t.length >= 66) allOutgoing.push(BigInt(t).toString()); }
      const owned = new Set<string>();
      for (const id of allIncoming) owned.add(id);
      for (const id of allOutgoing) owned.delete(id);
      setProgress(`logs pass ${expanded + 1}: ${owned.size}/${expected}`);
      if (owned.size === expected) return Array.from(owned);
      // expand further back
      expanded++;
      if (from === 0) break;
      from = Math.max(0, from - 400_000);
    }
    const owned = new Set<string>();
    for (const id of allIncoming) owned.add(id);
    for (const id of allOutgoing) owned.delete(id);
    return Array.from(owned);
  } catch { return []; }
}

async function tokenOfOwnerByIndex(contract: string, owner: string, index: number): Promise<string | null> {
  const selector = '0x2f745c59'; // tokenOfOwnerByIndex(address,uint256)
  const addr = owner.replace(/^0x/, '').padStart(64, '0');
  const idx = index.toString(16).padStart(64, '0');
  const data = selector + addr + idx;
  try {
    const r = await rpc('eth_call', [{ to: contract, data }, 'latest']);
    if (typeof r === 'string') return BigInt(r).toString();
  } catch { }
  return null;
}

async function tokenURI(contract: string, tokenId: string): Promise<string | null> {
  const selector = '0xc87b56dd'; // tokenURI(uint256)
  const idHex = BigInt(tokenId).toString(16).padStart(64, '0');
  const data = selector + idHex;
  try {
    const r = await rpc('eth_call', [{ to: contract, data }, 'latest']);
    if (typeof r === 'string' && r !== '0x') {
      const uriHex = r.slice(2);
      // ABI decode string (offset 64, length next 64)
      const len = parseInt(uriHex.slice(64, 128), 16);
      const strHex = uriHex.slice(128, 128 + len * 2);
      const bytes = new Uint8Array(strHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
      return new TextDecoder().decode(bytes);
    }
  } catch { }
  return null;
}

async function fetchMetadataImage(uri: string): Promise<string | undefined> {
  try {
    let u = uri;
    if (u.startsWith('ipfs://')) u = 'https://ipfs.io/ipfs/' + u.slice(7);
    const data = await safeJson<any>(u, { timeoutMs: 4000, retries: 1 });
    let img = data?.image || data?.image_url;
    if (img && img.startsWith('ipfs://')) img = 'https://ipfs.io/ipfs/' + img.slice(7);
    return typeof img === 'string' ? img : undefined;
  } catch { return undefined; }
}

async function ownerOf(contract: string, tokenId: string): Promise<string | null> {
  const selector = '0x6352211e'; // ownerOf(uint256)
  const idHex = BigInt(tokenId).toString(16).padStart(64, '0');
  const data = selector + idHex;
  try {
    const r = await rpc('eth_call', [{ to: contract, data }, 'latest']);
    if (typeof r === 'string' && r.length >= 66) return '0x' + r.slice(-40).toLowerCase();
  } catch { }
  return null;
}

export function NftMediaLoader({ contract, supply }: NftMediaLoaderProps) {
  const account = useActiveAccount();
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<OwnedToken[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [progress, setProgress] = useState<string>('');

  const visible = useMemo(() => tokens.slice(page * pageSize, (page + 1) * pageSize), [tokens, page, pageSize]);
  const maxPage = Math.max(0, Math.ceil(tokens.length / pageSize) - 1);

  const load = useCallback(async () => {
    if (!account) { setError('Connect wallet'); return; }
    setLoading(true); setError(null);
    try {
      const bal = await getBalance(contract, account.address);
      if (!bal) { setTokens([]); setLoaded(true); setLoading(false); return; }
      const ids: OwnedToken[] = [];
      // Probe enumerable support
      const probe = await tokenOfOwnerByIndex(contract, account.address, 0);
      const enumerable = probe !== null;
      if (enumerable) {
        for (let i = 0; i < bal && i < 400; i++) { // slightly higher cap with direct enumeration
          const id = i === 0 ? probe : await tokenOfOwnerByIndex(contract, account.address, i);
          if (!id) break;
          ids.push({ id });
        }
      } else {
        // Try log-based reconstruction first
        const logIds = await enumerateByLogs(contract, account.address, bal, setProgress);
        if (logIds.length) {
          logIds.sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0));
          logIds.slice(0, bal).forEach(id => ids.push({ id }));
        }
        if (ids.length !== bal) {
          // Fallback deterministic scan only for missing tokens
          const missing = bal - ids.length;
          const have = new Set(ids.map(i => i.id));
          const upperExclusive = supply && supply > 0 ? supply : Math.max(bal * 10, 1000);
          for (let start = 0; start < upperExclusive && have.size < bal; start += 120) {
            const range: number[] = []; for (let t = start; t < start + 120 && t < upperExclusive; t++) range.push(t);
            const owners = await batchOwnerOf(contract, range);
            owners.forEach((own, idx) => {
              if (own && own.toLowerCase() === account.address.toLowerCase()) {
                const idStr = String(range[idx]);
                if (!have.has(idStr)) { ids.push({ id: idStr }); have.add(idStr); }
              }
            });
            setProgress(`scan fallback: ${ids.length}/${bal}`);
          }
        }
        setProgress('');
      }
      setTokens(ids);
      setLoaded(true);
      setProgress('');
    } catch (e: any) {
      setError(e?.message || 'load failed');
    } finally { setLoading(false); }
  }, [account, contract, supply]);

  if (!account) return <div className="text-xs text-white/40">Connect wallet to view owned NFTs.</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          <button disabled={loading} onClick={load} className="px-3 py-1 rounded-md text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed">
            {loaded ? 'Reload IDs' : 'IDs'}
          </button>
          {loaded && tokens.length > 0 && <div className="text-2xs text-white/40">{tokens.length} IDs</div>}
        </div>
        {loaded && tokens.length > pageSize && (
          <div className="flex items-center gap-2 text-xs">
            <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-30">Prev</button>
            <span className="text-white/60 tabular-nums">{page + 1}/{maxPage + 1}</span>
            <button disabled={page === maxPage} onClick={() => setPage(p => Math.min(maxPage, p + 1))} className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}
      {loading && <div className="text-xs text-white/50 animate-pulse">Loading… {progress}</div>}
      {loaded && !loading && tokens.length === 0 && <div className="text-xs text-white/40">No NFTs found (collection may be non-enumerable or still indexing).</div>}
      {loaded && tokens.length > 0 && (
        <div className="grid gap-2 grid-cols-6 sm:grid-cols-8">
          {visible.map(t => (
            <div key={t.id} className="relative group rounded-md border border-dashed border-white/15 flex items-center justify-center text-2xs text-white/70 bg-white/[0.04] h-16">
              #{t.id}
            </div>
          ))}
        </div>
      )}
      {loaded && tokens.length > 0 && (
        <div className="flex justify-end">
          <button onClick={async () => {
            try {
              // Build holder snapshot: per token owner (1 each) => count per owner.
              // For ERC721 each token = 1; we gather owners via batchOwnerOf again over discovered IDs to be certain.
              const idsOnly = tokens.map(t => Number(t.id)).sort((a, b) => a - b);
              const owners = await batchOwnerOf(contract, idsOnly);
              const counts: Record<string, number> = {};
              owners.forEach(o => { if (o) counts[o] = (counts[o] || 0) + 1; });
              const rows: string[][] = [['address', 'count']];
              Object.entries(counts).forEach(([addr, c]) => rows.push([addr, String(c)]));
              const csv = rows.map(r => r.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = contract.slice(0, 10) + '-snapshot.csv'; a.click();
              setTimeout(() => URL.revokeObjectURL(url), 5000);
            } catch (e) { console.error(e); }
          }} className="mt-2 px-3 py-1 rounded-md text-2xs font-medium border border-white/15 bg-white/5 hover:bg-white/10">Snapshot CSV</button>
        </div>
      )}
    </div>
  );
}

export default NftMediaLoader;
