import { getPools } from "@/lib/coingecko";
import type { PoolRowProps } from './PoolsTableTypes';
import PoolsTableClient from './PoolsTableClient';

// Canonical ASX contracts only (exclude Ads Social or other symbol collisions)
const CANONICAL_ASX = new Set<string>([
    '0xebd3619642d78f0c98c84f6fa9a678653fb5a99b', // BSC
    '0xb28b43209d9de61306172af0320f4f55e50e2f29', // CORE
]);
function isCanonicalAsx(token: any | undefined) {
    return !!token?.address && CANONICAL_ASX.has(String(token.address).toLowerCase());
}

// (Type moved to PoolsTableTypes.ts to avoid circular client/server import)

// Formatting handled in client component

export async function PoolsTable() {
    const include = "base_token,quote_token,dex";
    const DEBUG = false; // set true for console diagnostics
    const [bsc, core] = await Promise.all([
        getPools("asx", "bsc", 1, include),
        getPools("asx", "core", 1, include)
    ]);

    const rows: PoolRowProps[] = [];
    function pushFrom(data: Awaited<ReturnType<typeof getPools>> | null, network: string) {
        if (!data) return;
        const included = data.included || [];
        const tokenMap: Record<string, any> = {};
        const dexMap: Record<string, any> = {};
        for (const inc of included) {
            if (inc.type === 'token') tokenMap[inc.id] = inc.attributes;
            if (inc.type === 'dex') dexMap[inc.id] = inc.attributes;
        }
        for (const d of (data.data || [])) {
            const attr: any = d.attributes || {};
            const rel: any = d.relationships || {};
            const baseId = rel.base_token?.data?.id;
            const quoteId = rel.quote_token?.data?.id;
            const base = baseId ? tokenMap[baseId] : undefined;
            const quote = quoteId ? tokenMap[quoteId] : undefined;
            const reserve = parseFloat(attr.reserve_in_usd || '0');
            // volume removed per requirement
            const baseIsAsx = isCanonicalAsx(base);
            const quoteIsAsx = isCanonicalAsx(quote);
            if (!baseIsAsx && !quoteIsAsx) continue; // exclude Ads Social
            // Price derivation: prefer the side that is ASX direct USD price
            let price: number | undefined; let derivation: string | undefined;
            if (baseIsAsx) {
                if (attr.base_token_price_usd) { price = parseFloat(attr.base_token_price_usd); derivation = 'base_token_price_usd'; }
                else if (attr.base_token_price_quote_token && attr.quote_token_price_usd) { price = parseFloat(attr.base_token_price_quote_token) * parseFloat(attr.quote_token_price_usd); derivation = 'ratio_baseQuote*quoteUSD'; }
            } else if (quoteIsAsx) {
                if (attr.quote_token_price_usd) { price = parseFloat(attr.quote_token_price_usd); derivation = 'quote_token_price_usd'; }
                else if (attr.quote_token_price_base_token && attr.base_token_price_usd) { const basePerQuote = parseFloat(attr.quote_token_price_base_token); if (basePerQuote > 0) { price = parseFloat(attr.base_token_price_usd) * basePerQuote; derivation = 'baseUSD*basePerQuote'; } }
            }
            const dexRelId = rel.dex?.data?.id;
            const dexAttr = dexRelId ? dexMap[dexRelId] : undefined;
            const dexName = dexAttr?.name || attr.dex_name || attr.dex || dexRelId;
            // Normalize so ASX shown first
            let baseSymbol = (base?.symbol || '?').toUpperCase();
            let quoteSymbol = (quote?.symbol || '?').toUpperCase();
            if (!baseIsAsx && quoteIsAsx) { [baseSymbol, quoteSymbol] = [quoteSymbol, baseSymbol]; }
            rows.push({ id: d.id, dex: dexName, baseSymbol, quoteSymbol, reserveUSD: reserve || undefined, price, derivation, network });
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log('POOL_DEBUG', { poolId: d.id, network, dex: dexName, baseIsAsx, quoteIsAsx, priceDerived: price, derivation, sampleAttrs: Object.fromEntries(Object.entries(attr).slice(0, 15)) });
            }
        }
    }
    pushFrom(bsc, 'BSC');
    pushFrom(core, 'CORE');

    // Hide pools below minimum liquidity requirement ($100) per requirement.
    const MIN_LIQUIDITY = 100;
    for (let i = rows.length - 1; i >= 0; i--) {
        if ((rows[i].reserveUSD || 0) < MIN_LIQUIDITY) rows.splice(i, 1);
    }
    // Default sort by liquidity descending.
    rows.sort((a, b) => (b.reserveUSD || 0) - (a.reserveUSD || 0));
    const now = new Date();
    return <PoolsTableClient initialRows={rows} updatedAt={now.toISOString()} />;
}
