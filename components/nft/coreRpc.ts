import { core } from '@/lib/thirdweb';
import { safeFetch } from '@/lib/safeFetch';

// Fallback to chain's rpc field if env not provided
// @ts-ignore thirdweb defineChain exposes rpc field
const RPC_URL = process.env.CORE_RPC_1 || (core as any).rpc || (Array.isArray((core as any).rpcUrls?.default?.http) ? (core as any).rpcUrls.default.http[0] : undefined);

async function rpc(method: string, params: any[] = []) {
    const attempts = 3;
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
        try {
            const res = await safeFetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
                timeoutMs: 8_000,
                retries: 0,
            } as any);
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('json')) {
                // not JSON (rate limit HTML, etc.)
                throw new Error('Non-JSON RPC response');
            }
            const json = await res.json();
            if (json.error) throw new Error(json.error.message || 'RPC Error');
            return json.result;
        } catch (e: any) {
            lastErr = e;
            // basic backoff for rate limits / transient
            if (/rate limit|too many|timeout|non-json/i.test(e.message) && i < attempts - 1) {
                await new Promise(r => setTimeout(r, 150 * (i + 1)));
                continue;
            }
            break;
        }
    }
    throw lastErr;
}

function hexToNumber(hex?: string) { return hex ? parseInt(hex, 16) : 0; }

let _blockCache: { v: number; ts: number } | null = null;
export async function getBlockNumber(): Promise<number> {
    const now = Date.now();
    if (_blockCache && now - _blockCache.ts < 5_000) return _blockCache.v;
    try {
        const v = hexToNumber(await rpc('eth_blockNumber'));
        _blockCache = { v, ts: now };
        return v;
    } catch {
        return _blockCache?.v || 0;
    }
}

// Generic eth_call
async function call(address: string, data: string) {
    return await rpc('eth_call', [{ to: address, data }, 'latest']);
}

// Function selectors (keccak hashed & first 4 bytes)
const SELECTORS = {
    name: '0x06fdde03',
    symbol: '0x95d89b41',
    totalSupply: '0x18160ddd', // ERC721Enumerable OR ERC20 style
    ownerOf: '0x6352211e',
    balanceOf: '0x70a08231',
};

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';

interface MintCacheEntry { ts: number; value: number; }
const MINT_CACHE: Record<string, MintCacheEntry> = {};

export async function getName(address: string) {
    try { const raw = await call(address, SELECTORS.name); return decodeString(raw); } catch { return undefined; }
}

export async function getSymbol(address: string) { try { const raw = await call(address, SELECTORS.symbol); return decodeString(raw); } catch { return undefined; } }

export async function getTotalSupply(address: string) {
    // First try direct totalSupply()
    try {
        const raw = await call(address, SELECTORS.totalSupply);
        const val = hexToNumber(raw);
        if (val > 0) return val;
    } catch { /* ignore */ }

    // Fallback: cached minted count via Transfer(from=0x0) events (approx current supply)
    const key = address.toLowerCase();
    const now = Date.now();
    if (MINT_CACHE[key] && now - MINT_CACHE[key].ts < 60_000) return MINT_CACHE[key].value; // 1 min cache
    try {
        const latest = await getBlockNumber();
        const window = 1_000_000; // adjustable default scan range (recent history)
        const startEnv = process.env['NFT_START_BLOCK_' + key.slice(2, 8).toUpperCase()];
        const recentFrom = startEnv ? parseInt(startEnv) : Math.max(0, latest - window);

        async function scan(fromBlock: number, toLatest: number): Promise<number> {
            let step = 30_000;
            let minted = 0;
            let b = fromBlock;
            let safety = 0;
            while (b <= toLatest && safety < 120_000) {
                safety++;
                const to = Math.min(toLatest, b + step);
                try {
                    const logs = await rpc('eth_getLogs', [{
                        fromBlock: '0x' + b.toString(16),
                        toBlock: '0x' + to.toString(16),
                        address,
                        topics: [TRANSFER_TOPIC, ZERO_TOPIC]
                    }]);
                    if (Array.isArray(logs)) minted += logs.length;
                    b = to + 1;
                } catch (e: any) {
                    if (/range|limit|too many|rate limit/i.test(e?.message || '')) {
                        const newStep = Math.max(2_000, Math.floor(step / 2));
                        if (newStep === step) {
                            // if we cannot reduce further, skip this slice
                            b = to + 1;
                        } else {
                            step = newStep;
                        }
                        continue;
                    }
                    b = to + 1; // skip problematic slice
                }
            }
            return minted;
        }

        // First pass: recent window
        let minted = await scan(recentFrom, latest);

        // If nothing found, do a deep scan from genesis (once every 10 min) to catch very old mints.
        if (minted === 0) {
            const deepKey = key + ':deep';
            const deepCached = MINT_CACHE[deepKey];
            if (!deepCached || now - deepCached.ts > 10 * 60_000) {
                const deepMinted = await scan(0, latest);
                // store deep result separately & also as primary cache
                MINT_CACHE[deepKey] = { ts: now, value: deepMinted };
                minted = deepMinted;
            } else {
                minted = deepCached.value; // reuse deep cache
            }
        }

        MINT_CACHE[key] = { ts: now, value: minted };
        return minted || undefined;
    } catch { return undefined; }
}

// naive string decoder (ABI encoded dynamic string)
function decodeString(hex: string): string | undefined {
    if (!hex || hex === '0x') return undefined;
    try {
        const data = hex.slice(2);
        // find length (offset 64, then length 64) per ABI for single string
        const lengthHex = data.slice(64, 128);
        const length = parseInt(lengthHex, 16);
        const strHex = data.slice(128, 128 + length * 2);
        const bytes = new Uint8Array(strHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
        return new TextDecoder().decode(bytes);
    } catch { return undefined; }
}
