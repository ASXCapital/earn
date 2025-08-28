export interface SafeFetchOptions extends RequestInit {
    timeoutMs?: number;
    retries?: number;
    retryDelayBaseMs?: number; // base for exponential backoff
    cacheSeconds?: number; // Next.js ISR revalidate hint
    signal?: AbortSignal;
    idempotent?: boolean; // if false, we won't retry after first failure
}

// Lightweight global concurrency limiter (no external dep) -------------------
const MAX_CONCURRENT = 5;
let active = 0;
const queue: Array<() => void> = [];
function runNext() { if (active >= MAX_CONCURRENT) return; const fn = queue.shift(); if (!fn) return; active++; fn(); }
async function withLimit<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= MAX_CONCURRENT) {
        await new Promise<void>(res => queue.push(res));
    } else {
        active++;
    }
    try { return await fn(); } finally { active--; runNext(); }
}

// Util ----------------------------------------------------------------------
async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

export async function safeFetch(url: string, opts: SafeFetchOptions = {}) {
    const { timeoutMs = 10_000, retries = 2, retryDelayBaseMs = 300, cacheSeconds, idempotent = true, ...init } = opts;

    return withLimit(async () => {
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
                console.warn('[safeFetch]', { url, attempt, code, ms });
                lastErr = e;
                if (!idempotent || attempt === retries) break;
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
