import { getBlockNumber } from './coreRpc';
import { safeFetch } from '@/lib/safeFetch';

// Safe, low-impact analyzer with adaptive chunking, per-collection isolation, and short cache.

interface CollectionAnalysis {
	minted?: number;
	owners?: number; // unique addresses seen in transfers window
	topHolderSharePct?: number;
	avgBalance?: number;
	topHolderBalance?: number;
	transfers24h?: number;
	mints24h?: number;
	sampleSize: number;
	scanFromBlock: number;
	scanToBlock: number;
}

interface CacheEntry { ts: number; data: Record<string, CollectionAnalysis>; }
const CACHE: CacheEntry = { ts: 0, data: {} };

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';
const BALANCE_OF_SELECTOR = '0x70a08231';

function rpcUrls() {
	const primary = process.env.CORE_RPC_1 || process.env.NEXT_PUBLIC_CORE_RPC || 'https://rpc.ankr.com/core';
	const fallbacks = (process.env.CORE_RPC_FALLBACK || '').split(',').map(s => s.trim()).filter(Boolean);
	return [primary, ...fallbacks];
}

async function rpc(method: string, params: any[]) {
	const urls = rpcUrls();
	let lastErr: any;
	for (const url of urls) {
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				const res = await safeFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }), timeoutMs: 8_000, retries: 1 } as any);
				const ct = res.headers.get('content-type') || '';
				if (!ct.includes('json')) throw new Error('non-json');
				const j = await res.json();
				if (j.error) throw new Error(j.error.message || 'rpc error');
				return j.result;
			} catch (e: any) {
				lastErr = e;
				if (/rate limit|too many|timeout|non-json|block range/i.test(e.message) && attempt < 2) {
					await new Promise(r => setTimeout(r, 120 * (attempt + 1)));
					continue;
				}
				break; // try next URL
			}
		}
	}
	throw lastErr || new Error('rpc failure');
}

function encodeBalanceOf(address: string) {
	const clean = address.toLowerCase().replace(/^0x/, '');
	return BALANCE_OF_SELECTOR + clean.padStart(64, '0');
}

function hexToNum(h?: string) { return h ? parseInt(h, 16) : 0; }

async function getLogs(address: string, from: number, to: number, topics: string[]) {
	return rpc('eth_getLogs', [{ address, fromBlock: '0x' + from.toString(16), toBlock: '0x' + to.toString(16), topics }]);
}

async function chunked(address: string, from: number, to: number, topics: string[]): Promise<any[]> {
	let step = 15_000; // start modest
	const maxStep = 25_000;
	const minStep = 1_000;
	let cursor = from;
	const out: any[] = [];
	while (cursor <= to) {
		let upper = Math.min(to, cursor + step);
		let attempts = 0;
		for (; ;) {
			try {
				const part = await getLogs(address, cursor, upper, topics);
				if (Array.isArray(part) && part.length) out.push(...part);
				// gentle growth on success
				if (attempts === 0 && step < maxStep) step = Math.min(maxStep, Math.floor(step * 1.3));
				break;
			} catch (e: any) {
				const msg = (e?.message || '').toLowerCase();
				if ((/block range|rate limit|too many|timeout|non-json|limit/.test(msg)) && step > minStep) {
					step = Math.max(minStep, Math.floor(step / 2));
					upper = Math.min(to, cursor + step);
					attempts++;
					if (attempts > 4) break; // skip problematic window
					await new Promise(r => setTimeout(r, 40 * attempts));
					continue;
				}
				break; // unrecoverable -> skip
			}
		}
		cursor = upper + 1;
		// Soft cap: avoid huge memory usage ( stop after 20k logs )
		if (out.length > 20_000) break;
	}
	return out;
}

