export interface SafeFetchOptions extends RequestInit {
    timeoutMs?: number;
    retries?: number;
    retryDelayBaseMs?: number; // base for exponential backoff
    cacheSeconds?: number; // Next.js ISR revalidate hint
    signal?: AbortSignal;
    idempotent?: boolean; // if false, we won't retry after first failure
}

// Per-host lightweight concurrency limiters (no external dep) ---------------
interface Limiter { active: number; q: Array<() => void>; cap: number; }
const hostLimiters = new Map<string, Limiter>();
function getLimiter(host: string): Limiter {
    let lim = hostLimiters.get(host);
    if (!lim) {
        // Tighter cap for heavy / large responses hosts (e.g. coingecko)
        const cap = /coingecko|ankr|rpc/i.test(host) ? 2 : 5;
        lim = { active: 0, q: [], cap };
        hostLimiters.set(host, lim);
    }
    return lim;
}
function runNext(lim: Limiter) { if (lim.active >= lim.cap) return; const fn = lim.q.shift(); if (!fn) return; lim.active++; fn(); }
async function withLimit<T>(host: string, fn: () => Promise<T>): Promise<T> {
    const lim = getLimiter(host || 'default');
    if (lim.active >= lim.cap) await new Promise<void>(res => lim.q.push(res)); else lim.active++;
    try { return await fn(); } finally { lim.active--; runNext(lim); }
}

// Util ----------------------------------------------------------------------
async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

export async function safeFetch(url: string, opts: SafeFetchOptions = {}) {
    const { timeoutMs = 10_000, retries = 2, retryDelayBaseMs = 300, cacheSeconds, idempotent = true, ...init } = opts;

        // Derive host (relative URLs share 'app' bucket)
        let host = 'app';
        try { if (/^https?:/i.test(url)) host = new URL(url).host; } catch { /* ignore */ }

        return withLimit(host, async () => {
        let lastErr: any;
        for (let attempt = 0; attempt <= retries; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            const started = Date.now();
            try {
                const fetchOpts: RequestInit & { next?: Record<string, any> } = { ...init, signal: controller.signal };
                if (cacheSeconds !== undefined) fetchOpts.next = { revalidate: cacheSeconds };
                const res = await fetch(url, fetchOpts);
                const ms = Date.now() - started;
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                if (attempt > 0) console.info('[safeFetch:recovered]', { url, attempt, ms });
                return res;
            } catch (e: any) {
                const ms = Date.now() - started;
                const code = e?.code || e?.name;
                    const msg = String(e?.message || '').toLowerCase();
                            // Detect HTTP status if pattern present in message (e.g. 'HTTP 502')
                            let httpStatus: number | undefined;
                            const m = msg.match(/http\s+(\d{3})/); if (m) httpStatus = parseInt(m[1], 10);
                            const retriableHttp = httpStatus && ((httpStatus >= 500 && httpStatus < 600) || httpStatus === 429);
                            const retriable = (
                                retriableHttp ||
                                code === 'UND_ERR_SOCKET' ||
                                code === 'ETIMEDOUT' ||
                                e?.name === 'AbortError' ||
                                msg.includes('timeout') ||
                                msg.includes('terminated') ||
                                msg.includes('socket hang up') ||
                                msg.includes('fetch failed') ||
                                /econnreset|eai_again/.test(code || '')
                            );
                console.warn('[safeFetch]', { url, attempt, code, ms, retriable, msg });
                lastErr = e;
                    if (!idempotent) break;
                    if (!retriable) break;
                    if (attempt === retries) break;
                // Backoff with jitter
                const backoff = Math.round(retryDelayBaseMs * 2 ** attempt + Math.random() * 100);
                await delay(backoff);
                continue;
            } finally { clearTimeout(timeout); }
        }
        throw lastErr;
    });
}

export async function safeJson<T = any>(url: string, opts?: SafeFetchOptions): Promise<T> {
    const res = await safeFetch(url, opts);
    return res.json() as Promise<T>;
}