export async function analyzeCollections(addresses: string[]): Promise<Record<string, CollectionAnalysis>> {
	const now = Date.now();
	if (now - CACHE.ts < 60_000 && addresses.every(a => CACHE.data[a.toLowerCase()])) return CACHE.data;

	let latest = 0;
	try { latest = await getBlockNumber(); } catch { latest = 0; }
	if (!latest) return CACHE.data; // keep previous

	// Estimate blocks per second using a small delta
	const lookback = Math.min(3000, latest);
	let blocksPerSec = 0.33; // fallback ~3s per block
	try {
		const [bNow, bPast]: any = await Promise.all([
			rpc('eth_getBlockByNumber', ['0x' + latest.toString(16), false]).catch(() => null),
			rpc('eth_getBlockByNumber', ['0x' + (latest - lookback).toString(16), false]).catch(() => null)
		]);
		if (bNow && bPast) {
			const dt = parseInt(bNow.timestamp, 16) - parseInt(bPast.timestamp, 16);
			if (dt > 0) blocksPerSec = lookback / dt;
		}
	} catch {/* ignore */ }
	const blocks24h = Math.floor(86400 * blocksPerSec);

	const windowBlocks = parseInt(process.env.NFT_SCAN_WINDOW || '180000');
	const fromDefault = Math.max(0, latest - windowBlocks);

	const results: Record<string, CollectionAnalysis> = {};
	for (const addrRaw of addresses) {
		const addr = addrRaw.toLowerCase();
		try {
			const startOverride = process.env['NFT_START_BLOCK_' + addr.slice(2, 8).toUpperCase()];
			const fromBlock = startOverride ? parseInt(startOverride) : fromDefault;
			// All transfers window
			const allLogs = await chunked(addr, fromBlock, latest, [TRANSFER_TOPIC]);
			// Mint logs (from = 0)
			const mintLogs = allLogs.filter(l => (l.topics?.[1] || '').toLowerCase() === ZERO_TOPIC);
			const minted = mintLogs.length;
			// Ownership set estimation
			const ownersSet = new Set<string>();
			for (const l of allLogs) {
				const t1 = (l.topics?.[1] || '').toLowerCase();
				const t2 = (l.topics?.[2] || '').toLowerCase();
				if (t1 && t1 !== ZERO_TOPIC) ownersSet.add('0x' + t1.slice(26));
				if (t2 && t2 !== ZERO_TOPIC) ownersSet.add('0x' + t2.slice(26));
				if (ownersSet.size > 2000) break; // cap
			}
			const owners = ownersSet.size || undefined;

			// Recent 24h activity
			const recentFrom = Math.max(0, latest - blocks24h);
			const recentLogs = await chunked(addr, recentFrom, latest, [TRANSFER_TOPIC]);
			const transfers24h = recentLogs.length;
			const mints24h = recentLogs.filter(l => (l.topics?.[1] || '').toLowerCase() === ZERO_TOPIC).length;

			// Balance sampling (first 100 owners)
			const sampleOwners = Array.from(ownersSet).slice(0, 100);
			const balances: number[] = [];
			await Promise.all(sampleOwners.map(async (o) => {
				try {
					const data = encodeBalanceOf(o);
					const balHex = await rpc('eth_call', [{ to: addr, data }, 'latest']);
					balances.push(hexToNum(balHex));
				} catch {/* ignore */ }
			}));
			const totalHeld = balances.reduce((a, b) => a + b, 0);
			const topHolderBalance = balances.slice().sort((a, b) => b - a)[0] || 0;
			const topHolderSharePct = totalHeld ? (topHolderBalance / totalHeld) * 100 : undefined;
			const avgBalance = balances.length ? totalHeld / balances.length : undefined;

			results[addr] = {
				minted,
				owners,
				topHolderSharePct,
				avgBalance,
				topHolderBalance,
				transfers24h,
				mints24h,
				sampleSize: balances.length,
				scanFromBlock: fromBlock,
				scanToBlock: latest,
			};
		} catch (e) {
			results[addr] = {
				sampleSize: 0,
				scanFromBlock: 0,
				scanToBlock: latest,
			} as CollectionAnalysis;
		}
	}

	CACHE.ts = now;
	CACHE.data = results;
	return results;
}

export type { CollectionAnalysis };

